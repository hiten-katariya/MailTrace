import os
from io import BytesIO
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import html

# Primary deterministic PDF rendering engine (pure Python / ReportLab based)
try:
    from xhtml2pdf import pisa
    XHTML2PDF_AVAILABLE = True
except ImportError:
    XHTML2PDF_AVAILABLE = False


def format_dt(dt: Optional[datetime]) -> str:
    if not dt:
        return "N/A"
    return dt.strftime("%Y-%m-%d %H:%M:%S UTC")


def build_json_report(
    case_data: Dict[str, Any],
    headers_data: Dict[str, Any],
    content_data: Dict[str, Any],
    origin_data: Dict[str, Any],
    file_hash: str,
    analyst_username: str,
    now_utc: datetime,
) -> Dict[str, Any]:
    return {
        "case_id": case_data.get("case_id", ""),
        "file_hash": file_hash,
        "report_generated_at": now_utc.isoformat(),
        "generated_by": analyst_username,
        "case_summary": {
            "subject": case_data.get("subject", ""),
            "sender": case_data.get("sender", ""),
            "recipient": case_data.get("recipient", ""),
            "received_at": str(case_data.get("received_at", "")),
            "fraud_score": case_data.get("fraud_score", 0),
            "risk_category": case_data.get("risk_category", "legitimate"),
            "confidence": case_data.get("confidence", "low"),
            "verdict_summary": case_data.get("verdict_summary", ""),
            "attribution_type": case_data.get("attribution_type", "unattributed"),
            "attribution_confidence": case_data.get("attribution_confidence", "low"),
        },
        "headers_analysis": headers_data,
        "content_analysis": content_data,
        "origin_intel": origin_data,
        "scoring_breakdown": {
            "fraud_score": case_data.get("fraud_score", 0),
            "risk_category": case_data.get("risk_category", "legitimate"),
            "signals": case_data.get("score_breakdown", []),
        },
        "legal_disclaimer": (
            "Investigation-grade automated forensic tooling output. "
            "Generated for security operations triage and digital evidence preservation. "
            "Not a certified legal opinion."
        ),
    }


