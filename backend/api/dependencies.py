'''
Dependencies for the backend
'''
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from db import get_db
from clients.email_client import EmailClient
from clients.azure_ai_client import AzureAIClient
security = HTTPBearer()
_azure_ai_client : AzureAIClient | None = None


def get_azure_ai_client():
    global _azure_ai_client
    if _azure_ai_client is None:
        _azure_ai_client = AzureAIClient()
    return _azure_ai_client


def get_email_client(credentials: HTTPAuthorizationCredentials = Depends(security)):
    access_token = credentials.credentials
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token is required")
    return EmailClient(access_token)

