'''
Redirect routes for the backend
/redirect-email
'''
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from schemas import RedirectEmailRequest
from clients.email_client import EmailClient
from services.redirect_handler import RedirectHandler
from api.dependencies import get_email_client
from db import get_db
from sqlalchemy.orm import Session
router = APIRouter(tags=["redirect"])

@router.post("/redirect-email")
async def redirect_email(
    request: RedirectEmailRequest,
    email_client: EmailClient = Depends(get_email_client),
    db: Session = Depends(get_db)
):
    """
    Redirects an email to the appropriate department
    """
    redirect_handler = RedirectHandler(email_client=email_client, db=db)  # Pass db here
    result = await redirect_handler.redirect_email(request)
    return result