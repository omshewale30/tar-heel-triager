'''
Formatter service for the email engine
Formats the context for the email engine based on the email thread

'''
from typing import Any
import re

def format_as_html(body: str) -> str:
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

def format_thread_classification_context(messages: list[dict[str, Any]], current_email_id: str) -> str:
    """
    Format thread messages into a context string for the LLM to classify the thread into 'AI_AGENT' or 'HUMAN_REQUIRED' or 'REDIRECT'.
    All messages in the thread are included regardless of count.
    
    Args:
        messages: List of message dicts from get_conversation_messages
        current_email_id: ID of the current unread email (to mark it for response)
    """
    if not messages:
        return ""

    context_parts = ["=== EMAIL THREAD (MULTIPLE MESSAGES) ===\n"]
    
    for i, msg in enumerate(messages, 1):
        sender_info = msg.get('from', {}).get('emailAddress', {})
        sender_name = sender_info.get('name', 'Unknown')
        sender_email = sender_info.get('address', 'unknown')
        subject = msg.get('subject', '(No Subject)')
        received = msg.get('receivedDateTime', '')[:16].replace('T', ' ')  # Format: YYYY-MM-DD HH:MM
        body = msg.get('bodyPreview', '')
        if not body and msg.get('body'):
            body = msg['body'].get('content', '')[:500]  # Truncate if too long
        is_current = msg.get('id') == current_email_id
        marker = " <<< Current Message" if is_current else ""
        context_parts.append(f"--- Message {i}{marker} ---")
        context_parts.append(f"From: {sender_name} <{sender_email}>")
        context_parts.append(f"Date: {received}")
        context_parts.append(f"Subject: {subject}")
        context_parts.append(f"Body: {body}")
        context_parts.append("")
    context_parts.append("=== END OF THREAD ===\n")
    return "\n".join(context_parts)

def format_thread_context(messages: list[dict[str, Any]], current_email_id: str) -> str:
    """
    Format thread messages into a context string for the AI agent.
    All messages in the thread are included regardless of count.
    
    Args:
        messages: List of message dicts from get_conversation_messages
        current_email_id: ID of the current unread email (to mark it for response)
        
    Returns:
        Formatted string with full thread history
    """
    if not messages:
        return ""
    
    # Different header for single vs multi-message threads
    if len(messages) == 1:
        context_parts = ["=== EMAIL TO RESPOND TO ===\n"]
    else:
        context_parts = [f"=== EMAIL THREAD ({len(messages)} messages, oldest to newest) ===\n"]
    
    for i, msg in enumerate(messages, 1):
        sender_info = msg.get('from', {}).get('emailAddress', {})
        sender_name = sender_info.get('name', 'Unknown')
        sender_email = sender_info.get('address', 'unknown')
        subject = msg.get('subject', '(No Subject)')
        received = msg.get('receivedDateTime', '')[:16].replace('T', ' ')  # Format: YYYY-MM-DD HH:MM
        
        # Get body - prefer bodyPreview for context (cleaner, shorter)
        body = msg.get('bodyPreview', '')
        if not body and msg.get('body'):
            body = msg['body'].get('content', '')
        
        is_current = msg.get('id') == current_email_id
        marker = " <<< RESPOND TO THIS" if is_current else ""
        
        context_parts.append(f"--- Message {i}{marker} ---")
        context_parts.append(f"From: {sender_name} <{sender_email}>")
        context_parts.append(f"Date: {received}")
        context_parts.append(f"Subject: {subject}")
        context_parts.append(f"Body: {body}")
        context_parts.append("")
    
    context_parts.append("=== END OF THREAD ===\n")
    return "\n".join(context_parts)

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