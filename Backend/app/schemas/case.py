from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ScoreSignal(BaseModel):
    signal: str
    weight: int
    contribution: int
    reason: Optional[str] = None
    sourceModule: Optional[str] = "fusion"

class CaseSummary(BaseModel):
    case_id: str
    subject: str
    sender: str
    received_at: str
    fraud_score: int
    risk_category: str  # 'legitimate', 'suspicious', 'phishing', 'bec'
    status: Optional[str] = "completed"
    spf: str
    dkim: str
    dmarc: str

    class Config:
        from_attributes = True

class CaseDetail(BaseModel):
    case_id: str
    subject: str
    sender: str
    received_at: str
    file_hash: str
    fraud_score: int
    risk_category: str
    confidence: str
    verdict_summary: str
    score_breakdown: List[ScoreSignal]
    status: Optional[str] = "completed"
    spf: Optional[str] = "none"
    dkim: Optional[str] = "none"
    dmarc: Optional[str] = "none"

    class Config:
        from_attributes = True

class CasesResponse(BaseModel):
    total: int
    page: int
    limit: int
    cases: List[CaseSummary]

class IngestResponse(BaseModel):
    case_id: str
    status: str = "processing"
    submitted_at: str
    file_hash: str
    filename: Optional[str] = None

class CaseStatusResponse(BaseModel):
    case_id: str
    status: str  # 'processing', 'completed', 'failed'
    progress: Dict[str, Any] = Field(
        default_factory=lambda: {
            "header_analysis": "pending",
            "nlp_analysis": "pending",
            "geolocation": "pending",
            "domain_intel": "pending",
            "scoring": "pending",
        }
    )

class BatchDeleteRequest(BaseModel):
    case_ids: List[str]

class DeleteCaseResponse(BaseModel):
    success: bool = True
    message: str = "Success"
    case_id: Optional[str] = None
    deleted_count: Optional[int] = 1
