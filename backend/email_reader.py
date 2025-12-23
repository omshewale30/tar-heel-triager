"""
Microsoft Graph Email Reader for UNC Cashier Email Triage
Fetches unread emails and marks them as read after processing
"""
from typing import Any, Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import os
from msgraph import GraphServiceClient
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv
from azure.identity import ClientSecretCredential
import asyncio
import httpx





@dataclass
class Email:
    id: str
    subject: str
    body: str
    sender: str
    sender_email: str
    received_at: str  # Kept as string for simplicity with JSON
    is_read: bool

class EmailReader:
    """
    Refactored to use the User's Access Token directly.
    """
    
    def __init__(self, access_token: str):
        """
        Initialize with the token sent from the Frontend.
        """
        self.access_token = access_token
        self.base_url = "https://graph.microsoft.com/v1.0"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Prefer": 'outlook.body-content-type="text"'
        }

    async def get_unread_emails(self, max_results: int = 10) -> List[Email]:
        async with httpx.AsyncClient() as client:
            params = {
                '$filter': 'isRead eq false',
                '$top': max_results,
                '$orderby': 'receivedDateTime desc',
                '$select': 'id,subject,bodyPreview,from,receivedDateTime,isRead,body'
            }
            
            response = await client.get(f"{self.base_url}/me/messages", headers=self.headers, params=params)
            
            # Handle the 401 we debugged earlier
            if response.status_code == 401:
                print("Token rejected by Graph")
                return []
                
            response.raise_for_status()
            data = response.json()
            
            emails = []
            for msg in data.get('value', []):
                sender_info = msg.get('from', {}).get('emailAddress', {})
                
                # Handle Body extraction safely
                body_content = msg.get('bodyPreview', "")
                if msg.get('body') and msg['body'].get('content'):
                    body_content = msg['body']['content']

                emails.append(Email(
                    id=msg.get('id'),
                    subject=msg.get('subject', '(No Subject)'),
                    body=body_content,
                    sender=sender_info.get('name', 'Unknown'),
                    sender_email=sender_info.get('address', 'unknown'),
                    received_at=msg.get('receivedDateTime'),
                    is_read=msg.get('isRead')
                ))
            
            return emails

    async def mark_as_read(self, email_id: str) -> bool:
        async with httpx.AsyncClient() as client:
            payload = {"isRead": True}
            response = await client.patch(
                f"{self.base_url}/me/messages/{email_id}", 
                headers=self.headers, 
                json=payload
            )
            return response.status_code == 200
    
    async def send_email_enhanced(self, to: List[str], subject: str, body: str,
                                cc: Optional[List[str]] = None,
                                bcc: Optional[List[str]] = None,
                                importance: str = "normal",
                                save_to_sent: bool = True,
                                reply_to: Optional[str] = None) -> Dict[str, Any]:
        """
        Enhanced send_email with full message capabilities
        """
        message = {
            "subject": subject,
            "body": {
                "contentType": "html" if "<html" in body else "text",
                "content": body
            },
            "importance": importance.lower()  # low, normal, high
        }
        
        # Recipients
        message["toRecipients"] = [{"emailAddress": {"address": addr}} for addr in to]
        if cc:
            message["ccRecipients"] = [{"emailAddress": {"address": addr}} for addr in cc]
        if bcc:
            message["bccRecipients"] = [{"emailAddress": {"address": addr}} for addr in bcc]
        if reply_to:
            message["replyTo"] = [{"emailAddress": {"address": reply_to}}]
        
        payload = {
            "message": message,
            "saveToSentItems": save_to_sent
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/me/sendMail",
                headers=self.headers,
                json=payload
            )
            
            return {
                "success": response.status_code in [200, 202],
                "status_code": response.status_code,
                "message": response.text if not response.is_success else "Email sent successfully"
            }


if __name__ == "__main__":
    reader = EmailReader()
    emails = asyncio.run(reader.get_unread_emails())
    print(emails)





