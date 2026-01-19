from fastapi import APIRouter, Depends, HTTPException, StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials
from clients.email_client import EmailClient
from api.dependencies import get_email_client
from db import get_db
from sqlalchemy.orm import Session
from email_engine import EmailEngine
import json

router = APIRouter(tags=["triage"])


@router.get("/fetch-triage-stream")
async def fetch_triage_stream(
    email_client: EmailClient = Depends(get_email_client),
    db: Session = Depends(get_db)
):
    async def event_generator():
        try:
            yield f"data: {json.dumps({'status': 'fetching', 'progress': 5, 'step': 'Fetching unread emails...'})}\n\n"
            
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
