    
"""
Microsoft Graph Email Reader for UNC Cashier Email Triage


"""
from typing import Any
import asyncio
import httpx
from schemas import Email
from services.formatter import format_as_html

class EmailClient:
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

    async def get_unread_emails(self, max_results: int = 10) -> list[Email]:
        async with httpx.AsyncClient() as client:
            params = {
                '$filter': 'isRead eq false',
                '$top': max_results,
                '$orderby': 'receivedDateTime desc',
                '$select': 'id,subject,bodyPreview,from,receivedDateTime,isRead,body,conversationId,conversationIndex'
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
                    conversation_id=msg.get('conversationId'),
                    conversation_index=msg.get('conversationIndex'),
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
    async def forward_email(self, email_id: str, redirect_department_email: str, comment: str = "") -> dict[str, Any]:
        """
        Forward an email to another department.
        
        Args:
            email_id: The ID of the email to forward
            department_name: Name of the department (displayed in To field)
            department_email: Email address to forward to
            comment: Optional comment to include with the forward
        """
        request_body = {
            "comment": comment,
            "toRecipients": [
                {
                    "emailAddress": {
                        "address": redirect_department_email,
                    },
                },
            ],
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/me/messages/{email_id}/forward",
                headers=self.headers,
                json=request_body,
            )
        if response.status_code not in [200, 202]:
            return {
                "success": False,
                "status_code": response.status_code,
                "message": response.text,
            }
        return {
            "success": True,
            "status_code": response.status_code,
            "message": response.text if not response.is_success else "Forward sent successfully",
        }
    async def send_reply(self, original_email_id: str, body: str, 
                         importance: str = "normal") -> dict[str, Any]:
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
        formatted_body = format_as_html(body)
        
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
    
    
    async def get_conversation_messages(self, conversation_id: str) -> list[dict[str, Any]]:
        """
        Fetch all messages in a conversation thread, ordered oldest to newest.
        
        Args:
            conversation_id: The conversationId from Microsoft Graph
            
        Returns:
            List of message dicts ordered by receivedDateTime (oldest first for context)
        """
        if not conversation_id:
            print("No conversation_id provided, skipping thread fetch")
            return []
            
        async with httpx.AsyncClient() as client:
            # Note: Can't use $orderby with conversationId filter (Graph API limitation)
            params = {
                '$filter': f"conversationId eq '{conversation_id}'",
                '$select': 'id,subject,body,bodyPreview,from,receivedDateTime,conversationIndex',
                '$top': 25
            }
            print(f"🔍 Fetching thread for conversationId: {conversation_id[:50]}...")
            response = await client.get(
                f"{self.base_url}/me/messages",
                headers=self.headers,
                params=params
            )
            if response.status_code == 200:
                data = response.json()
                messages = data.get('value', [])
                # Sort client-side: oldest first for chronological context
                messages.sort(key=lambda m: m.get('receivedDateTime', ''))
                print(f"✅ Found {len(messages)} messages in thread")
                return messages
            print(f"Failed to fetch conversation messages: {response.status_code} - {response.text[:200]}")
            return []
    

    async def _get_single_message(self, message_id: str) -> dict[str, Any]:
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
    reader = EmailClient()
    emails = asyncio.run(reader.get_unread_emails())
    print(emails)





