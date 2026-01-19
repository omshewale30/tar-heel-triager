"""
Email Classification Model using OpenAI
Classifies student billing emails and determines if they're FAQ-eligible
"""
import json
from typing import Any
from openai import AzureOpenAI
from schemas import Email, EmailClassification
from prompts import triage_prompt



class EmailClassifier:
    """Email classification using Azure AI Foundry llm"""
    
    def __init__(self, llm: AzureOpenAI):
        """
        Initialize classifier with Azure AI Foundry llm
        
        Args:
            llm: AzureOpenAI llm
        """
        self.llm = llm
    
    async def classify_emails(self, emails: list[Email], email_threads_dict: dict[str, list[dict[str, Any]]], email_reader) -> tuple[list[EmailClassification], list[EmailClassification], list[EmailClassification]]:
        """
        Classify emails, the llm will return a list of dictionaries, each dictionary is a classification result for an 
        email thread, the classification will be either 'AI_AGENT' or 'HUMAN_REQUIRED' or 'REDIRECT'
        
        Args:
            emails: List of Email objects to classify
            email_threads_dict: Dict mapping email_id -> list of thread messages
            email_reader: EmailReader instance for formatting thread context
        
        Returns:
            tuple[list[EmailClassification], list[EmailClassification], list[EmailClassification]]
        """
        prompt = triage_prompt
        agent_emails = []
        human_emails = []
        redirect_emails = []
        
        for email in emails:
            thread_messages = email_threads_dict.get(email.id, [])
            
            # Format context based on whether it's a thread or single email
            if thread_messages and len(thread_messages) > 1:
                # Multi-message thread - use full thread context for accurate classification
                user_content = email_reader.format_thread_classification_context(thread_messages, email.id)
            else:
                # Single email - just use subject and body
                usercontent = "=== EMAIL TO CLASSIFY (SINGLE MESSAGE) ===\n"
                usercontent += f"From: {email.sender} <{email.sender_email}>\n"
                usercontent += f"Date: {email.received_at}\n"
                usercontent += f"Subject: {email.subject}\n"
                usercontent += f"Body: {email.body}\n"
                usercontent += "=== END OF EMAIL ===\n"
                user_content = usercontent
            
            print(f'Thread context: {user_content}')
            
            try:
                response = self.llm.chat.completions.create(
                    model="gpt-5-chat",
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": user_content}
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
                continue

        return human_emails, agent_emails, redirect_emails
