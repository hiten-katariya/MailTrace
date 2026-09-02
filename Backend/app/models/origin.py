from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Geolocation(Base):
    __tablename__ = "geolocation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    originating_ip: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    country: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    precision_confidence: Mapped[str] = mapped_column(String(64), default="country: high, city: low")
    isp: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    asn: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Relationship
    case: Mapped["Case"] = relationship("Case", back_populates="geolocation")


class DomainIntel(Base):
    __tablename__ = "domain_intel"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    domain: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    registrar: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    registered_on: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    domain_age_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    registrant_country: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    mx_valid: Mapped[bool] = mapped_column(Boolean, default=False)
    raw_whois: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationship
    case: Mapped["Case"] = relationship("Case", back_populates="domain_intel")


class IPReputationCache(Base):
    __tablename__ = "ip_reputation_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ip: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    abuse_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    is_vpn_tor: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_source: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, default="AbuseIPDB")
    isp: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cached_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, server_default=func.now())
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
