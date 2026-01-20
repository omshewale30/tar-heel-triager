from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os
load_dotenv()

class Settings(BaseSettings):
    # Database
    db_user: str = os.getenv("DB_USER")
    db_password: str = os.getenv("DB_PASSWORD")
    db_host: str = os.getenv("DB_HOST")
    db_port: str = os.getenv("DB_PORT")
    db_name: str = os.getenv("DB_NAME")
    
    # Azure
    azure_ai_project_endpoint: str = os.getenv("AZURE_AI_PROJECT_ENDPOINT")
    azure_ad_tenant_id: str = os.getenv("AZURE_AD_TENANT_ID")
    azure_openai_key: str = os.getenv("AZURE_OPENAI_KEY")
    azure_ai_resource_endpoint: str = os.getenv("AZURE_AI_RESOURCE_ENDPOINT")
    
    class Config:
        env_file = ".env"

settings = Settings()