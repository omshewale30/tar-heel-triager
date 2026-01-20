"""
Azure AI Foundry Agent Handler
Sends emails to Foundry Agent for FAQ responses
"""
import asyncio
from typing import Any, Dict, Optional
from azure.ai.projects import AIProjectClient
from config.settings import settings
from services.formatter import clean_agent_response


class AzureAIFoundryAgent:
    """Handler for Azure AI Foundry Agent queries using the Azure AI Project Client"""
    
    def __init__(self, project_client: AIProjectClient):
        """
        Initialize Foundry Agent handler
        
        Args:
            project_client: Azure AI Foundry project client (sync version)
        """
        self.project_client = project_client
        self.agent_id = settings.azure_agent_id
    
    async def query_agent(self, subject: str, email_body: str, thread_context: str = "") -> Dict[str, Any]:
        """
        Send email to Azure AI Foundry agent for FAQ response
        
        Args:
            subject: Email subject (used as fallback if no thread_context)
            email_body: Current email body (used as fallback if no thread_context)
            thread_context: Formatted thread with all messages, current marked with <<< RESPOND TO THIS
        """
        if self.project_client is None:
            raise ValueError("Project client not initialized")
        
        try:
            # 1. Create Thread
            thread = await asyncio.to_thread(
                self.project_client.agents.threads.create
            )
            print(f"Created thread: {thread.id}")

            # 2. Build the message content
            # thread_context already contains the full thread with the current email marked
            if thread_context:
                content = f"{thread_context}\n\nPlease generate a professional response to the message marked with '<<< RESPOND TO THIS'. Consider the full thread history for context."
                print(f"Sending thread context ({len(thread_context)} chars)")
            else:
                # Fallback: use subject and body directly (shouldn't happen normally)
                content = f"Subject: {subject}\nBody: {email_body}"
                print("No thread context available, using subject/body directly")

            # 3. Add message to thread
            message = await asyncio.to_thread(
                self.project_client.agents.messages.create,
                thread_id=thread.id,
                role="user",
                content=content
            )
            print(f"Created message: {message.id}")

            # 3. Create and process run (this polls internally until completion)
            run = await asyncio.to_thread(
                self.project_client.agents.runs.create_and_process,
                agent_id=self.agent_id,
                thread_id=thread.id
            )
            print(f"Run completed with status: {run.status}")

            if run.status != "completed":
                raise RuntimeError(f"Agent run failed. Status: {run.status}")
            
            # 4. Get response messages (returns ItemPaged iterator)
            messages_iter = await asyncio.to_thread(
                self.project_client.agents.messages.list,
                thread_id=thread.id
            )
            
            # Convert iterator to list in thread pool
            messages_list = await asyncio.to_thread(list, messages_iter)
            
            # 5. Extract response - filter for assistant messages
            assistant_messages = [msg for msg in messages_list if msg.role == "assistant"]
            
            response_text = ""
            if assistant_messages:
                latest_message = assistant_messages[-1]  # Get the last assistant message
                # Extract text from message content
                if latest_message.content and isinstance(latest_message.content, list):
                    for part in latest_message.content:
                        # Handle dict-style content (from API)
                        if isinstance(part, dict):
                            if part.get("type") == "text" and "text" in part and "value" in part["text"]:
                                response_text = part["text"]["value"]
                                break
                        # Handle object-style content
                        elif hasattr(part, 'text') and hasattr(part.text, 'value'):
                            response_text = part.text.value
                            break
            
            # 6. Clean the response (remove citations)
            cleaned_response = clean_agent_response(response_text)
            
            return {
                'response': cleaned_response,      # Clean text ready for email (links included at bottom)
                'thread_id': thread.id,            # Conversation context
            }
        
        except Exception as e:
            print(f"Error querying agent: {e}")
            # Return None response so the email gets skipped (not added to queue)
            # rather than blocking the entire triage process
            return {
                'response': None,
                'error': str(e),
                'retryable': 'timeout' in str(e).lower() or '408' in str(e) or '401' in str(e)
            }


