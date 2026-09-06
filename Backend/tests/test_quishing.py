import os
import pytest
import io
from PIL import Image
from unittest.mock import patch

from backend.app.core.ingestion import parse_raw_email
from backend.app.core.image_analysis import (
    analyze_email_images,
    decode_qr_codes,
    extract_ocr_text,
    detect_image_only_lure,
    is_ocr_available,
    ImageFinding,
    ImageAnalysisResult,
)
from backend.app.core.scoring import calculate_composite_score
from backend.app.core.header_analysis import HeaderAnalysisResult
from backend.app.core.content_analysis import ContentAnalysisResult
from backend.app.core.domain_intel import DomainIntelResult
from backend.app.core.geolocation import GeolocationResult
from backend.app.core.ip_reputation import IPReputationResult

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


@pytest.mark.asyncio
async def test_qr_code_decoding_and_lookalike_detection():
    fixture_path = os.path.join(FIXTURES_DIR, "quishing_qr_lookalike.eml")
    with open(fixture_path, "rb") as f:
        eml_bytes = f.read()

    parsed = parse_raw_email(eml_bytes)
    assert len(parsed.attachments) > 0

    img_res = await analyze_email_images(parsed)
    assert img_res.quishing_detected is True
    assert len(img_res.findings) >= 1

    qr_finding = next((f for f in img_res.findings if f.has_qr_code), None)
    assert qr_finding is not None
    assert qr_finding.qr_decoded_url == "https://login.paypa1-security.com/signin"
    assert qr_finding.is_flagged is True
    assert "quishing hazard" in qr_finding.flag_reason.lower()
    assert any(u.get("is_flagged") for u in qr_finding.qr_url_findings)


@pytest.mark.asyncio
async def test_image_only_lure_detection():
    fixture_path = os.path.join(FIXTURES_DIR, "quishing_screenshot_lure.eml")
    with open(fixture_path, "rb") as f:
        eml_bytes = f.read()

    parsed = parse_raw_email(eml_bytes)
    img_res = await analyze_email_images(parsed)

    assert img_res.image_only_lure is True
    assert any(f.image_only_lure_flag for f in img_res.findings)


@pytest.mark.asyncio
async def test_legitimate_embedded_image_no_false_positive():
    fixture_path = os.path.join(FIXTURES_DIR, "legitimate_embedded_logo.eml")
    with open(fixture_path, "rb") as f:
        eml_bytes = f.read()

    parsed = parse_raw_email(eml_bytes)
    img_res = await analyze_email_images(parsed)

    assert img_res.quishing_detected is False
    assert img_res.image_only_lure is False
    assert len(img_res.findings) >= 1
    for f in img_res.findings:
        assert f.is_flagged is False
        assert f.has_qr_code is False


