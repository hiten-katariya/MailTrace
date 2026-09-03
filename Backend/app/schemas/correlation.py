from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class ThreatIntelMatchSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    indicator: str
    source: str
    abuse_score: int
    last_reported: Optional[str] = None
    categories: Optional[List[str]] = None

class CaseCorrelationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    threat_intel_matches: List[ThreatIntelMatchSchema]
    campaign_id: Optional[str] = None
    linked_cases: List[str]
    shared_indicator: Optional[str] = None
    attribution_type: str = "unattributed"
    attribution_confidence: str = "low"
    attribution_reason: Optional[str] = None
    investigative_disclaimer: str = (
        "Investigative Attribution Disclaimer: Attribution estimates reflect shared technical infrastructure, "
        "Autonomous Systems, and registrar clusters. MailTrace surfaces campaign linkage to assist investigations — "
        "not a confirmed legal identity of individual human actors."
    )
