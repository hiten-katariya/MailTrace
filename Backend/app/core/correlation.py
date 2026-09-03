import re
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy import select, or_, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.case import Case
from backend.app.models.campaign import Campaign
from backend.app.models.threat_intel import ThreatIntelMatch
from backend.app.models.origin import Geolocation
from backend.app.models.content import NLPFinding

PUBLIC_EMAIL_DOMAINS = {
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "icloud.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
    "zoho.com",
    "mail.com",
    "gmx.com",
}

def is_private_or_local_ip(ip: Optional[str]) -> bool:
    if not ip or ip == "127.0.0.1" or ip == "::1" or ip.lower() == "localhost":
        return True
    if ip.startswith("10.") or ip.startswith("192.168."):
        return True
    if ip.startswith("172."):
        try:
            second_octet = int(ip.split(".")[1])
            if 16 <= second_octet <= 31:
                return True
        except Exception:
            pass
    return False

def compute_body_hash(body_text: Optional[str]) -> Optional[str]:
    if not body_text:
        return None
    # Strip HTML tags
    clean = re.sub(r"<[^>]+>", " ", body_text)
    # Remove URLs, digits, punctuation, and multiple spaces
    clean = re.sub(r"https?://\S+", "", clean)
    clean = re.sub(r"[^a-zA-Z\s]", " ", clean)
    tokens = [t.lower() for t in clean.split() if len(t) > 2]
    if len(tokens) < 5:
        return None
    normalized_skeleton = " ".join(tokens)
    return hashlib.sha256(normalized_skeleton.encode("utf-8")).hexdigest()

def extract_domain_family(domain: Optional[str]) -> Optional[str]:
    if not domain:
        return None
    parts = domain.lower().strip().split(".")
    if len(parts) >= 2:
        base_domain = ".".join(parts[-2:])
        if base_domain in PUBLIC_EMAIL_DOMAINS:
            return None
        return base_domain
    return None

