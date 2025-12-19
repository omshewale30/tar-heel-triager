"""
Database Models for Email Triage System
"""
from sqlalchemy import create_engine, Column, String, Integer, Text, Boolean, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime
import os

Base = declarative_base()





class ApprovalQueue(Base):
    """Approval queue for emails awaiting staff review"""
    
    __tablename__ = "approval_queue"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email_id = Column(String(255))
    subject = Column(Text)
    sender_email = Column(String(255))
    body = Column(Text)
    category = Column(String(50))
    priority = Column(Integer)
    generated_response = Column(Text)
    final_response = Column(Text)
    
    # Routing and agent fields
    route = Column(String(20))  # 'auto_faq' | 'manual' | 'urgent'
    agent_used = Column(Boolean, default=False)
    confidence = Column(Float)
    
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


class EmailHistory(Base):
    """History of processed emails"""
    
    __tablename__ = "email_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email_id = Column(String(255))
    subject = Column(Text)
    sender_email = Column(String(255))
    category = Column(String(50))
    priority = Column(Integer)
    route = Column(String(20))
    agent_used = Column(Boolean, default=False)
    final_response = Column(Text)
    approval_status = Column(String(20))  # 'approved', 'rejected', 'edited'
    processed_at = Column(DateTime, default=datetime.now)
    
    def __repr__(self):
        return f"<EmailHistory(id={self.id}, email_id={self.email_id}, status={self.approval_status})>"


# Database setup
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./email_triage.db')

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
