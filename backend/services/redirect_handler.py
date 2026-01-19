"""
Handles redirecting emails to the appropriate department
"""
from typing import Any
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from clients.email_client import EmailClient
from db import ApprovalQueue, EmailHistory
from schemas import RedirectEmailRequest


REDIRECT_EMAIL_ADDRESSES = {
    "Library": "library@unc.edu",
    "Parking & Transportation": "parking@unc.edu",
    "Housing": "housing@unc.edu",
    "Registrar": "registrar@unc.edu",
    "OSSA": "ossa@unc.edu",
}


class RedirectHandler:
    def __init__(self, email_client: EmailClient, db: Session):
        self.email_client = email_client
        self.db = db  # Store the injected session

    async def redirect_email(self, redirect_request: RedirectEmailRequest) -> dict[str, Any]:
        """
        Redirects an email to the appropriate department.
        - Forwards the email
        - Marks original as read
        - Updates approval record
        - Adds to email history
        """
        approval = self.db.query(ApprovalQueue).filter_by(id=redirect_request.approval_id).first()
        if not approval:
            raise HTTPException(status_code=404, detail="Approval not found")
        
        # Forward the email
        result = await self.email_client.forward_email(
            approval.email_id,
            redirect_request.redirect_department_email,
            redirect_request.comment
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message"))
        
        # Mark original email as read
        mark_read_result = await self.email_client.mark_as_read(approval.email_id)
        if not mark_read_result:
            raise HTTPException(status_code=500, detail="Failed to mark email as read")
        
        # Update approval record
        approval.approved = True
        approval.approved_at = datetime.now()
        approval.final_response = redirect_request.comment

        # Add to email history
        email_history = EmailHistory(
            email_id=approval.email_id,
            conversation_id=approval.conversation_id,
            conversation_index=approval.conversation_index,
            subject=approval.subject,
            sender_email=approval.sender_email,
            route=approval.route,
            redirect_department=approval.redirect_department,
            received_at=approval.received_at,
            final_response=f"Redirected to {redirect_request.redirect_department_email} with comment {redirect_request.comment}",
            confidence=approval.confidence,
            approval_status='redirected',
            processed_at=datetime.now()
        )
        self.db.add(email_history)
        self.db.commit()
        
        return {
            "status": "success",
            "message": "Email redirected successfully",
            "approval_id": redirect_request.approval_id
        }