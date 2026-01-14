#This file handles the redirecting of emails to the appropriate department
#We can handle the forward of the email
from email_client import EmailClient
from typing import Any
from datetime import datetime
from models import ApprovalQueue, db, EmailHistory, RedirectEmailRequest
from fastapi import HTTPException



redirect_email_address_dict = {
    "Library": "library@unc.edu",
    "Parking & Transportation": "parking@unc.edu",
    "Housing": "housing@unc.edu",
    "Registrar": "registrar@unc.edu",
    "OSSA": "ossa@unc.edu",
}



class RedirectHandler:
    def __init__(self, email_client: EmailClient):
        self.email_client = email_client
  

    async def redirect_email(self, redirect_request:RedirectEmailRequest ) -> dict[str, Any]:

        '''
        Redirects an email to the appropriate department
        Marks the original email as read

        updates the Approval with approved = True
        updates the Approval with approved_at = datetime.now()
        updates the Approval with final_response = comment
        adds the email to the EmailHistory table

        '''
        try:
            approval = db.query(ApprovalQueue).filter_by(id=redirect_request.approval_id).first()
            if not approval:
                raise HTTPException(status_code=404, detail="Approval not found")
            result = await self.email_client.forward_email(approval.email_id, redirect_request.redirect_department_email, redirect_request.comment)
            if not result.get("success"):
                raise HTTPException(status_code=500, detail=result.get("message"))
            #mark the original email as read
            mark_read_result = await self.email_client.mark_as_read(approval.email_id)
            if not mark_read_result:
                raise HTTPException(status_code=500, detail="Failed to mark email as read")
            #update the Approval with approved = True
            approval.approved = True
            approval.approved_at = datetime.now()
            approval.final_response = redirect_request.comment

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
            db.add(email_history)
            db.commit()
            return {
                "status": "success",
                "message": "Email redirected successfully",
                "approval_id": redirect_request.approval_id
            }
        except Exception as e:
            db.rollback()
            print(f"Error in redirect_email: {e}")
            raise HTTPException(status_code=500, detail=str(e))