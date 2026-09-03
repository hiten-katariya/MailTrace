import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.models.case import Case
from backend.app.models.campaign import Campaign
from backend.app.models.origin import Geolocation, DomainIntel, IPReputationCache
from backend.app.models.header import Headers
from backend.app.models.content import NLPFinding
from backend.app.models.retention import RetentionPolicy
from backend.app.models.audit import AuditLog
from backend.app.core.attribution import determine_attribution
from backend.app.core.correlation import (
    compute_body_hash,
    extract_domain_family,
    correlate_and_cluster_case,
    populate_threat_intel_matches,
)
from backend.app.core.retention import execute_retention_purge, mask_email_address

@pytest.mark.asyncio
async def test_attribution_labeling_four_categories():
    # 1. Anonymized Infrastructure
    cat1, conf1, reason1 = determine_attribution(
        spf_result="pass",
        dkim_result="pass",
        dmarc_result="pass",
        domain_age_days=300,
        is_vpn_tor=True,
        anomalies=[],
        fraud_score=85,
        risk_category="phishing",
        bec_indicators=[],
    )
    assert cat1 == "anonymized_infrastructure"
    assert conf1 == "high"

    # 2. Spoofed Domain
    cat2, conf2, reason2 = determine_attribution(
        spf_result="fail",
        dkim_result="none",
        dmarc_result="fail",
        domain_age_days=1000,
        is_vpn_tor=False,
        anomalies=["From and Return-Path domain mismatch detected"],
        fraud_score=90,
        risk_category="phishing",
        bec_indicators=[],
    )
    assert cat2 == "spoofed_domain"
    assert conf2 == "high"

    # 3. Compromised Account (ATO)
    cat3, conf3, reason3 = determine_attribution(
        spf_result="pass",
        dkim_result="pass",
        dmarc_result="pass",
        domain_age_days=750,
        is_vpn_tor=False,
        anomalies=[],
        fraud_score=78,
        risk_category="bec",
        bec_indicators=["Wire Transfer", "settlement payment"],
    )
    assert cat3 == "compromised_account"
    assert conf3 == "high"

    # 4. Unattributed
    cat4, conf4, reason4 = determine_attribution(
        spf_result="pass",
        dkim_result="pass",
        dmarc_result="pass",
        domain_age_days=500,
        is_vpn_tor=False,
        anomalies=[],
        fraud_score=5,
        risk_category="legitimate",
        bec_indicators=[],
    )
    assert cat4 == "unattributed"
    assert conf4 == "low"


@pytest.mark.asyncio
async def test_campaign_clustering_shared_ip_and_domain(db_session: AsyncSession):
    now = datetime.now(timezone.utc)
    
    # Case A: Phishing from bulletproof IP 185.220.101.5
    case_a = Case(
        id="case-cluster-a",
        file_hash="hash_a" * 6 + "1234",
        raw_file_path="p_a",
        subject="Security Alert - Verify Account",
        sender="service@target-brand-support.com",
        sender_domain="target-brand-support.com",
        received_at=now - timedelta(hours=3),
        status="completed",
        fraud_score=85,
        risk_category="phishing",
    )
    geo_a = Geolocation(
        case_id="case-cluster-a",
        originating_ip="185.220.101.5",
        country="Germany",
    )
    db_session.add_all([case_a, geo_a])
    await db_session.commit()

    # Case B: Another email from the same IP 185.220.101.5
    case_b = Case(
        id="case-cluster-b",
        file_hash="hash_b" * 6 + "1234",
        raw_file_path="p_b",
        subject="Invoice Notification #8821",
        sender="billing@invoice-portal.net",
        sender_domain="invoice-portal.net",
        received_at=now - timedelta(hours=1),
        status="completed",
        fraud_score=75,
        risk_category="phishing",
    )
    db_session.add(case_b)
    await db_session.flush()

    # Correlate Case B -> Should detect Case A via IP 185.220.101.5 and create Campaign!
    campaign = await correlate_and_cluster_case(
        db=db_session,
        case=case_b,
        origin_ip="185.220.101.5",
        domain_name="invoice-portal.net",
        target_brand=None,
    )
    await db_session.commit()

    assert campaign is not None
    assert campaign.shared_indicator == "185.220.101.5"
    assert campaign.shared_indicator_type == "ip"
    assert campaign.case_count == 2
    assert case_b.campaign_id == campaign.id
    assert case_a.campaign_id == campaign.id

    # Case C: Third case joining existing campaign via same IP
    case_c = Case(
        id="case-cluster-c",
        file_hash="hash_c" * 6 + "1234",
        raw_file_path="p_c",
        subject="Urgent: Password Expiry",
        sender="helpdesk@corporate-auth.org",
        sender_domain="corporate-auth.org",
        received_at=now,
        status="completed",
        fraud_score=90,
        risk_category="phishing",
    )
    db_session.add(case_c)
    await db_session.flush()

    camp_joined = await correlate_and_cluster_case(
        db=db_session,
        case=case_c,
        origin_ip="185.220.101.5",
        domain_name="corporate-auth.org",
        target_brand=None,
    )
    await db_session.commit()

    assert camp_joined is not None
    assert camp_joined.id == campaign.id
    assert camp_joined.case_count == 3
    assert case_c.campaign_id == campaign.id

    # Case D: Unrelated clean email with different IP -> Should NOT join campaign
    case_d = Case(
        id="case-cluster-d",
        file_hash="hash_d" * 6 + "1234",
        raw_file_path="p_d",
        subject="Weekly Project Status",
        sender="colleague@legit-corp.com",
        sender_domain="legit-corp.com",
        received_at=now,
        status="completed",
        fraud_score=5,
        risk_category="legitimate",
    )
    db_session.add(case_d)
    await db_session.flush()

    camp_d = await correlate_and_cluster_case(
        db=db_session,
        case=case_d,
        origin_ip="198.51.100.22",
        domain_name="legit-corp.com",
        target_brand=None,
    )
    await db_session.commit()

    assert camp_d is None
    assert case_d.campaign_id is None


