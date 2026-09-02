import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database import init_db, async_engine
from backend.app.api import api_router
from backend.app.core.content_analysis import get_ml_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB with auto-fallback
    await init_db()
    
    # Preload ML model into memory
    model = get_ml_model()
    if model:
        print("[+] Preloaded ML phishing classification model into memory.")
    else:
        print("[-] Warning: ML phishing model not found yet. Run train_classifier.py.")
        
    yield
    # Shutdown
    try:
        await async_engine.dispose()
    except Exception:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MailTrace: AI-Powered Email Threat Detection, Geolocation, and Forensic Intelligence Platform API",
    lifespan=lifespan,
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
