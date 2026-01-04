"""
Email Classification Model using OpenAI
Classifies student billing emails and determines if they're FAQ-eligible
"""
import json
import os
from typing import Dict, Optional
from openai import AzureOpenAI
from dotenv import load_dotenv
from azure.azure_ai_client import AzureAIClient
from email_reader import Email
from pydantic import BaseModel
from prompts import triage_prompt

load_dotenv()


class EmailClassification(BaseModel):
    email_id: str
    email: Email
    route: str
    confidence: float
    reason: str
    redirect_department: Optional[str] = None

class EmailClassifier:
    """Email classification using Azure AI Foundry llm"""
    
    def __init__(self, llm: AzureOpenAI):
        """
        Initialize classifier with Azure AI Foundry llm
        
        Args:
            llm: AzureOpenAI llm
        """

        
        self.llm = llm
    
    async def classify_emails(self, emails: list[Email]) -> tuple[list[EmailClassification], list[EmailClassification], list[EmailClassification]]:
        """
        Classify emails, the llm will return a list of dictionaries, each dictionary is a classification result for an 
        email thread, the classification will be either 'AI_AGENT' or 'HUMAN_REQUIRED' or 'REDIRECT'
        
        Returns:
            tuple[list[EmailClassification], list[EmailClassification], list[EmailClassification]]
        """
        prompt = triage_prompt
        classifications = []
        agent_emails = []
        human_emails = []
        redirect_emails = []
        for email in emails:
            try:
                response = self.llm.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": f"Subject: {email.subject}\nBody: {email.body}"}
                    ]
                )
                # Parse the JSON string response
                result = json.loads(response.choices[0].message.content)
                if result['route'] == 'AI_AGENT':
                    agent_emails.append(
                        EmailClassification(
                            email_id=email.id,
                            email=email,
                            route='AI_AGENT',
                            confidence=result['confidence'],
                            reason=result['reason']
                        )
                    )
                elif result['route'] == 'HUMAN_REQUIRED':
                    human_emails.append(
                    EmailClassification(
                        email_id=email.id,
                        email=email,
                        route='HUMAN_REQUIRED',
                        confidence=result['confidence'],
                        reason=result['reason']
                    ))
                elif result['route'] == 'REDIRECT':
                    redirect_emails.append(EmailClassification(
                        email_id=email.id,
                        email=email,
                        route='REDIRECT',
                        redirect_department=result['department'],
                        confidence=result['confidence'],
                        reason=result['reason']
                    ))
                
            except Exception as e:
                print(f"Error classifying email: {e}")
                classifications.append(EmailClassification(
                    email_id=email.id,
                    email=email,
                    route='HUMAN_REQUIRED',
                    confidence=0.0,
                    reason=f'Classification error: {str(e)}'
                ))
                continue

        return human_emails, agent_emails, redirect_emails
