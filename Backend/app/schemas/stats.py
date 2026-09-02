from typing import List, Optional
from pydantic import BaseModel, Field

class ScoreBracketSchema(BaseModel):
    range: str = Field(..., description="Score interval (e.g. '0–20', '21–40')")
    count: int = Field(..., description="Number of cases in this score range")
    color: str = Field(..., description="Display hex color")

class RiskCategoryCountSchema(BaseModel):
    category: str = Field(..., description="Risk category name: legitimate, suspicious, phishing, bec")
    count: int = Field(..., description="Case count for this category")
    percentage: int = Field(..., description="Percentage of total cases")
    color: str = Field(..., description="Display hex color")

class DetectionTrendDaySchema(BaseModel):
    date: str = Field(..., description="Date formatted as YYYY-MM-DD")
    phishing: int = 0
    bec: int = 0
    suspicious: int = 0
    legitimate: int = 0

class CasesStatsResponse(BaseModel):
    total_cases: int
    high_risk_cases: int
    suspicious_cases: int
    legitimate_cases: int
    average_score: float
    by_risk_category: List[RiskCategoryCountSchema]
    score_brackets: List[ScoreBracketSchema]
    detection_trends: List[DetectionTrendDaySchema]

    class Config:
        from_attributes = True
