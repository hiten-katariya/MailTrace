from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base

class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)

    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    declared_content_type: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    detected_file_type: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationship
    case: Mapped["Case"] = relationship("Case", back_populates="attachments")
