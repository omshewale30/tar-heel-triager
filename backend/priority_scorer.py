"""
Priority Scoring System for Email Triage
Identifies urgent keywords, sender type, and sentiment
"""
import re
from typing import Dict, List
from datetime import datetime


class PriorityScorer:
    """Priority scoring based on keywords, sender, and sentiment"""
    
    # Urgent keywords that increase priority
    URGENT_KEYWORDS = [
        'urgent', 'asap', 'immediately', 'emergency', 'critical',
        'overdue', 'past due', 'late', 'hold', 'blocked',
        'cannot register', 'registration blocked', 'financial hold',
        'deadline', 'due today', 'last day'
    ]
    
    # High-priority sender types
    HIGH_PRIORITY_SENDERS = [
        'parent', 'mother', 'father', 'guardian', 'attorney',
        'financial aid', 'advising', 'registrar'
    ]
    
    # Sentiment keywords (negative sentiment = higher priority)
    NEGATIVE_SENTIMENT = [
        'angry', 'frustrated', 'disappointed', 'concerned',
        'worried', 'upset', 'unacceptable', 'miles', 'ridiculous',
        'unfair', 'discrimination', 'complaint'
    ]
    
    def __init__(self):
        """Initialize priority scorer"""
        pass
    
    def score(self, email_data: Dict) -> Dict:
        """
        Score email priority based on multiple factors
        
        Args:
            email_data: {
                'subject': str,
                'body': str,
                'sender_type': str (optional),
                'sender_email': str (optional)
            }
        
        Returns:
            {
                'priority_level': int (1-10),
                'urgency_score': float (0-1),
                'reasoning': str,
                'factors': List[str]
            }
        """
        subject = email_data.get('subject', '').lower()
        body = email_data.get('body', '').lower()
        full_text = f"{subject} {body}"
        sender_type = email_data.get('sender_type', '').lower()
        sender_email = email_data.get('sender_email', '').lower()
        
        factors = []
        urgency_score = 0.0
        
        # Check for urgent keywords
        urgent_count = sum(1 for keyword in self.URGENT_KEYWORDS if keyword in full_text)
        if urgent_count > 0:
            urgency_score += 0.3
            factors.append(f"{urgent_count} urgent keyword(s) found")
        
        # Check sender type
        if any(term in sender_type or term in sender_email for term in self.HIGH_PRIORITY_SENDERS):
            urgency_score += 0.3
            factors.append("High-priority sender (parent/guardian/staff)")
        
        # Check for negative sentiment
        negative_count = sum(1 for word in self.NEGATIVE_SENTIMENT if word in full_text)
        if negative_count > 0:
            urgency_score += 0.2
            factors.append(f"Negative sentiment detected ({negative_count} indicators)")
        
        # Check for financial hold mention
        if 'hold' in full_text or 'blocked' in full_text:
            urgency_score += 0.15
            factors.append("Financial hold mentioned")
        
        # Check for parent@, guardian@, etc.
        if any(term in sender_email for term in ['parent', 'guardian', 'mom', 'dad']):
            urgency_score += 0.15
            factors.append("Parent/guardian email detected")
        
        # Check for time-sensitive phrases
        time_phrases = ['today', 'tomorrow', 'this week', 'as soon as possible']
        if any(phrase in full_text for phrase in time_phrases):
            urgency_score += 0.1
            factors.append("Time-sensitive language detected")
        
        # Cap urgency score at 1.0
        urgency_score = min(urgency_score, 1.0)
        
        # Convert to priority level (1-10)
        priority_level = max(1, int(urgency_score * 9) + 1)
        
        # Generate reasoning
        if not factors:
            reasoning = "Standard priority - no urgent indicators"
        else:
            reasoning = "; ".join(factors)
        
        return {
            'priority_level': priority_level,
            'urgency_score': urgency_score,
            'reasoning': reasoning,
            'factors': factors
        }
    
    def is_urgent(self, priority_level: int, threshold: int = 7) -> bool:
        """
        Determine if email is urgent based on priority level
        
        Args:
            priority_level: Priority level (1-10)
            threshold: Threshold for urgent (default: 7)
        
        Returns:
            True if urgent, False otherwise
        """
        return priority_level >= threshold
