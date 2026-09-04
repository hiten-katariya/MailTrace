from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class AttachmentFindingSchema(BaseModel):
    filename: str
    declared_content_type: Optional[str] = None
    detected_file_type: Optional[str] = None
    file_size: Optional[int] = 0
    file_hash: Optional[str] = None
    is_flagged: bool = False
    flag_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class URLFindingSchema(BaseModel):
    original: str
    resolved: Optional[str] = None
    domain: Optional[str] = None
    flagged: bool = False
    reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CaseContent(BaseModel):
    classification: str  # 'legitimate', 'suspicious', 'phishing', 'bec'
    classification_confidence: float
    sentiment_urgency_score: Optional[int] = 0
    impersonation_target: Optional[str] = None
    flagged_phrases: List[str]
    bec_indicators: List[str]
    urls: List[URLFindingSchema]
    attachments: List[AttachmentFindingSchema] = []

    model_config = ConfigDict(from_attributes=True)
