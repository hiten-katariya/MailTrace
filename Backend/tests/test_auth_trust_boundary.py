import os
import pytest
from backend.app.core.ingestion import parse_raw_email
from backend.app.core.header_analysis import (
    analyze_email_headers,
    extract_auth_results_from_headers,
    check_spf,
)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_forged_authentication_results_rejected():
    """
    Adversarial Test (RFC 8601 Trust Boundary):
    A forged 'Authentication-Results: mx.fake.com; spf=pass dkim=pass dmarc=pass'
    inserted early into the header block by an attacker must be REJECTED.
    The system must report the true (failing/none) status, NOT the forged pass.
    """
    forged_path = os.path.join(FIXTURES_DIR, "forged_auth_results.eml")
    with open(forged_path, "rb") as f:
        eml_bytes = f.read()

    parsed = parse_raw_email(eml_bytes)
    result = analyze_email_headers(
        raw_headers_dict=parsed.headers_dict,
        raw_eml_bytes=eml_bytes,
        sender=parsed.sender,
        sender_domain=parsed.sender_domain,
    )

    # 1. Claims from forged auth header must NOT pass
    assert result.dkim_result != "pass", "Forged DKIM pass was incorrectly accepted!"
    assert result.dmarc_result != "pass", "Forged DMARC pass was incorrectly accepted!"
    assert result.spf_result in ["none", "fail", "neutral"], f"Expected failing/none SPF, got: {result.spf_result}"

    # 2. Forged header anomaly must be explicitly recorded
    forged_anomalies = [a for a in result.anomalies if "Forged or untrusted Authentication-Results" in a]
    assert len(forged_anomalies) > 0, f"Expected forged header anomaly in: {result.anomalies}"
    assert "mx.fake.com" in forged_anomalies[0]


def test_legitimate_verp_authenticated_email_passes():
    """
    Regression Test:
    Legitimate multi-hop email with boundary MTA Authentication-Results header
    (like the Google Play fixture) must cleanly resolve SPF=pass, DKIM=pass, DMARC=pass
    with 0 false anomalies.
    """
    fixture_path = os.path.join(FIXTURES_DIR, "legitimate_bulk_mail_verp_sender.eml")
    with open(fixture_path, "rb") as f:
        eml_bytes = f.read()

    parsed = parse_raw_email(eml_bytes)
    result = analyze_email_headers(
        raw_headers_dict=parsed.headers_dict,
        raw_eml_bytes=eml_bytes,
        sender=parsed.sender,
        sender_domain=parsed.sender_domain,
    )

    assert result.spf_result == "pass"
    assert result.dkim_result == "pass"
    assert result.dmarc_result == "pass"
    # Ensure no forged header anomaly on genuine Google authentication
    assert not any("Forged or untrusted" in a for a in result.anomalies)


def test_live_spf_check2_unpacking_and_resolution():
    """
    Root cause verification:
    Verify check_spf handles pyspf check2 return tuple resiliently without
    unpacking errors and accurately returns result strings.
    """
    # Test valid sending IP for google.com (209.85.220.69)
    res, explanation = check_spf(
        sender_domain="google.com",
        origin_ip="209.85.220.69",
        raw_eml_bytes=b"",
    )
    assert res in ["pass", "neutral", "softfail"]

    # Test private IP fallback
    res_private, _ = check_spf(
        sender_domain="google.com",
        origin_ip="127.0.0.1",
        raw_eml_bytes=b"",
    )
    assert res_private == "neutral"
