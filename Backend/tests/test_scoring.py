import pytest
from backend.app.core.scoring import calculate_composite_score
from backend.app.core.header_analysis import HeaderAnalysisResult
from backend.app.core.content_analysis import ContentAnalysisResult
from backend.app.core.domain_intel import DomainIntelResult
from backend.app.core.geolocation import GeolocationResult
from backend.app.core.ip_reputation import IPReputationResult

def test_scoring_bounded_and_legitimate():
    headers_res = HeaderAnalysisResult(
        spf_result="pass",
        spf_record="v=spf1 include:_spf.google.com ~all",
        spf_sender_ip="198.51.100.1",
        dkim_result="pass",
        dkim_domain="company.com",
        dkim_selector="google",
        dkim_signature_present=True,
        dmarc_result="pass",
        dmarc_policy="reject",
        dmarc_disposition=None,
        relay_chain=[{"hop": 1, "ip": "198.51.100.1"}],
        anomalies=[],
        earliest_origin_ip="198.51.100.1",
    )
    content_res = ContentAnalysisResult(
        classification="legitimate",
        classification_confidence=0.95,
        sentiment_urgency_score=0,
        impersonation_target=None,
        flagged_phrases=[],
        bec_indicators=[],
    )
    domain_res = DomainIntelResult(
        domain="company.com",
        registrar="MarkMonitor Inc.",
        registered_on="2010-01-01",
        domain_age_days=5000,
        registrant_country="US",
        mx_valid=True,
        raw_whois="",
    )
    geo_res = GeolocationResult(
        originating_ip="198.51.100.1",
        country="United States",
        region="California",
        city="Mountain View",
        latitude=37.4,
        longitude=-122.0,
        precision_confidence="country: high, city: high",
        isp="Google LLC",
        asn="AS15169",
    )
    ip_rep_res = IPReputationResult(
        ip="198.51.100.1",
        abuse_score=0,
        is_vpn_tor=False,
        flag_source="AbuseIPDB",
        isp="Google LLC",
    )

    res = calculate_composite_score(
        headers_res=headers_res,
        content_res=content_res,
        url_results=[],
        domain_res=domain_res,
        geo_res=geo_res,
        ip_rep_res=ip_rep_res,
    )

    assert 0 <= res.fraud_score <= 100
    assert res.fraud_score < 30
    assert res.risk_category == "legitimate"

def test_scoring_bounded_and_phishing():
    headers_res = HeaderAnalysisResult(
        spf_result="fail",
        spf_record="v=spf1 -all",
        spf_sender_ip="203.0.113.199",
        dkim_result="fail",
        dkim_domain="paypal.com",
        dkim_selector="default",
        dkim_signature_present=False,
        dmarc_result="fail",
        dmarc_policy="reject",
        dmarc_disposition="reject",
        relay_chain=[{"hop": 1, "ip": "203.0.113.199"}],
        anomalies=["Reply-To domain mismatch", "Return-Path envelope mismatch"],
        earliest_origin_ip="203.0.113.199",
    )
    content_res = ContentAnalysisResult(
        classification="phishing",
        classification_confidence=0.98,
        sentiment_urgency_score=90,
        impersonation_target="PayPal",
        flagged_phrases=["account will be suspended within 24 hours", "immediate action is required"],
        bec_indicators=[],
    )
    domain_res = DomainIntelResult(
        domain="paypa1-security-alert.com",
        registrar="NameCheap",
        registered_on="2026-09-01",
        domain_age_days=1,
        registrant_country="RU",
        mx_valid=False,
        raw_whois="",
    )
    geo_res = GeolocationResult(
        originating_ip="185.220.101.5",
        country="Germany",
        region="Hesse",
        city="Frankfurt",
        latitude=50.1,
        longitude=8.6,
        precision_confidence="country: high, city: high",
        isp="Tor Exit Node",
        asn="AS9009",
    )
    ip_rep_res = IPReputationResult(
        ip="185.220.101.5",
        abuse_score=95,
        is_vpn_tor=True,
        flag_source="AbuseIPDB Live API",
        isp="M247 Ltd",
    )

    res = calculate_composite_score(
        headers_res=headers_res,
        content_res=content_res,
        url_results=[{"original": "http://paypa1-security.com", "is_flagged": True, "reason": "Homoglyph of paypal", "redirect_hops": 2}],
        domain_res=domain_res,
        geo_res=geo_res,
        ip_rep_res=ip_rep_res,
    )

    assert 0 <= res.fraud_score <= 100
    assert res.fraud_score >= 80
    assert res.risk_category == "phishing"
    assert len(res.score_breakdown) > 3