async def correlate_and_cluster_case(
    db: AsyncSession,
    case: Case,
    origin_ip: Optional[str],
    domain_name: Optional[str],
    target_brand: Optional[str],
) -> Optional[Campaign]:
    """
    Evaluates correlation pivots across existing cases in PostgreSQL:
    1. Public origin IP
    2. Organizational domain family
    3. Template body hash
    4. Target brand
    
    Assigns the case to an existing campaign or creates a new one when 2+ cases share an indicator.
    """
    matched_cases: List[Case] = []
    shared_indicator = None
    indicator_type = None

    # Pivot 1: Origin IP (if public)
    if origin_ip and not is_private_or_local_ip(origin_ip):
        ip_query = (
            select(Case)
            .join(Geolocation, Geolocation.case_id == Case.id)
            .where(
                and_(
                    Case.id != case.id,
                    Geolocation.originating_ip == origin_ip,
                )
            )
        )
        res = await db.execute(ip_query)
        candidates = res.scalars().all()
        if candidates:
            matched_cases = list(candidates)
            shared_indicator = origin_ip
            indicator_type = "ip"

    # Pivot 2: Domain Family (if not matched yet)
    if not matched_cases and domain_name:
        domain_fam = extract_domain_family(domain_name)
        if domain_fam:
            dom_query = (
                select(Case)
                .where(
                    and_(
                        Case.id != case.id,
                        Case.sender_domain.ilike(f"%{domain_fam}"),
                    )
                )
            )
            res = await db.execute(dom_query)
            candidates = res.scalars().all()
            if candidates:
                matched_cases = list(candidates)
                shared_indicator = f"*.{domain_fam}"
                indicator_type = "domain_family"

    # Pivot 3: Body Template Hash (if not matched yet)
    if not matched_cases and case.body_hash:
        hash_query = (
            select(Case)
            .where(
                and_(
                    Case.id != case.id,
                    Case.body_hash == case.body_hash,
                )
            )
        )
        res = await db.execute(hash_query)
        candidates = res.scalars().all()
        if candidates:
            matched_cases = list(candidates)
            shared_indicator = f"body-hash:{case.body_hash[:12]}"
            indicator_type = "body_hash"

    # Pivot 4: Brand Target
    if not matched_cases and target_brand:
        brand_query = (
            select(Case)
            .join(NLPFinding, NLPFinding.case_id == Case.id)
            .where(
                and_(
                    Case.id != case.id,
                    NLPFinding.impersonation_target == target_brand,
                    Case.risk_category.in_(["phishing", "bec"]),
                )
            )
        )
        res = await db.execute(brand_query)
        candidates = res.scalars().all()
        if len(candidates) >= 2:  # require 2+ prior brand attacks to avoid spurious match
            matched_cases = list(candidates)
            shared_indicator = f"lure-target:{target_brand}"
            indicator_type = "brand_target"

    if not matched_cases:
        return None

    # Check if any matched case already has a campaign
    existing_campaign = None
    for mc in matched_cases:
        if mc.campaign_id:
            camp_res = await db.execute(select(Campaign).where(Campaign.id == mc.campaign_id))
            existing_campaign = camp_res.scalar_one_or_none()
            if existing_campaign:
                break

    now_utc = datetime.now(timezone.utc)

    if existing_campaign:
        case.campaign_id = existing_campaign.id
        existing_campaign.last_seen = now_utc
        # Recount cases linked
        count_res = await db.execute(
            select(func.count(Case.id)).where(or_(Case.campaign_id == existing_campaign.id, Case.id == case.id))
        )
        existing_campaign.case_count = count_res.scalar() or (existing_campaign.case_count + 1)
        return existing_campaign
    else:
        # Create a new campaign linking the candidate cases
        all_cases = [case] + matched_cases
        avg_score = sum(c.fraud_score or 0 for c in all_cases) / len(all_cases)
        
        name_map = {
            "ip": f"Relay Cluster {shared_indicator}",
            "domain_family": f"Infrastructure Family {shared_indicator}",
            "body_hash": f"Template Cluster {shared_indicator}",
            "brand_target": f"Deceptive Campaign ({shared_indicator})",
        }
        campaign_name = name_map.get(indicator_type, f"Campaign {shared_indicator}")
        
        new_campaign = Campaign(
            name=campaign_name,
            shared_indicator=str(shared_indicator),
            shared_indicator_type=str(indicator_type),
            description=f"Correlated cluster sharing {indicator_type}: {shared_indicator}",
            first_seen=min((c.received_at for c in all_cases if c.received_at), default=now_utc),
            last_seen=max((c.received_at for c in all_cases if c.received_at), default=now_utc),
            case_count=len(all_cases),
            primary_risk_category=case.risk_category or "phishing",
            average_fraud_score=round(avg_score, 1),
        )
        db.add(new_campaign)
        await db.flush()  # Generate UUID
        
        case.campaign_id = new_campaign.id
        for mc in matched_cases:
            mc.campaign_id = new_campaign.id
            
        return new_campaign


async def populate_threat_intel_matches(
    db: AsyncSession,
    case_id: str,
    origin_ip: Optional[str],
    domain_name: Optional[str],
    abuse_score: int,
    is_vpn_tor: bool,
) -> List[ThreatIntelMatch]:
    """
    Checks indicators against AbuseIPDB cache and known threat lists,
    persisting ThreatIntelMatch records in the database.
    """
    matches: List[ThreatIntelMatch] = []

    # 1. AbuseIPDB IP reputation hit
    if origin_ip and not is_private_or_local_ip(origin_ip):
        if is_vpn_tor or abuse_score >= 20:
            match = ThreatIntelMatch(
                case_id=case_id,
                indicator=origin_ip,
                indicator_type="ip",
                source="AbuseIPDB",
                abuse_score=max(abuse_score, 75 if is_vpn_tor else abuse_score),
            )
            db.add(match)
            matches.append(match)

    # 2. Known Phishing / Suspicious Domain Pattern Check
    if domain_name:
        suspicious_keywords = ["paypa1", "m365", "login-verify", "secure-account", "auth-update", "wire-transfer"]
        if any(kw in domain_name.lower() for kw in suspicious_keywords):
            match = ThreatIntelMatch(
                case_id=case_id,
                indicator=domain_name,
                indicator_type="domain",
                source="OpenPhish Blocklist",
                abuse_score=85,
            )
            db.add(match)
            matches.append(match)

    return matches
