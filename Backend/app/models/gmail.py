import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class GmailAccount(Base):
    __tablename__ = "gmail_accounts"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    gmail_address: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    encrypted_refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    scopes_granted: Mapped[str] = mapped_column(String(255), default="https://www.googleapis.com/auth/gmail.readonly", nullable=False)
    last_history_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    connected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, server_default=func.now())
    last_polled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active", index=True)  # 'active', 'needs_reauth', 'revoked'
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "gmail_address": self.gmail_address,
            "scopes_granted": self.scopes_granted,
            "last_history_id": self.last_history_id,
            "connected_at": self.connected_at.isoformat() if self.connected_at else None,
            "last_polled_at": self.last_polled_at.isoformat() if self.last_polled_at else None,
            "status": self.status,
            "error_message": self.error_message,
        }
