"""
Database initialization script
Run this to create the database tables in Azure PostgreSQL
"""
from models import init_db, DB_HOST, DB_NAME

if __name__ == "__main__":
    print(f"Connecting to Azure PostgreSQL: {DB_HOST}/{DB_NAME}")
    print("Initializing database...")
    init_db()
    print("✓ Database initialized successfully!")
