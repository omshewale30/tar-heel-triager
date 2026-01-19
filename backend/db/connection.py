"""
Database connection and session management
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from config.settings import settings
from .models.base import Base
from config.logging import get_logger
from config.settings import settings
logger = get_logger(__name__)


# Database config
DB_USER = settings.db_user
DB_PASSWORD = settings.db_password
DB_HOST = settings.db_host
DB_PORT = settings.db_port
DB_NAME = settings.db_name

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"

# Create engine
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

# Session factory - creates new sessions, don't instantiate globally
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    Dependency that provides a database session per request.
    Automatically rolls back on exceptions, then closes.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()  # Rollback uncommitted changes on any error
        raise
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.
    Imports models here to ensure they're registered with Base.metadata.
    """
    from .models.approval_queue import ApprovalQueue
    from .models.email_history import EmailHistory

    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
