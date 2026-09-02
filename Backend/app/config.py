import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # App Information
    PROJECT_NAME: str = "MailTrace"
    VERSION: str = "2.0.0"
    API_V1_STR: str = ""
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/mailtrace",
        description="Async connection string for FastAPI application"
    )
    SYNC_DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/mailtrace",
        description="Sync connection string for Alembic migrations"
    )
    
    # Security / JWT
    SECRET_KEY: str = "mailtrace_super_secret_jwt_key_2026_forensics_soc_platform"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # Intelligence APIs & Databases
    ABUSEIPDB_API_KEY: str = ""
    MAXMIND_DB_PATH: str = "backend/data/GeoLite2-City.mmdb"
    
    # Storage Paths
    RAW_EML_STORAGE_DIR: str = "backend/storage/raw_emls"
    ML_MODEL_PATH: str = "backend/models/phishing_classifier.joblib"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    
    class Config:
        env_file = "backend/.env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
