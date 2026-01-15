"""
FastAPI Backend for UNC Cashier Email Triage
Main triage endpoint and API routes
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
import json
from dotenv import load_dotenv
import httpx
from contextlib import asynccontextmanager
import logging
import asyncio

# Import our modules
from email_client import EmailClient
from classifier import EmailClassifier
from agent_handler import AzureAIFoundryAgent
from fastapi.middleware.cors import CORSMiddleware
from models import ApprovalQueue, EmailHistory, db
from azure.azure_ai_client import AzureAIClient
from email_engine import EmailEngine
from models import EmailTriageRequest, TriageResponse, ApproveResponse, RejectResponse, RedirectEmailRequest
from redirect_handler import RedirectHandler
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=10.0)
    yield
    await app.state.http_client.aclose()

app = FastAPI(
    title="Heelper AI API",
    description="Email triage and response system for Heelper AI",
    version="1.0.0",
    lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
# Initialize services

logging.basicConfig(level=logging.WARNING)

azure_ai_client = AzureAIClient()
classifier = EmailClassifier(llm=azure_ai_client.get_llm())
agent = AzureAIFoundryAgent(project_client=azure_ai_client.project_client)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Heelper API",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/approve-response")
async def approve_response(request: ApproveResponse, access_token: HTTPAuthorizationCredentials = Depends(security)):
    """
    Staff reviews and approves/edits response
    """
    try:
        approval = db.query(ApprovalQueue).filter_by(id=request.approval_id).first()
        
        if not approval:
            raise HTTPException(status_code=404, detail="Approval not found")
        
        # Use staff edits if provided, otherwise use AI-generated response
        final_response = request.staff_edits if request.staff_edits else approval.generated_response
        
        if not final_response:
            raise HTTPException(status_code=400, detail="No response to send")
        
        # Send via Microsoft Graph
        email_client = EmailClient(access_token=access_token.credentials)
        print(f"Sending email to {approval.sender_email} with subject {approval.subject} and body {final_response}")
        # Send reply using approval record data
        send_result = await email_client.send_reply(
            original_email_id=approval.email_id,
            body=final_response
        )

        if not send_result.get("success"):
            raise HTTPException(status_code=500, detail=f"Failed to send email: {send_result.get('message')}")
        #mark the email as read

        print(f"Marking email as read {approval.email_id}")
        mark_read_result = await email_client.mark_as_read(approval.email_id)
        if not mark_read_result:
            raise HTTPException(status_code=500, detail="Failed to mark email as read")

        print(f"Email marked as read {approval.email_id}")




        # Update approval record
        approval.approved = True
        approval.approved_at = datetime.now()
        approval.final_response = final_response

        #Add the email to email history
        email_history = EmailHistory(
            email_id=approval.email_id,
            subject=approval.subject,
            sender_email=approval.sender_email,
            route=approval.route,
            final_response=final_response,
            confidence=approval.confidence,
            approval_status='approved',
            processed_at=datetime.now()
        )
        db.add(email_history)

        print(f"Email history added {email_history.email_id}")
        db.commit()
        
        return {"status": "sent", "approval_id": request.approval_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/redirect-email")
async def redirect_email(request: RedirectEmailRequest, access_token: HTTPAuthorizationCredentials = Depends(security)):
    """
    Redirects an email to the appropriate department
    """
    print(f"Redirecting email {request.approval_id} to {request.redirect_department_email} with comment {request.comment}")
    try:
        redirect_handler = RedirectHandler(email_client=EmailClient(access_token=access_token.credentials))
        result = await redirect_handler.redirect_email(request)
        return result
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        print(f"Error in redirect_email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/approval-queue")
async def get_approval_queue(route: str = "AI_AGENT"):
    """
    Get pending emails that need to be approved, from most recent to oldest.
    Filter by route (AI_AGENT, REDIRECT, or HUMAN_REQUIRED). Defaults to AI_AGENT.
    """
    try:
        results = db.query(ApprovalQueue).filter_by(approved=False, rejected=False, route=route).order_by(ApprovalQueue.created_at.desc()).all()
        
        # Convert to dict for JSON serialization
        return [{
            'id': str(result.id),
            'email_id': result.email_id,
            'subject': result.subject,
            'sender_email': result.sender_email,
            'body': result.body,
            'generated_response': result.generated_response,
            'route': result.route,
            'redirect_department': result.redirect_department,
            'received_at': result.received_at.isoformat() if result.received_at else None,
            'confidence': result.confidence,
            'created_at': result.created_at.isoformat() if result.created_at else None
        } for result in results]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/fetch-triage-emails")
async def fetch_triage_emails(request: HTTPAuthorizationCredentials = Depends(security)):
    """
    Fetch emails, classify them, generate AI responses for eligible emails,
    and store in approval queue for staff review.
    
    Only AI_AGENT emails are stored. HUMAN_REQUIRED emails are skipped.
    """
    access_token = request.credentials
    if not access_token:
        raise HTTPException(status_code=401, detail="access_token is required")
    
    try:
        email_client = EmailClient(access_token=access_token)
        emails = await email_client.get_unread_emails()
        email_engine = EmailEngine(emails=emails, email_client=email_client, agent=agent, classifier=classifier)
        result = await email_engine.process_emails()
        return result


    except httpx.HTTPStatusError as e:
        print(f"Error fetching user emails: {e}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Graph API error: {e.response.text}")
    except Exception as e:
        db.rollback()  # Rollback on any error
        print(f"Error in fetch-triage-emails: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/fetch-triage-stream")
async def fetch_triage_stream(request: HTTPAuthorizationCredentials = Depends(security)):
    """
    SSE endpoint for real-time triage progress updates.
    Uses EmailEngine's streaming method.
    """
    access_token = request.credentials
    if not access_token:
        raise HTTPException(status_code=401, detail="access_token is required")

    async def event_generator():
        try:
            yield f"data: {json.dumps({'status': 'fetching', 'progress': 5, 'step': 'Fetching unread emails...'})}\n\n"
            
            email_client = EmailClient(access_token=access_token)
            emails = await email_client.get_unread_emails()
            
            if not emails:
                yield f"data: {json.dumps({'status': 'empty', 'message': 'You are all caught up! 🎉', 'progress': 100})}\n\n"
                return
            
            total = len(emails)
            yield f"data: {json.dumps({'status': 'found', 'count': total, 'progress': 10, 'step': f'Found {total} unread email(s)'})}\n\n"
            
            # Use EmailEngine's streaming method
            email_engine = EmailEngine(emails=emails, email_client=email_client, agent=agent, classifier=classifier)
            async for event in email_engine.process_emails_stream():
                yield event
                
        except Exception as e:
            db.rollback()
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
    )




@app.post("/reject-response")
async def reject_response(request: RejectResponse):
    """
    Rejects an email by marking it as rejected
    """
    try:
        approval = db.query(ApprovalQueue).filter_by(id=request.approval_id).first()
        if not approval:
            raise HTTPException(status_code=404, detail="Approval not found")
        
        approval.rejected = True
        approval.rejected_at = datetime.now()
        
        

        email_history = EmailHistory(
            email_id=approval.email_id,
            subject=approval.subject,
            sender_email=approval.sender_email,
            route=approval.route,
            redirect_department=approval.redirect_department,
            received_at=approval.received_at,
            final_response=None,
            confidence=approval.confidence,
            approval_status='rejected',
            processed_at=datetime.now()
        )
        db.add(email_history)

        print(f"Email history added {email_history.email_id}")

        print(f"Approval record updated {approval.email_id}")

        db.commit()

        print(f"Email marked as rejected {approval.email_id}")

        return {
            "status": "success",
            "message": "Email marked as rejected",
            "approval_id": request.approval_id
        }
    except Exception as e:
        db.rollback()
        print(f"Error in reject_response: {e}")
        raise HTTPException(status_code=500, detail=str(e))   
class DeleteApprovalRequest(BaseModel):
    approval_id: str


@app.delete("/delete-approval/{approval_id}")
async def delete_approval(approval_id: str):
    """
    Deletes an email from the approval queue without processing it
    """
    try:
        approval = db.query(ApprovalQueue).filter_by(id=approval_id).first()
        if not approval:
            raise HTTPException(status_code=404, detail="Approval not found")
        
        db.delete(approval)
        db.commit()
        
        return {
            "status": "success",
            "message": "Email deleted from approval queue",
            "approval_id": approval_id
        }
    except Exception as e:
        db.rollback()
        print(f"Error in delete_approval: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/email-history")
async def get_email_history():
    """
    Get email history - all processed emails (approved/rejected)
    Ordered from most recent to oldest
    """
    try:
        results = db.query(EmailHistory).order_by(EmailHistory.processed_at.desc()).all()
        
        return [{
            'id': str(result.id),
            'email_id': result.email_id,
            'conversation_id': result.conversation_id,
            'subject': result.subject,
            'sender_email': result.sender_email,
            'route': result.route,
            'final_response': result.final_response,
            'confidence': result.confidence,
            'approval_status': result.approval_status,
            'received_at': result.received_at.isoformat() if result.received_at else None,
            'processed_at': result.processed_at.isoformat() if result.processed_at else None
        } for result in results]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

