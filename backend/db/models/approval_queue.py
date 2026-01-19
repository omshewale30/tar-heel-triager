from .base import Base
from sqlalchemy import Column, String, Text, Boolean, DateTime, Float
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID



class ApprovalQueue(Base):
    """Approval queue for emails awaiting staff review"""
    
    __tablename__ = "approval_queue"

    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    conversation_id = Column(String(255), nullable=True, index=True)
    conversation_index = Column(String(512), nullable=True)
    email_id = Column(String(255))
    subject = Column(Text)
    sender_email = Column(String(255))
    body = Column(Text)
    received_at = Column(DateTime, default=datetime.now)
    is_read = Column(Boolean, default=False)
    route = Column(String(20))
    redirect_department = Column(String(255), nullable=True)
    generated_response = Column(Text)
    final_response = Column(Text)
    confidence = Column(Float)
    # Routing and agent fields
    agent_used = Column(Boolean, default=False)
    # Approval tracking
    approved = Column(Boolean, default=False)
    approved_at = Column(DateTime)
    rejected = Column(Boolean, default=False)
    rejected_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<ApprovalQueue(id={self.id}, subject={self.subject[:30]}..., route={self.route})>"