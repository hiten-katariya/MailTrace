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

from sqlalchemy import text

async def init_db():
    global async_engine, AsyncSessionLocal

    migration_cols = [
        ("campaign_id", "VARCHAR"),
        ("body_hash", "VARCHAR"),
        ("attribution_type", "VARCHAR DEFAULT 'unattributed'"),
        ("attribution_confidence", "VARCHAR DEFAULT 'low'"),
        ("is_purged", "BOOLEAN DEFAULT FALSE"),
        ("source", "VARCHAR DEFAULT 'upload'"),
        ("gmail_account", "VARCHAR"),
        ("gmail_message_id", "VARCHAR"),
    ]

    try:
        # Ensure all models are registered in Base.metadata
        import backend.app.models  # noqa: F401
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            # Apply column migrations for dynamic fields if table already existed
            for col_name, col_def in migration_cols:
                try:
                    await conn.execute(text(f"ALTER TABLE cases ADD COLUMN IF NOT EXISTS {col_name} {col_def}"))
                except Exception:
                    pass
            try:
                await conn.execute(text("ALTER TABLE retention_policy ADD COLUMN IF NOT EXISTS auto_trash_on_purge BOOLEAN DEFAULT FALSE"))
            except Exception:
                pass
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
            for col_name, col_def in migration_cols:
                try:
                    await conn.execute(text(f"ALTER TABLE cases ADD COLUMN {col_name} {col_def}"))
                except Exception:
                    pass
            try:
                await conn.execute(text("ALTER TABLE retention_policy ADD COLUMN auto_trash_on_purge BOOLEAN DEFAULT FALSE"))
            except Exception:
                pass
        print("[+] SQLite database initialized successfully at backend/data/mailtrace.db")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
