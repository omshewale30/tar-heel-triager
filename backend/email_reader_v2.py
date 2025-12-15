"""
Microsoft Graph Email Reader for UNC Cashier Email Triage
Supports multiple authentication methods for different scenarios
"""
from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime
import os
from msgraph import GraphServiceClient
from azure.identity import (
    DefaultAzureCredential,
    ClientSecretCredential,
    DeviceCodeCredential,
    UsernamePasswordCredential
)
from dotenv import load_dotenv

load_dotenv()


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
    
    def __init__(self, client: Optional[GraphServiceClient] = None, auth_mode: str = "auto"):
        """
        Initialize email reader with Microsoft Graph client.
        
        Args:
            client: Optional pre-configured GraphServiceClient
            auth_mode: Authentication mode
                - "auto": Try DefaultAzureCredential (for app permissions)
                - "client_secret": Use client secret (for app permissions)
                - "device_code": Interactive device code flow (for testing)
                - "username_password": Username/password (for service account)
        """
        if client is None:
            credential = self._get_credential(auth_mode)
            self.client = GraphServiceClient(credential)
        else:
            self.client = client
        
        self.mailbox_folder = os.getenv('MAILBOX_FOLDER', 'Inbox')
        self.auth_mode = auth_mode
    
    def _get_credential(self, auth_mode: str):
        """Get appropriate credential based on auth mode"""
        tenant_id = os.getenv('AZURE_TENANT_ID')
        client_id = os.getenv('AZURE_CLIENT_ID')
        
        if auth_mode == "client_secret":
            # For Application Permissions (Mail.Read as Application)
            client_secret = os.getenv('AZURE_CLIENT_SECRET')
            if not client_secret:
                raise ValueError("AZURE_CLIENT_SECRET not found in environment")
            
            print(f"🔐 Using Client Secret authentication (Application permissions)")
            return ClientSecretCredential(
                tenant_id=tenant_id,
                client_id=client_id,
                client_secret=client_secret
            )
        
        elif auth_mode == "device_code":
            # For testing with Delegated Permissions
            print(f"🔐 Using Device Code authentication (Interactive)")
            return DeviceCodeCredential(
                tenant_id=tenant_id,
                client_id=client_id
            )
        
        elif auth_mode == "username_password":
            # For Delegated Permissions with service account
            username = os.getenv('MAILBOX_USERNAME')
            password = os.getenv('MAILBOX_PASSWORD')
            
            if not username or not password:
                raise ValueError("MAILBOX_USERNAME and MAILBOX_PASSWORD required for username_password mode")
            
            print(f"🔐 Using Username/Password authentication for {username}")
            return UsernamePasswordCredential(
                client_id=client_id,
                username=username,
                password=password,
                tenant_id=tenant_id
            )
        
        else:  # "auto"
            # Try DefaultAzureCredential (works for app permissions)
            print(f"🔐 Using DefaultAzureCredential (auto-detect)")
            return DefaultAzureCredential()
    
    async def get_unread_emails(self, max_results: int = 50) -> List[Email]:
        """
        Fetch unread emails from mailbox
        
        Args:
            max_results: Maximum number of emails to retrieve
        
        Returns:
            List of Email objects
        """
        try:
            print(f"📧 Fetching unread emails (max: {max_results})...")
            
            # Query for unread emails
            query_params = {
                '$filter': 'isRead eq false',
                '$top': max_results,
                '$orderby': 'receivedDateTime desc',
                '$select': 'id,subject,from,receivedDateTime,isRead,body,bodyPreview'
            }
            
            # For delegated permissions, use .me
            # For application permissions, use .users.by_user_id(email)
            if self.auth_mode in ["device_code", "username_password"]:
                messages = await self.client.me.messages.get(
                    request_configuration=lambda config: setattr(config, 'query_parameters', query_params)
                )
            else:
                # For app permissions, need to specify which user's mailbox
                mailbox_email = os.getenv('MAILBOX_EMAIL', 'cashier@unc.edu')
                messages = await self.client.users.by_user_id(mailbox_email).messages.get(
                    request_configuration=lambda config: setattr(config, 'query_parameters', query_params)
                )
            
            if not messages or not messages.value:
                print("📭 No unread emails found")
                return []
            
            emails = []
            for msg in messages.value:
                email = Email(
                    id=msg.id,
                    subject=msg.subject or "(No Subject)",
                    body=self._extract_body(msg),
                    sender=msg.from_.email_address.name if msg.from_ else "Unknown",
                    sender_email=msg.from_.email_address.address if msg.from_ else "unknown@example.com",
                    received_at=msg.received_date_time,
                    is_read=msg.is_read
                )
                emails.append(email)
            
            print(f"✓ Found {len(emails)} unread email(s)")
            return emails
        
        except Exception as e:
            print(f"❌ Error fetching emails: {e}")
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
            from msgraph.generated.models.message import Message
            
            message = Message()
            message.is_read = True
            
            if self.auth_mode in ["device_code", "username_password"]:
                await self.client.me.messages.by_message_id(email_id).patch(message)
            else:
                mailbox_email = os.getenv('MAILBOX_EMAIL', 'cashier@unc.edu')
                await self.client.users.by_user_id(mailbox_email).messages.by_message_id(email_id).patch(message)
            
            return True
        
        except Exception as e:
            print(f"❌ Error marking email as read: {e}")
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
            if self.auth_mode in ["device_code", "username_password"]:
                msg = await self.client.me.messages.by_message_id(email_id).get()
            else:
                mailbox_email = os.getenv('MAILBOX_EMAIL', 'cashier@unc.edu')
                msg = await self.client.users.by_user_id(mailbox_email).messages.by_message_id(email_id).get()
            
            return Email(
                id=msg.id,
                subject=msg.subject or "(No Subject)",
                body=self._extract_body(msg),
                sender=msg.from_.email_address.name if msg.from_ else "Unknown",
                sender_email=msg.from_.email_address.address if msg.from_ else "unknown@example.com",
                received_at=msg.received_date_time,
                is_read=msg.is_read
            )
        
        except Exception as e:
            print(f"❌ Error fetching email: {e}")
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
            from msgraph.generated.users.item.send_mail.send_mail_post_request_body import SendMailPostRequestBody
            from msgraph.generated.models.message import Message
            from msgraph.generated.models.recipient import Recipient
            from msgraph.generated.models.email_address import EmailAddress
            from msgraph.generated.models.item_body import ItemBody
            from msgraph.generated.models.body_type import BodyType
            
            # Create message
            message = Message()
            message.subject = subject
            
            # Set body
            message.body = ItemBody()
            message.body.content_type = BodyType.Text
            message.body.content = body
            
            # Set recipient
            to_recipient = Recipient()
            to_recipient.email_address = EmailAddress()
            to_recipient.email_address.address = to
            message.to_recipients = [to_recipient]
            
            # Create request body
            request_body = SendMailPostRequestBody()
            request_body.message = message
            
            if self.auth_mode in ["device_code", "username_password"]:
                await self.client.me.send_mail.post(request_body)
            else:
                mailbox_email = os.getenv('MAILBOX_EMAIL', 'cashier@unc.edu')
                await self.client.users.by_user_id(mailbox_email).send_mail.post(request_body)
            
            print(f"✓ Email sent to {to}")
            return True
        
        except Exception as e:
            print(f"❌ Error sending email: {e}")
            return False
    
    def _extract_body(self, msg) -> str:
        """Extract email body from message object"""
        if hasattr(msg, 'body') and msg.body and msg.body.content:
            return msg.body.content
        
        if hasattr(msg, 'body_preview') and msg.body_preview:
            return msg.body_preview
        
        return ""


# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def test():
        # For testing with delegated permissions
        reader = EmailReader(auth_mode="device_code")
        emails = await reader.get_unread_emails(max_results=5)
        
        for email in emails:
            print(f"\nSubject: {email.subject}")
            print(f"From: {email.sender_email}")
            print(f"Preview: {email.body[:100]}...")
    
    asyncio.run(test())
