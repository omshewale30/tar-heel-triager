"""
Database initialization script
Run this to create the database tables
"""
from models import init_db

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("✓ Database initialized successfully!")
