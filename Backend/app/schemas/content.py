from typing import List, Optional
from pydantic import BaseModel

class URLFindingSchema(BaseModel):
    original: str
    resolved: Optional[str] = None
    domain: Optional[str] = None
    flagged: bool = False
    reason: Optional[str] = None

    class Config:
        from_attributes = True

class CaseContent(BaseModel):
    classification: str  # 'legitimate', 'suspicious', 'phishing', 'bec'
    classification_confidence: float
    sentiment_urgency_score: Optional[int] = 0
    impersonation_target: Optional[str] = None
    flagged_phrases: List[str]
    bec_indicators: List[str]
    urls: List[URLFindingSchema]

    class Config:
        from_attributes = True
