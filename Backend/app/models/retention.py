from datetime import datetime, timezone
from sqlalchemy import Integer, Boolean, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.database import Base

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class RetentionPolicy(Base):
    __tablename__ = "retention_policy"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    retention_days: Mapped[int] = mapped_column(Integer, default=90)
    auto_purge: Mapped[bool] = mapped_column(Boolean, default=True)
    mask_pii: Mapped[bool] = mapped_column(Boolean, default=True)
    mask_sender_email: Mapped[bool] = mapped_column(Boolean, default=True)
    mask_recipient: Mapped[bool] = mapped_column(Boolean, default=True)
    export_compliance_level: Mapped[str] = mapped_column(String(32), default="standard")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, server_default=func.now(), onupdate=get_utc_now)