def build_html_report(
    case_data: Dict[str, Any],
    headers_data: Dict[str, Any],
    content_data: Dict[str, Any],
    origin_data: Dict[str, Any],
    file_hash: str,
    analyst_username: str,
    now_utc: datetime,
) -> str:
    score = case_data.get("fraud_score", 0)
    risk_cat = str(case_data.get("risk_category", "legitimate")).upper()
    confidence = str(case_data.get("confidence", "low")).upper()
    subject = html.escape(str(case_data.get("subject", "No Subject")))
    sender = html.escape(str(case_data.get("sender", "Unknown Sender")))
    recipient = html.escape(str(case_data.get("recipient", "N/A")))
    received_at = html.escape(str(case_data.get("received_at", "N/A")))
    verdict = html.escape(str(case_data.get("verdict_summary", "No verdict summary provided.")))
    attr_type = html.escape(str(case_data.get("attribution_type", "unattributed")).upper().replace("_", " "))
    attr_conf = html.escape(str(case_data.get("attribution_confidence", "low")).upper())
    
    # Colors for printing
    if risk_cat in ["PHISHING", "BEC"]:
        badge_bg = "#fee2e2"
        badge_color = "#991b1b"
        badge_border = "#f87171"
    elif risk_cat == "SUSPICIOUS":
        badge_bg = "#fef3c7"
        badge_color = "#92400e"
        badge_border = "#f59e0b"
    else:
        badge_bg = "#dcfce7"
        badge_color = "#166534"
        badge_border = "#4ade80"

    # Signals breakdown rows
    signals = case_data.get("score_breakdown", []) or []
    signals_html = ""
    if signals:
        for s in signals:
            sig_name = html.escape(str(s.get("signal", "Signal")))
            weight = s.get("weight", 0)
            contrib = s.get("contribution", 0)
            reason = html.escape(str(s.get("reason", "")))
            source = html.escape(str(s.get("sourceModule", "fusion")).upper())
            signals_html += f"""
            <tr>
                <td style="font-weight: bold;">{sig_name}</td>
                <td><span class="source-tag">{source}</span></td>
                <td style="text-align: center;">{weight}</td>
                <td style="text-align: center; font-weight: bold; color: {badge_color};">+{contrib}</td>
                <td style="font-size: 8.5pt; color: #475569;">{reason}</td>
            </tr>
            """
    else:
        signals_html = "<tr><td colspan='5' style='text-align: center; color: #64748b;'>No risk signals detected. Authentication passed cleanly.</td></tr>"

    # Relay hops rows
    relay_hops = headers_data.get("relay_hops", []) or []
    hops_html = ""
    if relay_hops:
        for hop in relay_hops:
            hop_num = hop.get("hop_number", 1)
            server = html.escape(str(hop.get("by_server") or hop.get("from_server") or "Unknown"))
            ip = html.escape(str(hop.get("from_ip") or "N/A"))
            ts = html.escape(str(hop.get("timestamp") or "N/A"))
            delay = hop.get("delay_ms")
            delay_str = f"{delay} ms" if delay is not None else "—"
            is_origin = " (ORIGIN)" if hop.get("is_origin") else ""
            hops_html += f"""
            <tr>
                <td style="text-align: center;">#{hop_num}</td>
                <td>{server}<strong>{is_origin}</strong></td>
                <td><code>{ip}</code></td>
                <td>{ts}</td>
                <td style="text-align: right;">{delay_str}</td>
            </tr>
            """
    else:
        hops_html = "<tr><td colspan='5' style='text-align: center; color: #64748b;'>No relay headers parsed.</td></tr>"

    # Flagged URLs rows
    urls = content_data.get("urls", []) or []
    urls_html = ""
    if urls:
        for u in urls:
            raw_u = html.escape(str(u.get("url") or ""))
            resolved = html.escape(str(u.get("resolved_url") or raw_u))
            domain = html.escape(str(u.get("domain") or ""))
            homoglyph = "YES" if u.get("is_homoglyph") else "NO"
            susp = "SUSPICIOUS" if u.get("is_suspicious") else "CLEAN"
            urls_html += f"""
            <tr>
                <td style="word-break: break-all; font-size: 8pt;"><code>{raw_u}</code></td>
                <td>{domain}</td>
                <td style="text-align: center; color: {'#dc2626' if homoglyph == 'YES' else '#475569'}; font-weight: bold;">{homoglyph}</td>
                <td style="text-align: center; color: {'#dc2626' if susp == 'SUSPICIOUS' else '#16a34a'}; font-weight: bold;">{susp}</td>
            </tr>
            """
    else:
        urls_html = "<tr><td colspan='4' style='text-align: center; color: #64748b;'>No embedded URLs detected in message body.</td></tr>"

    # Flagged Phrases & BEC
    flagged_phrases = content_data.get("flagged_phrases", []) or []
    bec_indicators = content_data.get("bec_indicators", []) or []
    
    phrases_str = ", ".join([f"<code>{html.escape(str(p))}</code>" for p in flagged_phrases]) if flagged_phrases else "None detected"
    bec_str = ", ".join([f"<code>{html.escape(str(b))}</code>" for b in bec_indicators]) if bec_indicators else "None detected"

    # Origin Geolocation
    geo = origin_data.get("geolocation", {}) or {}
    geo_city = html.escape(str(geo.get("city") or "Unknown City"))
    geo_region = html.escape(str(geo.get("region") or "Unknown Region"))
    geo_country = html.escape(str(geo.get("country") or "Unknown Country"))
    precision = html.escape(str(geo.get("precision_confidence") or "medium"))
    origin_ip = html.escape(str(origin_data.get("originating_ip") or "N/A"))
    isp = html.escape(str(origin_data.get("isp") or "Unknown ISP"))
    vpn_flag = "DETECTED (High Threat)" if origin_data.get("vpn_tor_flag") else "None (Direct Access)"
    domain_intel = origin_data.get("domain_intel", {}) or {}
    domain_name = html.escape(str(domain_intel.get("domain") or "N/A"))
    domain_age = domain_intel.get("domain_age_days")
    domain_age_str = f"{domain_age} days" if domain_age is not None else "Unknown"
    registrar = html.escape(str(domain_intel.get("registrar") or "Unknown Registrar"))
    mx_valid = "VALID MX RECORD" if domain_intel.get("mx_valid") else "NO MX RECORD FOUND"

    # Header auth
    spf_res = str(headers_data.get("spf", "none")).upper()
    dkim_res = str(headers_data.get("dkim", "none")).upper()
    dmarc_res = str(headers_data.get("dmarc", "none")).upper()

    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>MailTrace Forensic Dossier - {case_data.get('case_id')}</title>
