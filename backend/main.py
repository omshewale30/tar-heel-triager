"""
FastAPI Backend for UNC Cashier Email Triage
Main triage endpoint and API routes
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
from dotenv import load_dotenv
import httpx
from contextlib import asynccontextmanager

# Import our modules
from email_reader import EmailReader
from classifier import EmailClassifier
from priority_scorer import PriorityScorer
from agent_handler import AzureAIFoundryAgent
from fastapi.middleware.cors import CORSMiddleware
from models import ApprovalQueue, EmailHistory, db
from azure.azure_ai_client import AzureAIClient
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=10.0)
    yield
    await app.state.http_client.aclose()

app = FastAPI(
    title="UNC Cashier Email Triage API",
    description="Email triage and response system for UNC Cashier's Office",
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



priority_scorer = PriorityScorer()
azure_ai_client = AzureAIClient()
classifier = EmailClassifier(llm=azure_ai_client.get_llm())
agent = AzureAIFoundryAgent(project_client=azure_ai_client.project_client)
# Request/Response Models
class EmailTriageRequest(BaseModel):
    email_id: str
    subject: str
    body: str
    sender: str
    sender_email: str
    received_at: str


class TriageResponse(BaseModel):
    email_id: str
    category: str
    priority: int
    suggested_response: Optional[str]
    confidence: float
    requires_approval: bool
    route: str  # 'auto_faq' | 'manual' | 'urgent'


class ApproveResponse(BaseModel):
    approval_id: str
    staff_edits: Optional[str] = ""


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "UNC Cashier Email Triage API",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/triage-email", response_model=TriageResponse)
async def triage_email(request: EmailTriageRequest):
    """
    Main endpoint: classify → decide route → generate response if FAQ
    
    Routing logic:
    - HIGH priority (7+): → manual (urgent_queue)
    - Classified as FAQ + eligible: → agent (auto-generates response)
    - Complex/unsure: → manual (complex_queue)
    """
    try:
        # Step 1: Classify email
        classification = await classifier.classify_email(
            request.subject, 
            request.body
        )
        
        # Step 2: Score priority
        priority_data = priority_scorer.score({
            'subject': request.subject,
            'body': request.body,
            'sender_type': request.sender,
            'sender_email': request.sender_email
        })
        priority = priority_data['priority_level']
        
        # Step 3: Routing decision
        if priority >= 7:
            # URGENT: Send to manual review
            route = 'urgent'
            suggested_response = None
            confidence = 0.0
            agent_used = False
            
        elif classification['faq_eligible'] and classification['confidence'] > 0.85:
            # FAQ ELIGIBLE: Use Azure AI Foundry Agent
            route = 'auto_faq'
            agent_result = await agent.query_faq_agent(request.body)
            
            if agent_result.get('agent_used', False) and agent_result.get('response'):
                suggested_response = agent_result['response']
                confidence = agent_result.get('confidence', 0.85)
                agent_used = True
            else:
                # Fallback: agent failed
                route = 'manual'
                suggested_response = None
                confidence = 0.0
                agent_used = False
        
        else:
            # Complex case: Send to manual review
            route = 'manual'
            suggested_response = None
            confidence = 0.0
            agent_used = False
        
        # Step 4: Store in approval queue
        approval_record = ApprovalQueue(
            email_id=request.email_id,
            subject=request.subject,
            sender_email=request.sender_email,
            body=request.body,
            category=classification['category'],
            priority=priority,
            generated_response=suggested_response,
            route=route,
            confidence=confidence,
            agent_used=agent_used,
            requires_approval=True,
            created_at=datetime.now()
        )
        db.add(approval_record)
        db.commit()
        
        return TriageResponse(
            email_id=request.email_id,
            category=classification['category'],
            priority=priority,
            suggested_response=suggested_response,
            confidence=confidence,
            requires_approval=True,
            route=route
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        email_reader = EmailReader(access_token=access_token.credentials)
        print(f"Sending email to {approval.sender_email} with subject {approval.subject} and body {final_response}")
        # Send reply using approval record data
        send_result = await email_reader.send_email_enhanced(
            to=[approval.sender_email],
            subject=f"Re: {approval.subject}",
            body=final_response
        )

        if not send_result.get("success"):
            raise HTTPException(status_code=500, detail=f"Failed to send email: {send_result.get('message')}")
        #mark the email as read

        print(f"Marking email as read {approval.email_id}")
        mark_read_result = await email_reader.mark_as_read(approval.email_id)
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


@app.get("/approval-queue")
async def get_approval_queue():
    """
    Get pending emails that need to be approved, from most recent to oldest
    """
    try:
        results = db.query(ApprovalQueue).filter_by(approved=False).order_by(ApprovalQueue.created_at.desc()).all()
        
        # Convert to dict for JSON serialization
        return [{
            'id': str(result.id),
            'email_id': result.email_id,
            'subject': result.subject,
            'sender_email': result.sender_email,
            'body': result.body,
            'generated_response': result.generated_response,
            'route': result.route,
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
        email_reader = EmailReader(access_token=access_token)
        emails = await email_reader.get_unread_emails()
        
        if not emails:
            return {
                "status": "success",
                "message": "No unread emails found",
                "processed": 0,
                "human_skipped": 0
            }

        # Classify emails into HUMAN_REQUIRED and AI_AGENT
        human_emails, agent_emails = await classifier.classify_emails(emails)
        
        processed_count = 0
        
        # Process only AI_AGENT emails - generate responses and store
        for classification in agent_emails:
            email = classification.email
            
            # Generate AI response
            response = await agent.query_agent(email.subject, email.body)
            
            if response and response.get('response'):
                # Create approval record matching the schema
                approval_record = ApprovalQueue(
                    email_id=email.id,
                    subject=email.subject,
                    sender_email=email.sender_email,
                    body=email.body,  # Original email body
                    route='AI_AGENT',
                    generated_response=response['response'],  # AI-generated response
                    confidence=classification.confidence,
                    agent_used=True,
                    approved=False,
                    created_at=datetime.now()
                )
                db.add(approval_record)
                processed_count += 1
        
        # Commit all records at once
        if processed_count > 0:
            db.commit()
        
        return {
            "status": "success",
            "message": f"Processed {processed_count} emails for AI response",
            "processed": processed_count,
            "human_skipped": len(human_emails)
        }

    except httpx.HTTPStatusError as e:
        print(f"Error fetching user emails: {e}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Graph API error: {e.response.text}")
    except Exception as e:
        db.rollback()  # Rollback on any error
        print(f"Error in fetch-triage-emails: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/fetch-user-emails")
async def fetch_user_emails(request: HTTPAuthorizationCredentials = Depends(security)):
    """
    Fetches unreademails from the authenticated user's mailbox using their access token
    This uses delegated permissions (Mail.Read) - the user's token allows reading their own emails
    
    Args:
        request: HTTPAuthorizationCredentials
    """
    try:
        access_token = request.credentials

        if not access_token:
            raise HTTPException(status_code=401, detail="Invalid or expired access_token")
        
        email_reader = EmailReader(access_token=access_token)
        if not email_reader:
            raise HTTPException(status_code=400, detail="access_token is required")
        emails = await email_reader.get_unread_emails()

    
        return {
            "email_count": len(emails),
            "emails": emails,
            "message": f"Successfully fetched {len(emails)} unread email(s)",
        }

    except httpx.HTTPStatusError as e:
        print(f"Error fetching user emails: {e}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Graph API error: {e.response.text}")


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

