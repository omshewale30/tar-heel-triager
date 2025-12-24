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
import re





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
    
    async def send_reply(self, original_email_id: str, body: str, 
                         importance: str = "normal") -> Dict[str, Any]:
        """
        Send TRUE REPLY to an existing email - maintains thread connection
        
        Uses /me/messages/{id}/reply endpoint instead of sendMail
        Automatically sets: In-Reply-To, References, Thread-Index headers
        """
        # First, get the original message to validate it exists and get thread info
        original_msg = await self._get_single_message(original_email_id)
        if not original_msg:
            return {"success": False, "message": "Original email not found"}
        
        # Format body as HTML for proper display
        formatted_body = self._format_as_html(body)
        
        payload = {
            "message": {
                "importance": importance.lower(),
                "body": {
                    "contentType": "html",
                    "content": formatted_body
                }
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/me/messages/{original_email_id}/reply",
                headers=self.headers,
                json=payload
            )
            
            return {
                "success": response.status_code in [200, 202],
                "status_code": response.status_code,
                "message": response.text if not response.is_success else "Reply sent successfully",
                "thread_id": original_msg.get("conversationId")
            }
    
    def _format_as_html(self, body: str) -> str:
        """Convert plain text to HTML with proper formatting"""
        # Check if already HTML
        if "<html" in body.lower() or "<p>" in body.lower() or "<br" in body.lower():
            return body
        
        # Escape HTML special characters
        escaped = body.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        
        # Convert markdown-style formatting
        lines = escaped.splitlines()
        html_lines = []
        
        for line in lines:
            # Convert **bold** to <strong>
            line = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', line)
            # Convert bullet points
            if line.strip().startswith('- ') or line.strip().startswith('• '):
                line = '• ' + line.strip()[2:]
            html_lines.append(line)
        
        # Join with <br> tags and wrap in paragraph
        formatted = "<br>".join(html_lines)
        return f"<div style='font-family: Calibri, Arial, sans-serif; font-size: 11pt;'>{formatted}</div>"

    async def _get_single_message(self, message_id: str) -> Dict[str, Any]:
        """Helper: Fetch single message by ID"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/me/messages/{message_id}",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json()
            return None



if __name__ == "__main__":
    reader = EmailReader()
    emails = asyncio.run(reader.get_unread_emails())
    print(emails)