<style>
    @page {{
        size: A4 portrait;
        margin: 1.2cm;
    }}
    body {{
        font-family: Helvetica, Arial, sans-serif;
        font-size: 9pt;
        line-height: 1.35;
        color: #0f172a;
        background: #ffffff;
    }}
    .header-table {{
        width: 100%;
        border-bottom: 2px solid #0284c7;
        padding-bottom: 8px;
        margin-bottom: 12px;
    }}
    .logo-title {{
        font-size: 16pt;
        font-weight: bold;
        color: #0369a1;
        letter-spacing: 0.5px;
    }}
    .doc-subtitle {{
        font-size: 8.5pt;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
    }}
    .meta-box {{
        font-size: 8pt;
        color: #334155;
        text-align: right;
    }}
    .section-title {{
        font-size: 10.5pt;
        font-weight: bold;
        color: #0f172a;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 3px;
        margin-top: 14px;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }}
    .threat-banner {{
        background-color: {badge_bg};
        border: 1px solid {badge_border};
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 12px;
    }}
    .threat-score {{
        font-size: 22pt;
        font-weight: bold;
        color: {badge_color};
        line-height: 1;
    }}
    .threat-tier {{
        font-size: 12pt;
        font-weight: bold;
        color: {badge_color};
    }}
    .card-grid {{
        width: 100%;
        margin-bottom: 10px;
    }}
    table.data-table {{
        width: 100%;
        border-collapse: collapse;
        margin-top: 6px;
        margin-bottom: 10px;
        font-size: 8.5pt;
    }}
    table.data-table th {{
        background-color: #f1f5f9;
        color: #334155;
        font-weight: bold;
        text-align: left;
        padding: 5px 6px;
        border: 1px solid #cbd5e1;
    }}
    table.data-table td {{
        padding: 4.5px 6px;
        border: 1px solid #e2e8f0;
        vertical-align: top;
    }}
    code {{
        font-family: Courier, monospace;
        font-size: 8pt;
        background-color: #f8fafc;
        padding: 1px 3px;
        border: 1px solid #e2e8f0;
        border-radius: 2px;
    }}
    .source-tag {{
        font-size: 7.5pt;
        background-color: #e0f2fe;
        color: #0369a1;
        padding: 1px 4px;
        border-radius: 2px;
        font-weight: bold;
    }}
    .disclaimer {{
        margin-top: 18px;
        padding: 8px;
        background-color: #f8fafc;
        border-left: 3px solid #94a3b8;
        font-size: 7.5pt;
        color: #64748b;
        line-height: 1.3;
    }}
</style>
</head>
<body>

<!-- Header -->
<table class="header-table">
    <tr>
        <td>
            <div class="logo-title">MAILTRACE DIGITAL FORENSIC DOSSIER</div>
            <div class="doc-subtitle">Security Incident & Threat Intelligence Audit</div>
        </td>
        <td class="meta-box">
            <div><strong>Case ID:</strong> {case_data.get('case_id')}</div>
            <div><strong>Generated:</strong> {format_dt(now_utc)}</div>
            <div><strong>Analyst:</strong> {html.escape(analyst_username)}</div>
        </td>
    </tr>
</table>

