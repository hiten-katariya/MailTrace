import os
import pytest
from backend.app.core.ingestion import parse_raw_email
from backend.app.core.attachment_analysis import (
    analyze_attachments,
    detect_file_signature,
    AttachmentFinding,
)
from backend.app.core.scoring import calculate_composite_score
from backend.app.core.header_analysis import HeaderAnalysisResult
from backend.app.core.content_analysis import ContentAnalysisResult
from backend.app.core.domain_intel import DomainIntelResult
from backend.app.core.geolocation import GeolocationResult
from backend.app.core.ip_reputation import IPReputationResult

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

def test_clean_pdf_attachment():
    path = os.path.join(FIXTURES_DIR, "clean_pdf_attachment.eml")
    with open(path, "rb") as f:
        eml_bytes = f.read()

    parsed = parse_raw_email(eml_bytes)
    assert len(parsed.attachments) == 1
    att = parsed.attachments[0]
    assert att["filename"] == "statement_september.pdf"

    findings = analyze_attachments(parsed.attachments)
    assert len(findings) == 1
    finding = findings[0]
    assert finding.detected_file_type == "application/pdf"
    assert not finding.is_flagged
    assert finding.flag_reason is None

def test_disguised_exe_attachment_flagged():
    path = os.path.join(FIXTURES_DIR, "disguised_exe_attachment.eml")
    with open(path, "rb") as f:
        eml_bytes = f.read()

    parsed = parse_raw_email(eml_bytes)
    assert len(parsed.attachments) == 1

    findings = analyze_attachments(parsed.attachments)
    assert len(findings) == 1
    finding = findings[0]
    assert finding.is_flagged
    assert finding.detected_file_type == "application/x-dosexec"
    assert "double extension" in finding.flag_reason.lower()
    assert "pe executable" in finding.flag_reason.lower()

def test_macro_enabled_doc_flagged():
    path = os.path.join(FIXTURES_DIR, "macro_enabled_doc.eml")
    with open(path, "rb") as f:
        eml_bytes = f.read()

    parsed = parse_raw_email(eml_bytes)
    assert len(parsed.attachments) == 1

    findings = analyze_attachments(parsed.attachments)
    assert len(findings) == 1
    finding = findings[0]
    assert finding.is_flagged
    assert "macro-enabled" in finding.flag_reason.lower()

def test_known_malicious_hash_detection():
    # Construct synthetic attachment with known test hash
    att_dict = {
        "filename": "innocent.txt",
        "content_type": "text/plain",
        "size": 12,
        "sha256": "44d88612fea8a8f36de82e1278abb02f",
        "payload_bytes": b"malicious content",
    }
    findings = analyze_attachments([att_dict])
    assert len(findings) == 1
    assert findings[0].is_flagged
    assert "known malicious" in findings[0].flag_reason.lower()

def test_attachment_risk_composite_scoring():
    headers = HeaderAnalysisResult(
        spf_result="pass", spf_record=None, spf_sender_ip="1.2.3.4",
        dkim_result="pass", dkim_domain="example.com", dkim_selector="sel",
        dkim_signature_present=True, dmarc_result="pass", dmarc_policy="reject",
        dmarc_disposition=None, relay_chain=[], anomalies=[],
        earliest_origin_ip="1.2.3.4",
    )
    content = ContentAnalysisResult(
        classification="legitimate", classification_confidence=0.9,
        sentiment_urgency_score=0, impersonation_target=None,
        flagged_phrases=[], bec_indicators=[],
    )
    domain = DomainIntelResult(
        domain="example.com", registrar="Reg", registered_on="2015-01-01",
        domain_age_days=3000, registrant_country="US", mx_valid=True, raw_whois="",
    )
    geo = GeolocationResult(
        originating_ip="1.2.3.4", country="US", region="CA", city="San Jose",
        latitude=37.3, longitude=-121.9, precision_confidence="high", isp="ISP", asn="AS1",
    )
    ip_rep = IPReputationResult(
        ip="1.2.3.4", abuse_score=0, is_vpn_tor=False, flag_source="None", isp="ISP"
    )

    bad_att = AttachmentFinding(
        filename="invoice.pdf.exe",
        declared_content_type="application/pdf",
        detected_file_type="application/x-dosexec",
        file_size=1234,
        file_hash="abc12345",
        is_flagged=True,
        flag_reason="Deceptive double extension detected: disguised as '.pdf' but executes as '.exe'",
    )

    res = calculate_composite_score(
        headers_res=headers,
        content_res=content,
        url_results=[],
        domain_res=domain,
        geo_res=geo,
        ip_rep_res=ip_rep,
        attachment_results=[bad_att],
    )

    # Clean email + bad attachment should score points for attachment and be flagged
    assert res.fraud_score >= 8
    attachment_signals = [s for s in res.score_breakdown if s.sourceModule == "attachment"]
    assert len(attachment_signals) == 1
    assert "Deceptive / Disguised Executable Attachment" in attachment_signals[0].signal
    assert attachment_signals[0].contribution == 8
