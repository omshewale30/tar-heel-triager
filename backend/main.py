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
from agent_handler import agent
from fastapi.middleware.cors import CORSMiddleware
from models import ApprovalQueue, db

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
email_reader = EmailReader()
classifier = EmailClassifier()
priority_scorer = PriorityScorer()


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
        db.session.add(approval_record)
        db.session.commit()
        
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
async def approve_response(request: ApproveResponse):
    """
    Staff reviews and approves/edits response
    """
    try:
        approval = db.session.query(ApprovalQueue).filter_by(id=request.approval_id).first()
        
        if not approval:
            raise HTTPException(status_code=404, detail="Approval not found")
        
        # Use staff edits if provided, otherwise use AI-generated response
        final_response = request.staff_edits if request.staff_edits else approval.generated_response
        
        if not final_response:
            raise HTTPException(status_code=400, detail="No response to send")
        
        # Send via Microsoft Graph
        email = await email_reader.get_email(approval.email_id)
        if email:
            await email_reader.send_email(
                to=email.sender_email,
                subject=f"Re: {email.subject}",
                body=final_response,
                in_reply_to=approval.email_id
            )
        
        # Update approval record
        approval.approved = True
        approval.approved_at = datetime.now()
        approval.final_response = final_response
        db.session.commit()
        
        return {"status": "sent", "approval_id": request.approval_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/approval-queue")
async def get_approval_queue(route_filter: str = "all"):
    """
    Get pending emails grouped by route
    
    Args:
        route_filter: Filter by route ('all', 'auto_faq', 'manual', 'urgent')
    """
    try:
        query = db.session.query(ApprovalQueue).filter_by(approved=False)
        
        if route_filter != "all":
            query = query.filter_by(route=route_filter)
        
        results = query.order_by(ApprovalQueue.priority.desc()).all()
        
        # Convert to dict for JSON serialization
        return [{
            'id': str(result.id),
            'email_id': result.email_id,
            'subject': result.subject,
            'sender_email': result.sender_email,
            'body': result.body,
            'category': result.category,
            'priority': result.priority,
            'generated_response': result.generated_response,
            'route': result.route,
            'confidence': result.confidence,
            'agent_used': result.agent_used,
            'created_at': result.created_at.isoformat() if result.created_at else None
        } for result in results]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/fetch-user-emails")
async def fetch_user_emails(request: dict):
    """
    Fetches unreademails from the authenticated user's mailbox using their access token
    This uses delegated permissions (Mail.Read) - the user's token allows reading their own emails
    
    Args:
        request: { "access_token": "user's access token from MSAL" }
    """
    try:
        access_token = request.get('access_token')
        
        if not access_token:
            raise HTTPException(status_code=400, detail="access_token is required")
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }

        graph_url = "https://graph.microsoft.com/v1.0/me/messages"

        # Query for unread emails
        params = {
            "$filter": "isRead eq false"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(graph_url, headers=headers, params=params)

        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired access_token")
        
        response.raise_for_status()

        data = response.json()
        value = data.get("value", [])

        if not value:
            return {
                "email_count": 0,
                "emails": [],
                "message": "No unread emails found",
            }

        # Convert to simple dict format
        emails = []
        for msg in value:
            sender = (msg.get("from") or {}).get("emailAddress") or {}
            emails.append({
                "id": msg.get("id"),
                "subject": msg.get("subject") or "(No Subject)",
                "sender": sender.get("name") or "Unknown",
                "sender_email": sender.get("address") or "unknown@example.com",
                "received_at": msg.get("receivedDateTime"),
                "preview": (msg.get("bodyPreview") or "")[:100],
            })

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

