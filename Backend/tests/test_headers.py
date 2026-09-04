import os
import pytest
from backend.app.core.ingestion import parse_raw_email
from backend.app.core.header_analysis import analyze_email_headers, parse_received_headers

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_clean_business_email_headers():
    fixture_path = os.path.join(FIXTURES_DIR, "clean_business_email.eml")
    with open(fixture_path, "rb") as f:
        content = f.read()

    parsed = parse_raw_email(content)
    assert parsed.sender == "sjenkins@acme-corp.com"
    assert parsed.sender_domain == "acme-corp.com"
    assert parsed.subject == "Q3 Financial Planning Sync & Agenda"

    headers_res = analyze_email_headers(
        raw_headers_dict=parsed.headers_dict,
        raw_eml_bytes=content,
        sender=parsed.sender,
        sender_domain=parsed.sender_domain,
    )

    assert len(headers_res.relay_chain) >= 1
    assert headers_res.relay_chain[0]["hop"] == 1
    assert headers_res.relay_chain[0]["ip"] == "198.51.100.25"
    assert len(headers_res.anomalies) == 0

def test_reply_to_mismatch_detected():
    fixture_path = os.path.join(FIXTURES_DIR, "reply_to_mismatch_urgent.eml")
    with open(fixture_path, "rb") as f:
        content = f.read()

    parsed = parse_raw_email(content)
    headers_res = analyze_email_headers(
        raw_headers_dict=parsed.headers_dict,
        raw_eml_bytes=content,
        sender=parsed.sender,
        sender_domain=parsed.sender_domain,
    )

    assert any("Reply-To domain mismatch" in a for a in headers_res.anomalies)

def test_out_of_order_timestamp_anomaly():
    fixture_path = os.path.join(FIXTURES_DIR, "out_of_order_relay.eml")
    with open(fixture_path, "rb") as f:
        content = f.read()

    parsed = parse_raw_email(content)
    headers_res = analyze_email_headers(
        raw_headers_dict=parsed.headers_dict,
        raw_eml_bytes=content,
        sender=parsed.sender,
        sender_domain=parsed.sender_domain,
    )

    # Chronological: hop 1 was 12:10:00, hop 2 was 12:00:00 (backwards jump of 600s)
    assert any("Out-of-order Received timestamp anomaly" in a for a in headers_res.anomalies)

def test_dmarc_policy_reject_failure():
    fixture_path = os.path.join(FIXTURES_DIR, "dmarc_reject_failure.eml")
    with open(fixture_path, "rb") as f:
        content = f.read()

    parsed = parse_raw_email(content)
    headers_res = analyze_email_headers(
        raw_headers_dict=parsed.headers_dict,
        raw_eml_bytes=content,
        sender=parsed.sender,
        sender_domain=parsed.sender_domain,
    )

    # Missing cryptographic signature on claimed PayPal brand or SPF/DMARC failure
    assert headers_res.dkim_signature_present is False
    assert any("Cryptographic signature missing" in a or "DMARC" in a or "SPF" in a for a in headers_res.anomalies)

def test_legitimate_bulk_mail_verp_sender_headers():
    fixture_path = os.path.join(FIXTURES_DIR, "legitimate_bulk_mail_verp_sender.eml")
    with open(fixture_path, "rb") as f:
        content = f.read()

    parsed = parse_raw_email(content)
    assert parsed.sender == "googleplay-noreply@google.com"
    assert parsed.sender_domain == "google.com"

    headers_res = analyze_email_headers(
        raw_headers_dict=parsed.headers_dict,
        raw_eml_bytes=content,
        sender=parsed.sender,
        sender_domain=parsed.sender_domain,
    )

    # Return-Path is scoutcamp.bounces.google.com (VERP subdomain of google.com)
    # Must NOT produce any Return-Path mismatch anomaly
    assert not any("Return-Path envelope mismatch" in a for a in headers_res.anomalies)
    assert len(headers_res.anomalies) == 0
    assert headers_res.spf_result == "pass"
    assert headers_res.dkim_result == "pass"
    assert headers_res.dmarc_result == "pass"

