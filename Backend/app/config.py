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
    
    # Alerting
    ALERT_THRESHOLD: int = 70
    
    # Google OAuth & Gmail Live Scanning
    GOOGLE_CLIENT_ID: str = Field(default="", description="Google OAuth 2.0 Client ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="", description="Google OAuth 2.0 Client Secret")
    GOOGLE_REDIRECT_URI: str = Field(default="http://localhost:5173/auth/google/callback", description="OAuth Authorized Redirect URI")
    TOKEN_ENCRYPTION_KEY: str = Field(default="", description="Fernet 32-byte url-safe key for encrypting refresh tokens at rest")
    GMAIL_POLL_INTERVAL_SECONDS: int = Field(default=15, description="Interval in seconds for polling Gmail API")
    
    # Admin & Frontend URLs
    ADMIN_EMAIL: str = Field(default="hiten8411jdrravi@gmail.com", description="Superadmin email address")
    FRONTEND_URL: str = Field(default="http://localhost:5173", description="Frontend application URL")
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ("backend/.env", ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
