from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base

class Headers(Base):
    __tablename__ = "headers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # SPF
    spf_result: Mapped[str] = mapped_column(String(32), default="none")  # 'pass', 'fail', 'softfail', 'neutral', 'none'
    spf_record: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    spf_sender_ip: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # DKIM
    dkim_result: Mapped[str] = mapped_column(String(32), default="none")  # 'pass', 'fail', 'softfail', 'neutral', 'none'
    dkim_domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    dkim_selector: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    dkim_signature_present: Mapped[bool] = mapped_column(Boolean, default=False)

    # DMARC
    dmarc_result: Mapped[str] = mapped_column(String(32), default="none")  # 'pass', 'fail', 'softfail', 'neutral', 'none'
    dmarc_policy: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)  # 'none', 'quarantine', 'reject'
    dmarc_disposition: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    # Anomalies
    anomalies: Mapped[List[str]] = mapped_column(JSON, default=list)
    raw_headers: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationship
    case: Mapped["Case"] = relationship("Case", back_populates="headers")


class RelayHop(Base):
    __tablename__ = "relay_hops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    hop_number: Mapped[int] = mapped_column(Integer, nullable=False)
    ip: Mapped[str] = mapped_column(String(64), nullable=False)
    server: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    by_server: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delay_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    spf_status: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    is_earliest_origin: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationship
    case: Mapped["Case"] = relationship("Case", back_populates="relay_hops")
