import os
import pytest
from backend.app.core.ingestion import parse_raw_email
from backend.app.core.header_analysis import analyze_email_headers, parse_received_headers

FIXTURES_DIR = os.path.join("backend", "tests", "fixtures")

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
