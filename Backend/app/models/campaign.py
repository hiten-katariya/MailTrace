import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Float, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Campaign(Base):
    __tablename__ = "campaigns"
    __table_args__ = {"extend_existing": True}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    shared_indicator: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    shared_indicator_type: Mapped[str] = mapped_column(String(64), nullable=False)  # 'ip', 'domain_family', 'body_hash', 'brand_target'
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, server_default=func.now())
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, server_default=func.now(), onupdate=get_utc_now)
    case_count: Mapped[int] = mapped_column(Integer, default=1)
    primary_risk_category: Mapped[str] = mapped_column(String(32), default="phishing")
    average_fraud_score: Mapped[float] = mapped_column(Float, default=0.0)

    # Relationship to Case
    cases: Mapped[List["Case"]] = relationship("Case", back_populates="campaign")
