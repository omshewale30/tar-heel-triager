"""
Database connection and session management
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from config.settings import settings

# Load env vars first, before reading them
load_dotenv()

# Import models so SQLAlchemy registers them with Base.metadata
from .models.base import Base

# Database config
DB_USER = os.getenv('DB_USER', 'citus')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST', 'heelper-db.postgres.database.azure.com')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'postgres')

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
