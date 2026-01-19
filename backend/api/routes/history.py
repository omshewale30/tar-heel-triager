'''
History routes for the backend
/email-history
'''
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db, EmailHistory

router = APIRouter(tags=["history"])
@router.get("/email-history")
async def get_email_history(db: Session = Depends(get_db)):

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