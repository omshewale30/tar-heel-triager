"""
Azure AI Foundry Agent Handler
Sends emails to Foundry Agent for FAQ responses
"""
import os
import asyncio
import re
from typing import Dict, Optional
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv

# Note: Update these imports based on actual azure-ai-projects SDK
# The following is a placeholder implementation
try:
    from azure.ai.projects import AIProjectClient
    from azure.ai.projects.models import MessageContentPart
except ImportError:
    print("Warning: azure-ai-projects not installed. Agent handler will use mock responses.")

load_dotenv()


class AzureAIFoundryAgent:
    """Handler for Azure AI Foundry Agent queries"""
    
    def __init__(self, project_endpoint: Optional[str] = None, agent_id: Optional[str] = None):
        """
        Initialize Foundry Agent handler
        
        Args:
            project_endpoint: Azure AI Foundry project endpoint
            agent_id: Agent ID from Foundry portal
        """
        if project_endpoint is None:
            project_endpoint = os.getenv('AZURE_AI_PROJECT_ENDPOINT')
        
        if agent_id is None:
            agent_id = os.getenv('AZURE_AI_FOUNDRY_AGENT_ID')
        
        if not project_endpoint or not agent_id:
            print("Warning: Azure AI Foundry credentials not configured. Using mock responses.")
            self.client = None
            self.agent_id = agent_id
            return
        
        try:
            # Initialize Azure AI Foundry client
            credential = DefaultAzureCredential()
            # Note: Update this initialization based on actual SDK
            self.client = AIProjectClient.from_connection_string(
                conn_str=project_endpoint,
                credential=credential
            )
            self.agent_id = agent_id
        except Exception as e:
            print(f"Warning: Failed to initialize Foundry client: {e}")
            self.client = None
            self.agent_id = agent_id
    
    async def query_faq_agent(self, email_body: str) -> Dict:
        """
        Send email to Azure AI Foundry agent for FAQ response
        
        Agent handles: vectorization, retrieval, generation, citations
        
        Args:
            email_body: Content of the email to process
        
        Returns:
            {
                'response': 'The student accounting portal...',
                'sources': ['billing_policy_2025.pdf'],
                'confidence': 0.95,
                'agent_used': True
            }
        """
        # Mock response if client not configured
        if self.client is None:
            return self._mock_response(email_body)
        
        try:
            # Create a thread (conversation)
            thread = self.client.agents.create_thread()
            
            # Create message in thread
            message = self.client.agents.create_message(
                thread_id=thread.id,
                role="user",
                content=email_body
            )
            
            # Run agent (it will search knowledge base, generate response)
            run = self.client.agents.create_run(
                thread_id=thread.id,
                assistant_id=self.agent_id
            )
            
            # Wait for completion
            max_retries = 30
            wait_count = 0
            while run.status != "completed" and wait_count < max_retries:
                await asyncio.sleep(1)
                run = self.client.agents.get_run(thread_id=thread.id, run_id=run.id)
                wait_count += 1
            
            if run.status != "completed":
                raise TimeoutError("Agent response timeout")
            
            # Get response messages
            messages = self.client.agents.list_messages(thread_id=thread.id)
            
            # Extract response (last message from agent)
            response_text = ""
            sources = []
            
            for msg in messages.data:
                if msg.role == "assistant":
                    for content in msg.content:
                        if isinstance(content, MessageContentPart):
                            response_text = content.text
                            # Extract citations from response
                            # Azure automatically adds [doc_name] citations
                            sources = re.findall(r'\[(.*?)\]', response_text)
            
            # Clean up thread
            self.client.agents.delete_thread(thread.id)
            
            return {
                'response': response_text,
                'sources': list(set(sources)),  # Unique sources
                'confidence': 0.95 if response_text else 0.0,
                'agent_used': True
            }
        
        except Exception as e:
            print(f"Error querying FAQ agent: {e}")
            return {
                'response': None,
                'error': str(e),
                'agent_used': False,
                'sources': [],
                'confidence': 0.0
            }
    
    def _mock_response(self, email_body: str) -> Dict:
        """Generate mock response when agent not configured"""
        print("Using mock FAQ response (agent not configured)")
        
        # Simple keyword-based mock response
        lower_body = email_body.lower()
        
        if 'balance' in lower_body or 'owe' in lower_body:
            response = """You can check your balance in three ways:
1. Log into the Student Accounting Portal at [link]
2. Call the Cashier's Office at [phone]
3. Email cashier@unc.edu with your student ID

Your balance updates daily. [billing_procedures_2025.pdf]"""
            sources = ['billing_procedures_2025.pdf']
        
        elif 'payment' in lower_body or 'pay' in lower_body:
            response = """We accept multiple payment methods:
- Credit/Debit cards (Visa, Mastercard, Discover, Amex)
- Bank transfers (ACH)
- Wire transfers
- Checks (mail to [address])

All methods process within 2-3 business days. [payment_policy_2025.pdf]"""
            sources = ['payment_policy_2025.pdf']
        
        elif 'hold' in lower_body or 'blocked' in lower_body:
            response = """Common reasons for holds:
- Outstanding balance (payment due)
- Overdue library fines
- Parking violations

To resolve: Contact cashier@unc.edu or visit the Cashier's Office in [location]. [financial_policy_2025.pdf]"""
            sources = ['financial_policy_2025.pdf']
        
        else:
            response = "Thank you for contacting the Cashier's Office. Please contact cashier@unc.edu for assistance with your inquiry."
            sources = []
        
        return {
            'response': response,
            'sources': sources,
            'confidence': 0.75,
            'agent_used': False,  # Marked as False to indicate mock
            'note': 'Mock response - configure Foundry agent for production'
        }


# Initialize agent globally
agent = AzureAIFoundryAgent()
