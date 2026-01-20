"""
FastAPI Backend for Heelper AI
Email triage and response system for UNC Cashier's Office
"""
#TODO: 
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.router import router
from db import init_db
from config.logging import setup_logging, get_logger

# Get logger for this module
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Initialize logging first
    setup_logging(level="INFO")  # Change to "DEBUG" for more verbose output
    
    logger.info("Starting up Heelper AI API...")
    init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Heelper AI API",
    description="Email triage and response system for UNC Cashier's Office",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - adjust origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

