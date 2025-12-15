"""
Email Classification Model using OpenAI
Classifies student billing emails and determines if they're FAQ-eligible
"""
import json
import os
from typing import Dict, Optional
import openai
from dotenv import load_dotenv

load_dotenv()


class EmailClassifier:
    """Email classification using OpenAI GPT"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize classifier with OpenAI API key
        
        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
        """
        if api_key is None:
            api_key = os.getenv('OPENAI_API_KEY')
        
        if not api_key:
            raise ValueError("OpenAI API key not found")
        
        openai.api_key = api_key
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
    
    async def classify_email(self, subject: str, body: str) -> Dict:
        """
        Classify email and determine if it's FAQ-eligible
        
        Returns:
            {
                'category': 'faq_eligible' | 'complex' | 'urgent' | 'non_billing',
                'priority': 1-10,
                'faq_eligible': True/False,  # Can this be handled by FAQ agent?
                'confidence': 0.92,
                'reason': 'Student asking about balance'
            }
        """
        prompt = f"""
        Classify this student billing email:
        Subject: {subject}
        Body: {body}
        
        Return JSON with: category, priority, faq_eligible, confidence, reason
        
        Categories:
        - 'faq_eligible': Standard questions about common billing topics
        - 'complex': Requires special handling or judgment
        - 'urgent': Time-sensitive issues
        - 'non_billing': Not related to billing (forward to appropriate dept)
        
        KEY: 'faq_eligible' should be True if this email asks about common policies:
        - Account balance/charges
        - Payment methods
        - Processing times
        - Fee structure
        - Payment plans
        - Financial holds
        
        Set faq_eligible to False for: disputes, special cases, edge cases requiring human judgment
        
        Priority scale: 1-10 (10 = most urgent)
        Confidence: 0.0-1.0
        
        Return ONLY valid JSON.
        """
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Validate response structure
            required_fields = ['category', 'priority', 'faq_eligible', 'confidence', 'reason']
            for field in required_fields:
                if field not in result:
                    raise ValueError(f"Missing required field: {field}")
            
            return result
        
        except Exception as e:
            print(f"Error classifying email: {e}")
            # Return safe defaults on error
            return {
                'category': 'complex',
                'priority': 5,
                'faq_eligible': False,
                'confidence': 0.0,
                'reason': f'Classification error: {str(e)}'
            }
