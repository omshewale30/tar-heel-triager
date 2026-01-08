#This file abstracts the email preprocessing like fetching, sending to the azure client and returns the result of fetch-traige

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
from dotenv import load_dotenv
import httpx
from contextlib import asynccontextmanager
import logging
from models import ApprovalQueue, EmailHistory, db
from email_reader import Email
import asyncio

# Import our modules
from email_reader import EmailReader
from models import ApprovalQueue, EmailHistory, db
load_dotenv()

class EmailEngine:

    def __init__(self,emails, email_reader,agent,classifier) -> None:
        self.email_reader= email_reader
        self.agent = agent
        self.emails = emails
        self.email_threads_dict = {}
        self.classifier = classifier
        self.counts = {"processed": 0, "skipped": 0, "human": 0, "redirect": 0, "ai_agent": 0}
    

    def is_duplicate(self, email_id: str) -> bool:
        """Check if email already exists in pending queue or history"""
        existing_pending = db.query(ApprovalQueue).filter_by(email_id=email_id, rejected=False, approved=False).first()
        existing_processed = db.query(EmailHistory).filter_by(email_id=email_id).first()
        return existing_pending is not None or existing_processed is not None


    # Fetch all threads in parallel
    async def fetch_thread(self, email):
        if not email.conversation_id:
            return email.id, []
        try:
            msgs = await self.email_reader.get_conversation_messages(email.conversation_id)
            return email.id, msgs
        except Exception as e:
            print(f"⚠️ Thread fetch failed for {email.id}: {e}")
            return email.id, []
    

    async def process_emails(self):

        results = await asyncio.gather(*[self.fetch_thread(email) for email in self.emails])

        self.email_threads_dict = dict(results)

        human_emails, agent_emails, redirect_emails = await self.classifier.classify_emails(self.emails, self.email_threads_dict, self.email_reader)

        self.process_redirect_emails(redirect_emails)
        self.process_human_emails(human_emails)
        await self.process_agent_emails(agent_emails)

        self.counts["processed"] = self.counts["redirect"] + self.counts["human"] + self.counts["ai_agent"]
        if self.counts["processed"] > 0:
            db.commit()

        return {
            "status": "success",
            "message": f"Processed {self.counts['processed']} emails ({self.counts['ai_agent']} AI, {self.counts['human']} human, {self.counts['redirect']} redirect), skipped {self.counts['skipped']}",
            "processed": self.counts["processed"],
            "ai_agent": self.counts["ai_agent"],
            "human_required": self.counts["human"],
            "redirect": self.counts["redirect"],
            "skipped": self.counts["skipped"]
        }
    

    def process_redirect_emails(self, redirect_emails):
        '''
        Process redirect emails and add to the approval queue  
        
        Args:
            redirect_emails: list of EmailClassification objects
        Returns:
            None
        '''
        for classification in redirect_emails:
            email = classification.email
            if self.is_duplicate(email.id):
                self.counts["skipped"] += 1
                continue
            
            db.add(ApprovalQueue(
                email_id=email.id,
                conversation_id=email.conversation_id,
                conversation_index=email.conversation_index,
                subject=email.subject,
                sender_email=email.sender_email,
                body=email.body,
                route='REDIRECT',
                redirect_department=classification.redirect_department,
                confidence=classification.confidence,
                agent_used=False,
                approved=False,
                created_at=datetime.now()
            ))
            self.counts["redirect"] += 1
        
    def process_human_emails(self, human_emails):

        '''
        Process human emails and add to the approval queue
        
        Args:
            human_emails: list of EmailClassification objects
        Returns:
            None
        '''
        for classification in human_emails:
            email = classification.email
            if self.is_duplicate(email.id):
                self.counts["skipped"] += 1
                continue
            
            db.add(ApprovalQueue(
                email_id=email.id,
                conversation_id=email.conversation_id,
                conversation_index=email.conversation_index,
                subject=email.subject,
                sender_email=email.sender_email,
                body=email.body,
                route='HUMAN_REQUIRED',
                confidence=classification.confidence,
                agent_used=False,
                approved=False,
                created_at=datetime.now()
            ))
            self.counts["human"] += 1

    async def process_agent_emails(self, agent_emails):
        '''
        Process agent emails and add to the approval queue
        
        Args:
            agent_emails: list of EmailClassification objects
        Returns:
            None  
        '''
        for classification in agent_emails:
            email = classification.email
            if self.is_duplicate(email.id):
                self.counts["skipped"] += 1
                continue
            
            # Fetch full thread context for the AI agent
            thread_context = ""
            thread_messages = self.email_threads_dict.get(email.id, [])
            if thread_messages:
                print(f"Thread messages: length {len(thread_messages)}")
                thread_context = self.email_reader.format_thread_context(thread_messages, email.id)
            
            # Generate AI response with thread context
            response = await self.agent.query_agent(email.subject, email.body, thread_context)
            
            if response and response.get('response'):
                db.add(ApprovalQueue(
                    email_id=email.id,
                    conversation_id=email.conversation_id,
                    conversation_index=email.conversation_index,
                    subject=email.subject,
                    sender_email=email.sender_email,
                    body=email.body,
                    route='AI_AGENT',
                    generated_response=response['response'],
                    confidence=classification.confidence,
                    agent_used=True,
                    approved=False,
                    created_at=datetime.now()
                ))
                self.counts["ai_agent"] += 1



