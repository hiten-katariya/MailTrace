from typing import Optional, List
from sqlalchemy import String, Integer, Float, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base

class NLPFinding(Base):
    __tablename__ = "nlp_findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Classification
    classification: Mapped[str] = mapped_column(String(32), default="legitimate")  # 'legitimate', 'suspicious', 'phishing', 'bec'
    classification_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    sentiment_urgency_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    impersonation_target: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

    # Flagged Phrases & BEC Indicators
    flagged_phrases: Mapped[List[str]] = mapped_column(JSON, default=list)
    bec_indicators: Mapped[List[str]] = mapped_column(JSON, default=list)

    # Relationship
    case: Mapped["Case"] = relationship("Case", back_populates="nlp_finding")


class URLFinding(Base):
    __tablename__ = "urls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)

    original_url: Mapped[str] = mapped_column(Text, nullable=False)
    resolved_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # 'lookalike domain', 'ip in url', etc.
    redirect_hops: Mapped[int] = mapped_column(Integer, default=0)
    status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationship
    case: Mapped["Case"] = relationship("Case", back_populates="urls")
