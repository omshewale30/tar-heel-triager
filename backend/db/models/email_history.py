from .base import Base
from sqlalchemy import Column, String, Text, DateTime, Float
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


class EmailHistory(Base):
    """History of processed emails"""
    
    __tablename__ = "email_history"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(String(255), nullable=True, index=True)
    conversation_index = Column(String(512), nullable=True)
    email_id = Column(String(255))
    subject = Column(Text)
    sender_email = Column(String(255))
    route = Column(String(20))
    redirect_department = Column(String(255), nullable=True)
    final_response = Column(Text)
    confidence = Column(Float)
    approval_status = Column(String(20))  # 'approved', 'rejected', 'edited', 'redirected'
    processed_at = Column(DateTime, default=datetime.now)
    received_at = Column(DateTime, default=datetime.now)
    
    def __repr__(self):
        return f"<EmailHistory(id={self.id}, email_id={self.email_id}, status={self.approval_status})>"