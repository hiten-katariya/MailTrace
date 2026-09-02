import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from backend.app.config import settings

class Base(DeclarativeBase):
    pass

def get_engine_and_session():
    # If DATABASE_URL is SQLite or Postgres
    db_url = settings.DATABASE_URL
    if "sqlite" in db_url:
        engine = create_async_engine(db_url, echo=False, future=True)
    else:
        # Postgres with connection pool
        engine = create_async_engine(
            db_url,
            echo=False,
            future=True,
            pool_pre_ping=True,
        )
    
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    return engine, session_factory

async_engine, AsyncSessionLocal = get_engine_and_session()

async def init_db():
    global async_engine, AsyncSessionLocal
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print(f"[+] Connected successfully to database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    except Exception as e:
        print(f"[-] PostgreSQL connection error: {e}")
        print("[!] Falling back automatically to local SQLite database: sqlite+aiosqlite:///backend/data/mailtrace.db")
        fallback_url = "sqlite+aiosqlite:///backend/data/mailtrace.db"
        async_engine = create_async_engine(fallback_url, echo=False, future=True)
        AsyncSessionLocal = async_sessionmaker(
            bind=async_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[+] SQLite database initialized successfully at backend/data/mailtrace.db")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
