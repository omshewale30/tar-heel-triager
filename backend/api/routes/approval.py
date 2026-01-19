"""
Approval routes for the backend
/approve-response, /reject-response, /delete-approval
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from schemas import ApproveResponse, RejectResponse
from db import get_db, EmailHistory, ApprovalQueue
from clients.email_client import EmailClient
from api.dependencies import get_email_client

router = APIRouter(tags=["approval"])


@router.post("/approve-response")
async def approve_response(
    request: ApproveResponse,
    email_client: EmailClient = Depends(get_email_client),
    db: Session = Depends(get_db)
):
    """
    Staff reviews and approves/edits response
    """
    approval = db.query(ApprovalQueue).filter_by(id=request.approval_id).first()
    
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    # Use staff edits if provided, otherwise use AI-generated response
    final_response = request.staff_edits if request.staff_edits else approval.generated_response
    
    if not final_response:
        raise HTTPException(status_code=400, detail="No response to send")
    
    # Send via Microsoft Graph
    send_result = await email_client.send_reply(
        original_email_id=approval.email_id,
        body=final_response
    )

    if not send_result.get("success"):
        raise HTTPException(status_code=500, detail=f"Failed to send email: {send_result.get('message')}")
    
    # Mark the email as read
    mark_read_result = await email_client.mark_as_read(approval.email_id)
    if not mark_read_result:
        raise HTTPException(status_code=500, detail="Failed to mark email as read")

    # Update approval record
    approval.approved = True
    approval.approved_at = datetime.now()
    approval.final_response = final_response

    # Add the email to email history
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
    db.commit()
    
    return {"status": "sent", "approval_id": request.approval_id}


@router.post("/reject-response")
async def reject_response(
    request: RejectResponse,
    db: Session = Depends(get_db)
):
    """
    Rejects an email by marking it as rejected
    """
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
    db.commit()

    return {
        "status": "success",
        "message": "Email marked as rejected",
        "approval_id": request.approval_id
    }


@router.delete("/delete-approval/{approval_id}")
async def delete_approval(
    approval_id: str,
    db: Session = Depends(get_db)
):
    """
    Deletes an email from the approval queue without processing it
    """
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

@router.get("/approval-queue")
async def get_approval_queue(route: str = "AI_AGENT", db: Session = Depends(get_db)):
    """
    Get pending emails that need to be approved, from most recent to oldest.
        Filter by route (AI_AGENT, REDIRECT, or HUMAN_REQUIRED). Defaults to AI_AGENT.
        """
    results = db.query(ApprovalQueue).filter_by(approved=False, rejected=False, route=route).order_by(ApprovalQueue.created_at.desc()).all()
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

 