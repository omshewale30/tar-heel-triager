'''
Dependencies for the backend
'''
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from db import get_db
from clients.email_client import EmailClient
from services.email_engine import EmailEngine
from services.classifier import EmailClassifier
from services.agent_handler import AzureAIFoundryAgent
from typing import List
from models import Email
from clients.azure_ai_client import AzureAIClient
from openai import AzureOpenAI
from azure.ai.projects import AIProjectClient
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



def get_email_engine(emails: List[Email], email_client: EmailClient = Depends(get_email_client), classifier: EmailClassifier = Depends(get_classifier), agent: AzureAIFoundryAgent = Depends(get_agent)):
    return EmailEngine(emails=emails, email_client=email_client, classifier=classifier, agent=agent)
