from typing import Optional
from pydantic import BaseModel

class GeolocationSchema(BaseModel):
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    precision_confidence: str = "country: high, city: low"

    class Config:
        from_attributes = True

class DomainIntelSchema(BaseModel):
    domain: str
    registrar: Optional[str] = None
    registered_on: Optional[str] = None
    domain_age_days: Optional[int] = None
    registrant_country: Optional[str] = None
    mx_valid: bool = False

    class Config:
        from_attributes = True

class CaseOrigin(BaseModel):
    originating_ip: str
    geolocation: GeolocationSchema
    isp: Optional[str] = None
    vpn_tor_flag: bool = False
    flag_source: Optional[str] = "AbuseIPDB"
    domain_intel: DomainIntelSchema

    class Config:
        from_attributes = True
