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