def test_forged_authentication_results_rejected():
    # Crafted attacker email injecting forged Authentication-Results
    forged_eml = b"""From: spoof@paypal.com
To: victim@company.com
Subject: Unauthorized Security Warning
Authentication-Results: fake-mta.attacker.net; spf=pass dkim=pass dmarc=pass
Received: from evil-attacker.com (evil-attacker.com [185.220.101.5]) by mail.victim-company.com with ESMTP id 998877; Wed, 02 Sep 2026 12:00:00 +0000
Return-Path: <bounce@evil-attacker.com>

Please verify your credentials immediately.
"""
    parsed = parse_raw_email(forged_eml)
    headers_res = analyze_email_headers(
        raw_headers_dict=parsed.headers_dict,
        raw_eml_bytes=forged_eml,
        sender=parsed.sender,
        sender_domain=parsed.sender_domain,
    )

    # 1. System must detect that authserv-id 'fake-mta.attacker.net' does NOT match boundary MTA 'mail.victim-company.com'
    assert any("Forged or untrusted Authentication-Results header" in a for a in headers_res.anomalies)

    # 2. System must NOT trust the forged claims and fall back to real validation
    assert headers_res.dkim_result != "pass"
    assert headers_res.dmarc_result != "pass"

def test_compromised_account_subtle_payment_diversion_caught():
    from backend.app.core.content_analysis import analyze_email_content
    from backend.app.core.attribution import determine_attribution
    from backend.app.core.scoring import calculate_composite_score
    from backend.app.models.origin import Geolocation, DomainIntel, IPReputationCache

    subtle_bec_eml = b"""From: cfo@trusted-supplier.com
To: accounts.payable@client-corp.com
Subject: Updated remittance coordinates for pending settlement
Authentication-Results: mx.client-corp.com; spf=pass; dkim=pass; dmarc=pass (p=reject)
DKIM-Signature: v=1; a=rsa-sha256; d=trusted-supplier.com; s=k1; b=dummy;
Received: from mail.trusted-supplier.com (mail.trusted-supplier.com [198.51.100.20]) by mx.client-corp.com with ESMTP id 5544; Wed, 02 Sep 2026 12:00:00 +0000
Return-Path: <cfo@trusted-supplier.com>

Hi team,

Due to our corporate restructuring, please redirect the pending settlement payment to our new clearing bank coordinates below.

Treasury Account: 8839-2091-22
Routing: 021000021

Thanks,
Executive Operations
"""
    parsed = parse_raw_email(subtle_bec_eml)
    headers_res = analyze_email_headers(
        raw_headers_dict=parsed.headers_dict,
        raw_eml_bytes=subtle_bec_eml,
        sender=parsed.sender,
        sender_domain=parsed.sender_domain,
    )

    content_res = analyze_email_content(parsed.subject, parsed.body_text, parsed.sender)
    
    # 1. Subtle payment diversion phrase must be extracted
    assert len(content_res.bec_indicators) >= 1
    assert content_res.classification == "bec"

    # 2. Composite score calculation must NOT suppress the BEC penalty even with clean headers
    domain_res = DomainIntel(
        case_id="case-test-ato",
        domain="trusted-supplier.com",
        domain_age_days=800,
        registered_on="2020-01-01",
        registrar="MarkMonitor",
        mx_valid=True,
    )
    geo_res = Geolocation(case_id="case-test-ato", originating_ip="198.51.100.20", country="United States")
    ip_rep_res = IPReputationCache(ip="198.51.100.20", abuse_score=0, is_vpn_tor=False)

    score_res = calculate_composite_score(
        headers_res=headers_res,
        content_res=content_res,
        url_results=[],
        domain_res=domain_res,
        geo_res=geo_res,
        ip_rep_res=ip_rep_res,
    )

    # Must be categorized as BEC
    assert score_res.risk_category == "bec"
    assert any(s.signal == "Business Email Compromise (BEC) Financial Pretext" for s in score_res.score_breakdown)

    # 3. Attribution must correctly classify as compromised_account
    attr_type, attr_conf, _ = determine_attribution(
        spf_result=headers_res.spf_result,
        dkim_result=headers_res.dkim_result,
        dmarc_result=headers_res.dmarc_result,
        domain_age_days=800,
        is_vpn_tor=False,
        anomalies=[],
        fraud_score=score_res.fraud_score,
        risk_category=score_res.risk_category,
        bec_indicators=content_res.bec_indicators,
    )
    assert attr_type == "compromised_account"
    assert attr_conf == "high"