<!-- Section 1: Threat Verdict Banner -->
<div class="threat-banner">
    <table style="width: 100%;">
        <tr>
            <td style="width: 25%; vertical-align: middle;">
                <div class="threat-score">{score} / 100</div>
                <div class="threat-tier">{risk_cat}</div>
                <div style="font-size: 8pt; color: #475569; margin-top: 2px;">Confidence: {confidence}</div>
            </td>
            <td style="width: 75%; vertical-align: middle; border-left: 1px solid {badge_border}; padding-left: 12px;">
                <div style="font-weight: bold; color: #0f172a; margin-bottom: 3px;">EXECUTIVE FORENSIC VERDICT:</div>
                <div style="color: #334155; font-size: 9pt;">{verdict}</div>
            </td>
        </tr>
    </table>
</div>

<!-- Section 2: Case Summary & Evidence Custody -->
<div class="section-title">1. Transmission Summary & Evidence Integrity (FR9)</div>
<table class="data-table">
    <tr>
        <td style="width: 20%; background-color: #f8fafc; font-weight: bold;">Subject:</td>
        <td style="width: 80%;">{subject}</td>
    </tr>
    <tr>
        <td style="background-color: #f8fafc; font-weight: bold;">Sender:</td>
        <td><code>{sender}</code></td>
    </tr>
    <tr>
        <td style="background-color: #f8fafc; font-weight: bold;">Recipient:</td>
        <td><code>{recipient}</code></td>
    </tr>
    <tr>
        <td style="background-color: #f8fafc; font-weight: bold;">Received Timestamp:</td>
        <td>{received_at}</td>
    </tr>
    <tr>
        <td style="background-color: #f8fafc; font-weight: bold;">SHA-256 Digest:</td>
        <td><code style="font-weight: bold; color: #0f172a;">{file_hash}</code> (Immutable Custody Lock)</td>
    </tr>
    <tr>
        <td style="background-color: #f8fafc; font-weight: bold;">Attribution Vector:</td>
        <td><strong>{attr_type}</strong> ({attr_conf} CONFIDENCE) — <span style="font-size: 8pt; color: #64748b;">Investigative infrastructure correlation, not confirmed legal identity.</span></td>
    </tr>
</table>

<!-- Section 3: Scoring Matrix Breakdown -->
<div class="section-title">2. Normalized Composite Scoring Matrix (Max 100 Pts)</div>
<table class="data-table">
    <thead>
        <tr>
            <th style="width: 30%;">Forensic Signal</th>
            <th style="width: 12%;">Source Module</th>
            <th style="width: 10%; text-align: center;">Weight</th>
            <th style="width: 12%; text-align: center;">Contribution</th>
            <th style="width: 36%;">Technical Justification</th>
        </tr>
    </thead>
    <tbody>
        {signals_html}
    </tbody>
</table>

<!-- Section 4: Header & Authentication Analysis -->
<div class="section-title">3. Protocol Authentication & Relay Trajectory</div>
<table class="data-table" style="margin-bottom: 8px;">
    <tr>
        <td style="width: 33%; text-align: center;">
            <strong>SPF:</strong> <span style="color: {'#dc2626' if spf_res == 'FAIL' else '#16a34a'}; font-weight: bold;">{spf_res}</span>
        </td>
        <td style="width: 33%; text-align: center;">
            <strong>DKIM:</strong> <span style="color: {'#dc2626' if dkim_res == 'FAIL' else '#16a34a'}; font-weight: bold;">{dkim_res}</span>
        </td>
        <td style="width: 34%; text-align: center;">
            <strong>DMARC:</strong> <span style="color: {'#dc2626' if dmarc_res == 'FAIL' else '#16a34a'}; font-weight: bold;">{dmarc_res}</span>
        </td>
    </tr>
</table>

<table class="data-table">
    <thead>
        <tr>
            <th style="width: 8%; text-align: center;">Hop</th>
            <th style="width: 38%;">MTA Relay Host</th>
            <th style="width: 22%;">IP Address</th>
            <th style="width: 22%;">Timestamp</th>
            <th style="width: 10%; text-align: right;">Latency</th>
        </tr>
    </thead>
    <tbody>
        {hops_html}
    </tbody>
</table>

