"""
Database initialization script
Run from backend folder: python -m db.init_db
"""
from .connection import init_db, DB_HOST, DB_NAME


def run():
    """Call this to initialize the database."""
    print(f"Connecting to Azure PostgreSQL: {DB_HOST}/{DB_NAME}")
    print("Initializing database...")
    init_db()
    print("✓ Database initialized successfully!")


if __name__ == "__main__":
    run()