@pytest.mark.asyncio
async def test_threat_intel_matching(db_session: AsyncSession, client: AsyncClient):
    case = Case(
        id="case-threat-intel-01",
        file_hash="hash_ti" * 6 + "1234",
        raw_file_path="p_ti",
        subject="Phishing Test with Blocklisted IP",
        sender="spoof@paypa1-security.com",
        sender_domain="paypa1-security.com",
        received_at=datetime.now(timezone.utc),
        status="completed",
        fraud_score=95,
        risk_category="phishing",
    )
    geo = Geolocation(
        case_id="case-threat-intel-01",
        originating_ip="185.220.101.5",
        country="Germany",
    )
    db_session.add_all([case, geo])
    await db_session.commit()

    # Populate threat intel matches
    matches = await populate_threat_intel_matches(
        db=db_session,
        case_id=case.id,
        origin_ip="185.220.101.5",
        domain_name="paypa1-security.com",
        abuse_score=88,
        is_vpn_tor=True,
    )
    await db_session.commit()

    assert len(matches) >= 2  # AbuseIPDB IP hit + OpenPhish domain hit
    sources = [m.source for m in matches]
    assert "AbuseIPDB" in sources
    assert "OpenPhish Blocklist" in sources

    # Query GET /cases/{id}/correlation endpoint
    resp = await client.get(f"/cases/{case.id}/correlation")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["threat_intel_matches"]) >= 2
    assert "investigative_disclaimer" in data


@pytest.mark.asyncio
async def test_retention_purge_preserves_evidence_hash(db_session: AsyncSession, client: AsyncClient):
    old_date = datetime.now(timezone.utc) - timedelta(days=120)
    recent_date = datetime.now(timezone.utc) - timedelta(days=10)

    # 1. Old case (> 90 days)
    old_case = Case(
        id="case-old-purge",
        file_hash="permanent_sha256_custody_hash_old_99999999999999999999999999999999",
        raw_file_path="/vault/evidence/old.eml",
        subject="Old Phishing Attempt from 4 Months Ago",
        sender="attacker@old-phish.net",
        recipient="victim@company.com",
        received_at=old_date,
        submitted_at=old_date,
        status="completed",
        fraud_score=92,
        risk_category="phishing",
        is_purged=False,
    )
    old_headers = Headers(
        case_id="case-old-purge",
        spf_result="fail",
        dkim_result="fail",
        dmarc_result="fail",
        raw_headers="Received: from bad.mta",
    )
    old_nlp = NLPFinding(
        case_id="case-old-purge",
        classification="phishing",
        flagged_phrases=["wire funds immediately"],
    )

    # 2. Recent case (< 90 days)
    recent_case = Case(
        id="case-recent-keep",
        file_hash="permanent_sha256_custody_hash_recent_111111111111111111111111111111",
        raw_file_path="/vault/evidence/recent.eml",
        subject="Recent Alert",
        sender="user@corp.com",
        recipient="admin@corp.com",
        received_at=recent_date,
        submitted_at=recent_date,
        status="completed",
        fraud_score=20,
        risk_category="legitimate",
        is_purged=False,
    )

    db_session.add_all([old_case, old_headers, old_nlp, recent_case])
    await db_session.commit()

    # Trigger retention purge (90 days)
    purged_count, cutoff = await execute_retention_purge(db_session, retention_days=90)
    assert purged_count == 1

    # Verify old case: derived child records removed, but hash & id preserved permanently
    refreshed_old = await db_session.get(Case, "case-old-purge")
    assert refreshed_old.is_purged is True
    assert refreshed_old.file_hash == "permanent_sha256_custody_hash_old_99999999999999999999999999999999"
    assert refreshed_old.raw_file_path == "/vault/evidence/old.eml"
    assert "[PURGED" in refreshed_old.subject

    # Check child rows deleted
    headers_check = await db_session.execute(select(Headers).where(Headers.case_id == "case-old-purge"))
    assert headers_check.scalar_one_or_none() is None

    # Verify recent case remains completely unpurged
    refreshed_recent = await db_session.get(Case, "case-recent-keep")
    assert refreshed_recent.is_purged is False
    assert refreshed_recent.subject == "Recent Alert"


