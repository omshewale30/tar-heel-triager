"""
Database Models for Email Triage System
Uses Azure PostgreSQL (psycopg2)
"""
from sqlalchemy import create_engine, Column, String, Integer, Text, Boolean, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime
import os
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from dotenv import load_dotenv
from typing import Optional
from dataclasses import dataclass
load_dotenv()

Base = declarative_base()


@dataclass
class Email:
    id: str
    conversation_id: Optional[str]
    conversation_index: Optional[str]
    subject: str
    body: str
    sender: str
    sender_email: str
    received_at: str  # Kept as string for simplicity with JSON
    is_read: bool






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
    final_response = Column(Text)
    confidence = Column(Float)
    approval_status = Column(String(20))  # 'approved', 'rejected', 'edited'
    processed_at = Column(DateTime, default=datetime.now)
    
    def __repr__(self):
        return f"<EmailHistory(id={self.id}, email_id={self.email_id}, status={self.approval_status})>"


# Database setup - Azure PostgreSQL
# Connection format: postgresql://user:password@host:port/database
DB_USER = os.getenv('DB_USER', 'citus')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST', 'heelper-db.postgres.database.azure.com')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'postgres')

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"

# Create engine
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

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
