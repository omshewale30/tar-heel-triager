"""
Background Scheduler for Email Triage
Polls for new emails and processes them every 5 minutes
"""
import asyncio
import httpx
from datetime import datetime
import os
from dotenv import load_dotenv
from email_reader import EmailReader

load_dotenv()

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL_MINUTES', 5)) * 60  # Convert to seconds


class EmailScheduler:
    """Background scheduler for processing emails"""
    
    def __init__(self):
        self.email_reader = EmailReader()
        self.running = False
    
    async def process_email(self, email) -> None:
        """
        Send email to triage endpoint for processing
        
        Args:
            email: Email object from EmailReader
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{BACKEND_URL}/triage-email",
                    json={
                        'email_id': email.id,
                        'subject': email.subject,
                        'body': email.body,
                        'sender': email.sender,
                        'sender_email': email.sender_email,
                        'received_at': email.received_at.isoformat()
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✓ Processed email: {email.subject[:50]}... Route: {result['route']}")
                    
                    # Mark email as read if successfully processed
                    await self.email_reader.mark_as_read(email.id)
                    
                else:
                    print(f"✗ Failed to process email: {response.status_code} - {response.text}")
        
        except Exception as e:
            print(f"✗ Error processing email: {e}")
    
    async def poll_emails(self) -> None:
        """Poll for new emails and process them"""
        try:
            print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Polling for new emails...")
            
            # Fetch unread emails
            emails = await self.email_reader.get_unread_emails(max_results=50)
            
            if not emails:
                print("  No new emails found.")
                return
            
            print(f"  Found {len(emails)} new email(s)")
            
            # Process each email
            for email in emails:
                await self.process_email(email)
        
        except Exception as e:
            print(f"Error polling emails: {e}")
    
    async def run(self) -> None:
        """Run scheduler continuously"""
        self.running = True
        print(f"Email scheduler started. Polling every {POLL_INTERVAL // 60} minutes.")
        print(f"Backend URL: {BACKEND_URL}")
        
        while self.running:
            try:
                await self.poll_emails()
                
                # Wait before next poll
                await asyncio.sleep(POLL_INTERVAL)
            
            except KeyboardInterrupt:
                print("\nScheduler stopped by user.")
                self.running = False
                break
            except Exception as e:
                print(f"Error in scheduler loop: {e}")
                await asyncio.sleep(POLL_INTERVAL)
    
    def stop(self) -> None:
        """Stop the scheduler"""
        self.running = False


async def main():
    """Main entry point for scheduler"""
    scheduler = EmailScheduler()
    await scheduler.run()


if __name__ == "__main__":
    asyncio.run(main())
