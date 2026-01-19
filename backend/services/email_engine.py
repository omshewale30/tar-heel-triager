#This file abstracts the email preprocessing like fetching, sending to the azure client and returns the result of fetch-triage
#TODO: add a function to check if the email is already in the approval queue or history
from datetime import datetime
from typing import Optional, AsyncGenerator, Dict, Any
import asyncio
import json

from models import ApprovalQueue, EmailHistory, db
from email_client import EmailClient
from models import Email

class EmailEngine:

    def __init__(self,emails, email_client,agent,classifier) -> None:
        self.email_client= email_client
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
            msgs = await self.email_client.get_conversation_messages(email.conversation_id)
            return email.id, msgs
        except Exception as e:
            print(f"⚠️ Thread fetch failed for {email.id}: {e}")
            return email.id, []
    

    async def process_emails(self):
        """Non-streaming version for regular endpoint"""
        results = await asyncio.gather(*[self.fetch_thread(email) for email in self.emails])
        self.email_threads_dict = dict(results)

        human_emails, agent_emails, redirect_emails = await self.classifier.classify_emails(self.emails, self.email_threads_dict, self.email_client)

        self.process_redirect_emails(redirect_emails)
        self.process_human_emails(human_emails)
        await self.process_agent_emails(agent_emails)

        self.counts["processed"] = self.counts["redirect"] + self.counts["human"] + self.counts["ai_agent"]
        if self.counts["processed"] > 0:
            db.commit()

        return self._get_result()

    async def process_emails_stream(self) -> AsyncGenerator[str, None]:
        """Streaming version that yields SSE progress events"""
        try:
            # Step 1: Fetch threads
            yield self._sse_event({'progress': 15, 'step': 'Fetching conversation threads...'})
            results = await asyncio.gather(*[self.fetch_thread(email) for email in self.emails])
            self.email_threads_dict = dict(results)

            # Step 2: Classify
            yield self._sse_event({'progress': 30, 'step': 'Classifying emails...'})
            human_emails, agent_emails, redirect_emails = await self.classifier.classify_emails(
                self.emails, self.email_threads_dict, self.email_client
            )
            
            yield self._sse_event({
                'progress': 50, 
                'step': f'Classified: {len(agent_emails)} AI, {len(human_emails)} human, {len(redirect_emails)} redirect'
            })

            # Step 3: Process redirect emails
            yield self._sse_event({'progress': 55, 'step': 'Processing redirect emails...'})
            self.process_redirect_emails(redirect_emails)

            # Step 4: Process human emails
            yield self._sse_event({'progress': 65, 'step': 'Processing human-required emails...'})
            self.process_human_emails(human_emails)

            # Step 5: Process AI agent emails with per-email progress
            total_agent = len(agent_emails)
            for i, classification in enumerate(agent_emails):
                progress = 70 + int((i / max(total_agent, 1)) * 25)
                yield self._sse_event({'progress': progress, 'step': f'Generating AI response {i+1}/{total_agent}...'})
                await self._process_single_agent_email(classification)

            # Commit and complete
            self.counts["processed"] = self.counts["redirect"] + self.counts["human"] + self.counts["ai_agent"]
            if self.counts["processed"] > 0:
                db.commit()

            yield self._sse_event({'status': 'done', 'progress': 100, 'step': 'Complete!', 'results': self.counts})

        except Exception as e:
            db.rollback()
            yield self._sse_event({'status': 'error', 'message': str(e)})

    def _sse_event(self, data: Dict[str, Any]) -> str:
        """Format data as SSE event"""
        return f"data: {json.dumps(data)}\n\n"

    def _get_result(self) -> Dict[str, Any]:
        """Return final result dict"""
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
                received_at=email.received_at,
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
                received_at=email.received_at,
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
            await self._process_single_agent_email(classification)

    async def _process_single_agent_email(self, classification):
        '''Process a single agent email classification'''
        email = classification.email
        if self.is_duplicate(email.id):
            self.counts["skipped"] += 1
            return
        
        # Fetch full thread context for the AI agent
        thread_context = ""
        thread_messages = self.email_threads_dict.get(email.id, [])
        if thread_messages:
            print(f"Thread messages: length {len(thread_messages)}")
            thread_context = self.email_client.format_thread_context(thread_messages, email.id)
        
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
                received_at=email.received_at,
                generated_response=response['response'],
                confidence=classification.confidence,
                agent_used=True,
                approved=False,
                created_at=datetime.now()
            ))
            self.counts["ai_agent"] += 1



