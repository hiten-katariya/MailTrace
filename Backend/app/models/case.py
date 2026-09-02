import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, DateTime, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  # SHA-256
    raw_file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    sender: Mapped[str] = mapped_column(String(255), nullable=False)
    sender_domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    recipient: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, server_default=func.now())
    
    # Status: 'processing', 'completed', 'failed'
    status: Mapped[str] = mapped_column(String(32), default="processing", index=True)
    
    # Pipeline Progress: {"header_analysis": "done", "nlp_analysis": "done", "geolocation": "done", "domain_intel": "done", "scoring": "done"}
    pipeline_progress: Mapped[Dict[str, str]] = mapped_column(
        JSON,
        default=lambda: {
            "header_analysis": "pending",
            "nlp_analysis": "pending",
            "geolocation": "pending",
            "domain_intel": "pending",
            "scoring": "pending",
        }
    )
    
    # Forensic Score Outputs
    fraud_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    risk_category: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)  # 'legitimate', 'suspicious', 'phishing', 'bec'
    confidence: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)  # 'high', 'medium', 'low'
    verdict_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    score_breakdown: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, nullable=True)

    # Relationships
    headers: Mapped[Optional["Headers"]] = relationship("Headers", back_populates="case", cascade="all, delete-orphan", uselist=False)
    relay_hops: Mapped[List["RelayHop"]] = relationship("RelayHop", back_populates="case", cascade="all, delete-orphan", order_by="RelayHop.hop_number")
    nlp_finding: Mapped[Optional["NLPFinding"]] = relationship("NLPFinding", back_populates="case", cascade="all, delete-orphan", uselist=False)
    urls: Mapped[List["URLFinding"]] = relationship("URLFinding", back_populates="case", cascade="all, delete-orphan")
    geolocation: Mapped[Optional["Geolocation"]] = relationship("Geolocation", back_populates="case", cascade="all, delete-orphan", uselist=False)
    domain_intel: Mapped[Optional["DomainIntel"]] = relationship("DomainIntel", back_populates="case", cascade="all, delete-orphan", uselist=False)