<!-- Section 5: NLP & Content Analysis -->
<div class="section-title">4. NLP Content Classification & URL Intelligence</div>
<table class="data-table" style="margin-bottom: 8px;">
    <tr>
        <td style="width: 25%; background-color: #f8fafc; font-weight: bold;">ML Classification:</td>
        <td style="width: 75%;"><code>{content_data.get('classification', 'N/A').upper()}</code> (Confidence: {content_data.get('classification_confidence', 0):.2%})</td>
    </tr>
    <tr>
        <td style="background-color: #f8fafc; font-weight: bold;">Urgency Cues:</td>
        <td>{phrases_str}</td>
    </tr>
    <tr>
        <td style="background-color: #f8fafc; font-weight: bold;">BEC Indicators:</td>
        <td>{bec_str}</td>
    </tr>
</table>

<table class="data-table">
    <thead>
        <tr>
            <th style="width: 48%;">Extracted Target URL</th>
            <th style="width: 24%;">Registered Domain</th>
            <th style="width: 14%; text-align: center;">Homoglyph</th>
            <th style="width: 14%; text-align: center;">Verdict</th>
        </tr>
    </thead>
    <tbody>
        {urls_html}
    </tbody>
</table>

<!-- Section 6: Origin & Domain Intelligence -->
<div class="section-title">5. Origin Geolocation & Domain Infrastructure</div>
<table class="data-table">
    <tr>
        <td style="width: 25%; background-color: #f8fafc; font-weight: bold;">Origin IP:</td>
        <td style="width: 25%;"><code>{origin_ip}</code></td>
        <td style="width: 25%; background-color: #f8fafc; font-weight: bold;">ISP / ASN:</td>
        <td style="width: 25%;">{isp}</td>
    </tr>
    <tr>
        <td style="background-color: #f8fafc; font-weight: bold;">Estimated Geo:</td>
        <td>{geo_city}, {geo_region}, {geo_country}</td>
        <td style="background-color: #f8fafc; font-weight: bold;">Confidence:</td>
        <td>{precision.upper()}</td>
    </tr>
    <tr>
        <td style="background-color: #f8fafc; font-weight: bold;">Anonymization:</td>
        <td>{vpn_flag}</td>
        <td style="background-color: #f8fafc; font-weight: bold;">Domain Age:</td>
        <td>{domain_name} ({domain_age_str})</td>
    </tr>
    <tr>
        <td style="background-color: #f8fafc; font-weight: bold;">Domain Registrar:</td>
        <td>{registrar}</td>
        <td style="background-color: #f8fafc; font-weight: bold;">MX Record:</td>
        <td>{mx_valid}</td>
    </tr>
</table>

<!-- Legal Disclaimer -->
<div class="disclaimer">
    <strong>CONFIDENTIALITY & LEGAL NOTICE:</strong><br>
    This document was automatically generated by the MailTrace Digital Forensics Platform for investigative triage and evidence preservation. 
    Threat verdicts and risk scores are derived from mathematical heuristics, statistical language models, and DNS telemetry. 
    This output is investigation-grade tooling and does not constitute a certified legal opinion or binding cryptographic warrant.
</div>

</body>
</html>
"""
    return html_content


def generate_pdf_report(
    case_data: Dict[str, Any],
    headers_data: Dict[str, Any],
    content_data: Dict[str, Any],
    origin_data: Dict[str, Any],
    file_hash: str,
    analyst_username: str,
    now_utc: datetime,
) -> bytes:
    html_string = build_html_report(
        case_data=case_data,
        headers_data=headers_data,
        content_data=content_data,
        origin_data=origin_data,
        file_hash=file_hash,
        analyst_username=analyst_username,
        now_utc=now_utc,
    )

    # 1. Primary engine: xhtml2pdf / ReportLab (deterministic, zero external C library requirements)
    if XHTML2PDF_AVAILABLE:
        pdf_stream = BytesIO()
        pisa_status = pisa.CreatePDF(html_string, dest=pdf_stream)
        if not pisa_status.err:
            return pdf_stream.getvalue()

    # 2. Fallback: Lazy load WeasyPrint only if xhtml2pdf is unavailable
    try:
        import weasyprint
        return weasyprint.HTML(string=html_string).write_pdf()
    except Exception:
        pass

    raise RuntimeError("No suitable PDF rendering engine available. Ensure xhtml2pdf is installed.")
