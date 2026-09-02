from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class CaseReportJSONResponse(BaseModel):
    case_id: str
    file_hash: str
    report_generated_at: str
    generated_by: str
    case_summary: Dict[str, Any]
    headers_analysis: Dict[str, Any]
    content_analysis: Dict[str, Any]
    origin_intel: Dict[str, Any]
    scoring_breakdown: Dict[str, Any]
    legal_disclaimer: str

    class Config:
        from_attributes = True