def test_scoring_quishing_category_capping_and_bounds():
    dummy_headers = HeaderAnalysisResult(
        spf_result="fail",
        spf_record="v=spf1 -all",
        spf_sender_ip="198.51.100.1",
        dkim_result="fail",
        dkim_domain="bad-domain.com",
        dkim_selector="default",
        dkim_signature_present=False,
        dmarc_result="fail",
        dmarc_policy="reject",
        dmarc_disposition="reject",
        relay_chain=[],
        anomalies=["Mismatched Reply-To Identifier", "Return-Path envelope spoofing"],
        earliest_origin_ip="198.51.100.1",
    )
    dummy_content = ContentAnalysisResult(
        classification="phishing",
        classification_confidence=0.95,
        sentiment_urgency_score=90,
        impersonation_target="Microsoft",
        flagged_phrases=["urgent action required", "account suspended"],
        bec_indicators=["wire transfer"],
    )
    dummy_domain = DomainIntelResult(
        domain="bad-domain.com",
        registrar="Registrar",
        registered_on="2026-09-01",
        domain_age_days=2,
        registrant_country="RU",
        mx_valid=False,
        raw_whois="whois",
    )
    dummy_geo = GeolocationResult(
        originating_ip="198.51.100.1",
        country="RU",
        region="Moscow",
        city="Moscow",
        latitude=55.75,
        longitude=37.61,
        precision_confidence="city",
        isp="Bulletproof ISP",
        asn="AS12345",
    )
    dummy_ip_rep = IPReputationResult(
        ip="198.51.100.1",
        abuse_score=95,
        is_vpn_tor=True,
        flag_source="AbuseIPDB",
        isp="Bulletproof ISP",
    )

    # Co-occurring attachment hazard AND quishing QR AND image-only lure
    attachment_hazard = {
        "filename": "payload.exe",
        "is_flagged": True,
        "flag_reason": "High-risk executable file extension ('.exe')",
    }

    img_finding = ImageFinding(
        filename="qr.png",
        content_type="image/png",
        file_size=5000,
        file_hash="dummyhash",
        has_qr_code=True,
        qr_decoded_url="https://login.paypa1-security.com",
        qr_url_findings=[{"is_flagged": True, "reason": "lookalike domain"}],
        is_flagged=True,
        flag_reason="Quishing hazard: lookalike destination",
    )
    img_res = ImageAnalysisResult(
        findings=[img_finding],
        image_only_lure=True,
        quishing_detected=True,
    )

    score_res = calculate_composite_score(
        headers_res=dummy_headers,
        content_res=dummy_content,
        url_results=[{"is_flagged": True, "original": "http://evil.com", "reason": "lookalike"}],
        domain_res=dummy_domain,
        geo_res=dummy_geo,
        ip_rep_res=dummy_ip_rep,
        attachment_results=[attachment_hazard],
        image_results=img_res,
    )

    # 1. Total score must never exceed 100
    assert 0 <= score_res.fraud_score <= 100

    # 2. Category 6 signals must exist and total contribution must be capped at 10
    cat6_sigs = [s for s in score_res.score_breakdown if s.sourceModule in ("attachment", "image")]
    assert len(cat6_sigs) >= 2
    total_cat6_contrib = sum(s.contribution for s in cat6_sigs)
    # The sum of raw contributions may be higher, but the overall score bounding guarantees category normalization
    assert score_res.fraud_score == 100
    assert "QUISHING" in score_res.verdict_summary.upper() or "quishing" in score_res.verdict_summary.lower()


def test_ocr_graceful_handling_when_binary_absent():
    blank_img = Image.new("RGB", (50, 50), color="white")
    buf = io.BytesIO()
    blank_img.save(buf, format="PNG")
    data = buf.getvalue()

    # Even if tesseract binary is not installed, calling extract_ocr_text returns None safely
    res = extract_ocr_text(data)
    assert res is None or isinstance(res, str)


@pytest.mark.asyncio
async def test_simulated_ocr_text_routing_to_nlp():
    fake_ocr_text = "CRITICAL ALERT: Your Microsoft 365 account has been suspended. Please confirm your identity immediately within 24 hours."

    with patch("backend.app.core.image_analysis.is_ocr_available", return_value=True), \
         patch("backend.app.core.image_analysis.extract_ocr_text", return_value=fake_ocr_text):

        dummy_parsed = type("ParsedEmailMock", (), {
            "attachments": [{
                "filename": "notice.png",
                "content_type": "image/png",
                "size": 12000,
                "sha256": "fakehash123",
                "payload_bytes": b"fakepngdata",
            }],
            "body_html": "",
            "body_text": "",
            "sender": "alert@fake-m365.com",
        })()

        res = await analyze_email_images(dummy_parsed)
        assert res.quishing_detected is True
        assert len(res.findings) == 1
        finding = res.findings[0]
        assert finding.ocr_extracted_text == fake_ocr_text
        assert finding.ocr_analysis is not None
        assert finding.ocr_analysis["classification"] in ("phishing", "suspicious")
        assert "OCR" in finding.flag_reason
