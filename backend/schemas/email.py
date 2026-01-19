from pydantic import BaseModel
from typing import Optional

class Email(BaseModel):
    id: str
    conversation_id: Optional[str]
    conversation_index: Optional[str]
    subject: str
    body: str
    sender: str
    sender_email: str
    received_at: str  # Kept as string for simplicity with JSON
    is_read: bool


class EmailTriageRequest(BaseModel):
    email_id: str
    subject: str
    body: str
    sender: str
    sender_email: str
    received_at: str


class EmailClassification(BaseModel):
    email_id: str
    email: Email
    route: str
    confidence: float
    reason: str
    redirect_department: Optional[str] = None
