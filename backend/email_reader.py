"""
Microsoft Graph Email Reader for UNC Cashier Email Triage
Fetches unread emails and marks them as read after processing
"""
from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime
import os
from msgraph import GraphServiceClient
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv
from azure.identity import ClientSecretCredential
import asyncio




@dataclass
class Email:
    """Email data structure"""
    id: str
    subject: str
    body: str
    sender: str
    sender_email: str
    received_at: datetime
    is_read: bool


class EmailReader:
    """Async email reader using Microsoft Graph API"""
    
    def __init__(self, client: Optional[GraphServiceClient] = None):
        """
        Initialize email reader with Microsoft Graph client.
        Uses Azure AD for authentication.
        """
        if client is None:
            credential = DefaultAzureCredential()
            self.client = GraphServiceClient(credential)
        else:
            self.client = client
        
        self.mailbox_folder = os.getenv('MAILBOX_FOLDER', 'Inbox')
    
    async def get_unread_emails(self, max_results: int = 50) -> List[Email]:
        """
        Fetch unread emails from mailbox
        
        Args:
            max_results: Maximum number of emails to retrieve
        
        Returns:
            List of Email objects
        """
        try:
            # Query for unread emails
            query_params = {
                '$filter': 'isRead eq false',
                '$top': max_results,
                '$orderby': 'receivedDateTime desc'
            }
            
            messages = await self.client.me.mail_folders.by_mail_folder_id(
                self.mailbox_folder
            ).messages.get(query_params)
            
            emails = []
            for msg in messages.value:
                email = Email(
                    id=msg.id,
                    subject=msg.subject or "(No Subject)",
                    body=self._extract_body(msg),
                    sender=msg.sender.email_address.name,
                    sender_email=msg.sender.email_address.address,
                    received_at=msg.received_date_time,
                    is_read=msg.is_read
                )
                emails.append(email)
            
            return emails
        
        except Exception as e:
            print(f"Error fetching emails: {e}")
            return []
    
    async def mark_as_read(self, email_id: str) -> bool:
        """
        Mark an email as read
        
        Args:
            email_id: ID of the email to mark as read
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Update email to mark as read
            body = {"isRead": True}
            await self.client.me.messages.by_message_id(email_id).patch(body)
            return True
        
        except Exception as e:
            print(f"Error marking email as read: {e}")
            return False
    
    async def get_email(self, email_id: str) -> Optional[Email]:
        """
        Fetch a specific email by ID
        
        Args:
            email_id: ID of the email
        
        Returns:
            Email object or None if not found
        """
        try:
            msg = await self.client.me.messages.by_message_id(email_id).get()
            
            return Email(
                id=msg.id,
                subject=msg.subject or "(No Subject)",
                body=self._extract_body(msg),
                sender=msg.sender.email_address.name,
                sender_email=msg.sender.email_address.address,
                received_at=msg.received_date_time,
                is_read=msg.is_read
            )
        
        except Exception as e:
            print(f"Error fetching email: {e}")
            return None
    
    async def send_email(
        self, 
        to: str, 
        subject: str, 
        body: str, 
        in_reply_to: Optional[str] = None
    ) -> bool:
        """
        Send an email via Microsoft Graph
        
        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body
            in_reply_to: ID of email being replied to
        
        Returns:
            True if successful, False otherwise
        """
        try:
            message = {
                "toRecipients": [{"emailAddress": {"address": to}}],
                "subject": subject,
                "body": {
                    "content": body,
                    "contentType": "text"
                }
            }
            
            if in_reply_to:
                # Get the original message
                original_msg = await self.client.me.messages.by_message_id(in_reply_to).get()
                message["replyTo"] = [original_msg.from_]
            
            await self.client.me.send_mail.post(message)
            return True
        
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    def _extract_body(self, msg) -> str:
        """Extract email body from message object"""
        if msg.body_preview:
            # Return preview if full body not available
            return msg.body_preview
        
        if hasattr(msg, 'body') and msg.body:
            return msg.body.content
        
        return ""


if __name__ == "__main__":
    reader = EmailReader()
    emails = asyncio.run(reader.get_unread_emails())
    print(emails)