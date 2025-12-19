"""
Azure AI Foundry Agent Handler
Sends emails to Foundry Agent for FAQ responses
"""
import os
import re
import asyncio
from typing import Dict
from dotenv import load_dotenv
from azure.ai.projects import AIProjectClient

load_dotenv()


def clean_agent_response(raw_text: str) -> str:
    """
    Clean agent response by removing citation markers.
    Links are now included by the agent at the bottom of the response.
    
    Args:
        raw_text: Raw response from Azure AI agent
        
    Returns:
        Cleaned text with citations removed
    """
    if not raw_text:
        return ""
    
    # Remove citation markers like 【4:4†source】 or 【4:0†UNC_Cashier_FAQ.pdf】
    citation_pattern = r'【[^】]*†[^】]*】'
    cleaned_text = re.sub(citation_pattern, '', raw_text)
    
    # Remove trailing spaces on lines
    cleaned_text = re.sub(r' +\n', '\n', cleaned_text)
    # Remove multiple consecutive newlines (more than 2)
    cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
    cleaned_text = cleaned_text.strip()
    
    return cleaned_text


class AzureAIFoundryAgent:
    """Handler for Azure AI Foundry Agent queries"""
    
    def __init__(self, project_client: AIProjectClient):
        """
        Initialize Foundry Agent handler
        
        Args:
            project_client: Azure AI Foundry project client (sync version)
        """
        self.project_client = project_client
        self.agent_id = os.getenv("AZURE_AGENT_ID")
    
    async def query_agent(self, subject: str, email_body: str) -> Dict:
        """
        Send email to Azure AI Foundry agent for FAQ response
        """
        if self.project_client is None:
            raise ValueError("Project client not initialized")
        
        try:
            # 1. Create Thread
            thread = await asyncio.to_thread(
                self.project_client.agents.threads.create
            )
            print(f"Created thread: {thread.id}")

            # 2. Add message to thread
            message = await asyncio.to_thread(
                self.project_client.agents.messages.create,
                thread_id=thread.id,
                role="user",
                content=f"Subject: {subject}\nBody: {email_body}"
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
            return {
                'response': None,
                'error': str(e),
            }


