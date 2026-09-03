from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class ThreatIntelMatch(Base):
    __tablename__ = "threat_intel_matches"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    indicator: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    indicator_type: Mapped[str] = mapped_column(String(32), default="ip")  # 'ip', 'domain', 'url'
    source: Mapped[str] = mapped_column(String(64), nullable=False)  # 'AbuseIPDB', 'OpenPhish', 'TorExitList', etc.
    abuse_score: Mapped[int] = mapped_column(Integer, default=0)
    matched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, server_default=func.now())

    # Relationship to Case
    case: Mapped["backend.app.models.case.Case"] = relationship("backend.app.models.case.Case", back_populates="threat_intel_matches")