@pytest.mark.asyncio
async def test_pii_masking_toggle(db_session: AsyncSession, client: AsyncClient):
    case = Case(
        id="case-masking-test",
        file_hash="hash_mask" * 6 + "1234",
        raw_file_path="p_mask",
        subject="Executive Compensation Review",
        sender="robert.henderson.ceo@corporate-exec.com",
        recipient="sarah.finance.director@corporate-exec.com",
        received_at=datetime.now(timezone.utc),
        status="completed",
        fraud_score=88,
        risk_category="phishing",
    )
    db_session.add(case)
    await db_session.commit()

    # 1. Enable PII masking via PUT /settings/retention
    put_resp = await client.put("/settings/retention", json={"mask_pii": True, "retention_days": 90})
    assert put_resp.status_code == 200
    assert put_resp.json()["mask_pii"] is True

    # Check GET /cases/{id} -> sender should be masked (e.g. r***o@corporate-exec.com)
    detail_resp = await client.get(f"/cases/{case.id}")
    assert detail_resp.status_code == 200
    sender_masked = detail_resp.json()["sender"]
    assert "corporate-exec.com" in sender_masked
    assert "robert.henderson.ceo" not in sender_masked

    # 2. Disable PII masking via PUT /settings/retention
    put_resp2 = await client.put("/settings/retention", json={"mask_pii": False})
    assert put_resp2.status_code == 200
    assert put_resp2.json()["mask_pii"] is False

    # Check GET /cases/{id} -> sender should be unmasked
    detail_resp2 = await client.get(f"/cases/{case.id}")
    assert detail_resp2.status_code == 200
    assert detail_resp2.json()["sender"] == "robert.henderson.ceo@corporate-exec.com"


@pytest.mark.asyncio
async def test_campaigns_api_endpoints(db_session: AsyncSession, client: AsyncClient):
    now = datetime.now(timezone.utc)
    camp = Campaign(
        id="camp-test-api-99",
        name="Lure Phishing Fleet Alpha",
        shared_indicator="198.51.100.77",
        shared_indicator_type="ip",
        case_count=2,
        primary_risk_category="phishing",
        average_fraud_score=85.0,
    )
    c1 = Case(
        id="case-camp-member-1",
        file_hash="hash1" * 12 + "1234",
        raw_file_path="p1",
        subject="Urgent Payroll Notification",
        sender="hr@portal.com",
        recipient="user1@company.com",
        received_at=now,
        status="completed",
        fraud_score=85,
        risk_category="phishing",
        campaign_id="camp-test-api-99",
    )
    c2 = Case(
        id="case-camp-member-2",
        file_hash="hash2" * 12 + "1234",
        raw_file_path="p2",
        subject="Benefits Enrollment Expiry",
        sender="benefits@portal.com",
        recipient="user2@company.com",
        received_at=now,
        status="completed",
        fraud_score=85,
        risk_category="phishing",
        campaign_id="camp-test-api-99",
    )
    db_session.add_all([camp, c1, c2])
    await db_session.commit()

    # GET /campaigns
    list_resp = await client.get("/campaigns")
    assert list_resp.status_code == 200
    camps = list_resp.json()["campaigns"]
    assert any(c["campaign_id"] == "camp-test-api-99" for c in camps)

    # GET /campaigns/{id}
    detail_resp = await client.get("/campaigns/camp-test-api-99")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["name"] == "Lure Phishing Fleet Alpha"
    assert len(detail["linked_case_ids"]) == 2
    assert len(detail["timeline_events"]) == 2
    assert len(detail["infrastructure_nodes"]) >= 1
