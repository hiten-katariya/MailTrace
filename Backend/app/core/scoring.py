from typing import List, Dict, Any, Optional
from backend.app.core.header_analysis import HeaderAnalysisResult
from backend.app.core.content_analysis import ContentAnalysisResult
from backend.app.core.domain_intel import DomainIntelResult
from backend.app.core.geolocation import GeolocationResult
from backend.app.core.ip_reputation import IPReputationResult

class ScoreSignal:
    def __init__(
        self,
        signal: str,
        weight: int,
        contribution: int,
        reason: Optional[str] = None,
        sourceModule: str = "fusion",
    ):
        self.signal = signal
        self.weight = weight
        self.contribution = contribution
        self.reason = reason
        self.sourceModule = sourceModule

    def to_dict(self) -> Dict[str, Any]:
        return {
            "signal": self.signal,
            "weight": self.weight,
            "contribution": self.contribution,
            "reason": self.reason,
            "sourceModule": self.sourceModule,
        }

class CompositeScoringResult:
    def __init__(
        self,
        fraud_score: int,
        risk_category: str,
        confidence: str,
        verdict_summary: str,
        score_breakdown: List[ScoreSignal],
    ):
        self.fraud_score = fraud_score
        self.risk_category = risk_category
        self.confidence = confidence
        self.verdict_summary = verdict_summary
        self.score_breakdown = score_breakdown

def calculate_composite_score(
    headers_res: HeaderAnalysisResult,
    content_res: ContentAnalysisResult,
    url_results: List[Dict[str, Any]],
    domain_res: DomainIntelResult,
    geo_res: GeolocationResult,
    ip_rep_res: IPReputationResult,
    attachment_results: Optional[List[Any]] = None,
    # Phase 4 extension hooks
    correlation_data: Optional[Dict[str, Any]] = None,
    threat_intel_matches: Optional[List[Dict[str, Any]]] = None,
) -> CompositeScoringResult:
    signals: List[ScoreSignal] = []

    # ==========================================
    # CATEGORY 1: Protocol Authentication (Max 20 pts)
    # ==========================================
    cat1_signals = []
    
    # DMARC
    if headers_res.dmarc_result == "fail":
        cat1_signals.append(ScoreSignal(
            signal="DMARC Policy Failure",
            weight=12,
            contribution=12,
            reason="MTA disposition rejected/quarantined transmission due to unaligned sender domain policy.",
            sourceModule="header",
        ))
    
    # SPF
    if headers_res.spf_result == "fail":
        cat1_signals.append(ScoreSignal(
            signal="SPF Validation Failure",
            weight=4,
            contribution=4,
            reason="Sending MTA IP is not authorized in published DNS SPF TXT record.",
            sourceModule="header",
        ))
    elif headers_res.spf_result == "softfail":
        cat1_signals.append(ScoreSignal(
            signal="SPF Softfail Anomaly",
            weight=4,
            contribution=2,
            reason="Sending MTA IP produced ~all softfail policy match.",
            sourceModule="header",
        ))

    # DKIM
    if headers_res.dkim_result == "fail" or (not headers_res.dkim_signature_present and headers_res.dmarc_result == "fail"):
        cat1_signals.append(ScoreSignal(
            signal="DKIM Cryptographic Signature Failure",
            weight=4,
            contribution=4,
            reason="Cryptographic DKIM public key signature missing or failed RSA validation.",
            sourceModule="header",
        ))

    # Complete absence of domain authentication (no SPF policy, no DMARC, and broken/missing DKIM)
    is_completely_unauthenticated = (
        headers_res.spf_result in ["none", "neutral"]
        and headers_res.dmarc_result in ["none", "neutral"]
        and (headers_res.dkim_result in ["none", "fail"] or not headers_res.dkim_signature_present)
    )
    if is_completely_unauthenticated:
        cat1_signals.append(ScoreSignal(
            signal="Unauthenticated Sender Identity",
            weight=10,
            contribution=10,
            reason="Sending domain publishes neither SPF authorization nor DMARC policy, allowing unverified sender identity.",
            sourceModule="header",
        ))

    # Normalize Cat 1 to max 20
    cat1_total = min(20, sum(s.contribution for s in cat1_signals))
    signals.extend(cat1_signals)

    # ==========================================
    # CATEGORY 2: Header & Sender Integrity (Max 15 pts)
    # ==========================================
    cat2_signals = []
    
    for anomaly in headers_res.anomalies:
        if "Reply-To" in anomaly:
            cat2_signals.append(ScoreSignal(
                signal="Mismatched Reply-To Identifier",
                weight=8,
                contribution=8,
                reason=anomaly,
                sourceModule="header",
            ))
        elif "return-path" in anomaly.lower():
            cat2_signals.append(ScoreSignal(
                signal="Return-Path Envelope Spoofing",
                weight=7,
                contribution=7,
                reason=anomaly,
                sourceModule="header",
            ))
        elif "forged or untrusted authentication-results" in anomaly.lower() or "forged authentication-results" in anomaly.lower():
            cat2_signals.append(ScoreSignal(
                signal="Forged Authentication-Results Header Injected",
                weight=10,
                contribution=10,
                reason=anomaly,
                sourceModule="header",
            ))
        elif "alignment mismatch" in anomaly.lower():
            cat2_signals.append(ScoreSignal(
                signal="Authentication Domain Alignment Mismatch",
                weight=8,
                contribution=8,
                reason=anomaly,
                sourceModule="header",
            ))
        elif "relay latency" in anomaly.lower():
            cat2_signals.append(ScoreSignal(
                signal="Abnormal Relay Transit Delay",
                weight=5,
                contribution=4,
                reason=anomaly,
                sourceModule="header",
            ))
    upstream_spam_anomalies = [a for a in headers_res.anomalies if "upstream mail" in a.lower() or "[spam]" in a.lower() or "spam score" in a.lower()]
    if upstream_spam_anomalies:
        summary_reason = "; ".join(upstream_spam_anomalies[:2])
        cat2_signals.append(ScoreSignal(
            signal="Upstream Gateway Spam Tag Detected",
            weight=10,
            contribution=10,
            reason=f"MTA security filters stamped message as SPAM: {summary_reason}",
            sourceModule="header",
        ))

    cat2_total = min(15, sum(s.contribution for s in cat2_signals))
    signals.extend(cat2_signals)

    # ==========================================
    # CATEGORY 3: Domain & Origin Infrastructure (Max 25 pts)
    # ==========================================
    cat3_signals = []

    # Domain Age
    if domain_res.domain_age_days is not None:
        if domain_res.domain_age_days < 7:
            cat3_signals.append(ScoreSignal(
                signal="Newly Registered Sending Domain (< 7 Days)",
                weight=15,
                contribution=15,
                reason=f"Domain registered {domain_res.domain_age_days} days ago ({domain_res.registered_on}) via {domain_res.registrar}.",
                sourceModule="domain",
            ))
        elif domain_res.domain_age_days < 30:
            cat3_signals.append(ScoreSignal(
                signal="Recent Domain Registration (< 30 Days)",
                weight=15,
                contribution=8,
                reason=f"Domain registered {domain_res.domain_age_days} days ago ({domain_res.registered_on}).",
                sourceModule="domain",
            ))

    # MX DNS Validity
    if not domain_res.mx_valid:
        cat3_signals.append(ScoreSignal(
            signal="Missing / Invalid Domain MX Records",
            weight=5,
            contribution=5,
            reason="Sending domain does not publish valid mail exchange (MX) DNS routing records.",
            sourceModule="domain",
        ))

    # Known high-abuse TLD reputation
    ABUSE_TLDS = (".bid", ".win", ".top", ".click", ".loan", ".work", ".date", ".racing", ".download", ".party", ".review", ".stream", ".trade", ".accountant", ".cricket", ".science", ".faith", ".zip", ".mov")
    if domain_res and domain_res.domain and domain_res.domain.endswith(ABUSE_TLDS):
        cat3_signals.append(ScoreSignal(
            signal="High-Abuse Domain TLD Reputation",
            weight=10,
            contribution=10,
            reason=f"Sending domain uses high-abuse gTLD ('.{domain_res.domain.split('.')[-1]}') commonly associated with bulk spam.",
            sourceModule="domain",
        ))

    # Origin IP Anonymization / VPN / Tor
    if ip_rep_res.is_vpn_tor or (ip_rep_res.abuse_score and ip_rep_res.abuse_score >= 50):
        cat3_signals.append(ScoreSignal(
            signal="Anonymized Originating Node (VPN / Tor / Bulletproof)",
            weight=5,
            contribution=5,
            reason=f"Origin IP {ip_rep_res.ip} flagged on {ip_rep_res.flag_source} (Abuse Score: {ip_rep_res.abuse_score}%).",
            sourceModule="origin",
        ))

    cat3_total = min(25, sum(s.contribution for s in cat3_signals))
    signals.extend(cat3_signals)

    # ==========================================
    # CATEGORY 4: NLP Sentiment & Social Engineering (Max 20 pts)
    # ==========================================
    cat4_signals = []

    # ML Classifier Contribution (0-10 pts)
    # Multi-Signal Co-Occurrence Gate: If sender is fully authenticated (SPF pass, DKIM pass, DMARC pass),
    # with 0 header anomalies and 0 flagged URLs, passive statistical text vocabulary requires
    # co-occurrence with either explicit coercive urgency phrases or BEC indicators to contribute penalty points.
    is_fully_authenticated = (
        headers_res.spf_result == "pass"
        and headers_res.dkim_result == "pass"
        and headers_res.dmarc_result == "pass"
        and len(headers_res.anomalies) == 0
        and not any(u.get("is_flagged") for u in url_results)
    )

    if content_res.classification in ["phishing", "bec"]:
        if is_fully_authenticated and not content_res.flagged_phrases and not content_res.bec_indicators:
            pass
        else:
            scale_max = 18 if content_res.classification_confidence >= 0.90 else 14
            ml_contrib = int(content_res.classification_confidence * scale_max)
            cat4_signals.append(ScoreSignal(
                signal="NLP Phishing / BEC Classifier Confidence",
                weight=18,
                contribution=ml_contrib,
                reason=f"Statistical NLP model evaluated text with {int(content_res.classification_confidence*100)}% {content_res.classification.upper()} probability.",
                sourceModule="nlp",
            ))
    elif content_res.classification == "suspicious":
        if not is_fully_authenticated:
            cat4_signals.append(ScoreSignal(
                signal="Suspicious Content Classification",
                weight=6,
                contribution=5,
                reason="Content analysis identified high-pressure marketing lure, unsolicited bulk spam, or social engineering pretexts.",
                sourceModule="nlp",
            ))

    # Urgency Phrases
    if content_res.flagged_phrases:
        phrases_str = ", ".join([f'"{p}"' for p in content_res.flagged_phrases[:3]])
        cat4_signals.append(ScoreSignal(
            signal="Psychological Coercion & Urgency Cues",
            weight=5,
            contribution=5,
            reason=f"Extracted coercive urgency indicators: {phrases_str}.",
            sourceModule="nlp",
        ))

    # BEC Indicators
    if content_res.bec_indicators:
        bec_count = len(content_res.bec_indicators)
        bec_contrib = min(15, 6 + bec_count * 3)
        bec_str = ", ".join(content_res.bec_indicators[:3])
        cat4_signals.append(ScoreSignal(
            signal="Business Email Compromise (BEC) Financial Pretext",
            weight=15,
            contribution=bec_contrib,
            reason=f"Detected payment diversion / executive wire transfer markers ({bec_count} indicators): {bec_str}.",
            sourceModule="nlp",
        ))

    cat4_total = min(20, sum(s.contribution for s in cat4_signals))
    signals.extend(cat4_signals)

    # ==========================================
    # CATEGORY 5: URL & Payload De-obfuscation (Max 10 pts)
    # ==========================================
    cat5_signals = []
    
    flagged_urls = [u for u in url_results if u.get("is_flagged")]
    if flagged_urls:
        first_url = flagged_urls[0]
        cat5_signals.append(ScoreSignal(
            signal="Lookalike / Homoglyph Embedded URL",
            weight=10,
            contribution=10,
            reason=f"Embedded link '{first_url['original']}' resolves to suspicious typosquat: {first_url.get('reason')}.",
            sourceModule="nlp",
        ))
        if any(u.get("redirect_hops", 0) > 1 for u in flagged_urls):
            cat5_signals.append(ScoreSignal(
                signal="Multi-Hop Obfuscated Redirect Chain",
                weight=5,
                contribution=5,
                reason="URL traverses multiple intermediary redirect hops to evade perimeter filters.",
                sourceModule="nlp",
            ))

    cat5_total = min(10, sum(s.contribution for s in cat5_signals))
    signals.extend(cat5_signals)

    # ==========================================
    # CATEGORY 6: Attachment Risk (Max 10 pts)
    # ==========================================
    cat6_signals = []
    if attachment_results:
        for att in attachment_results:
            is_flagged = getattr(att, "is_flagged", False) if not isinstance(att, dict) else att.get("is_flagged", False)
            flag_reason = getattr(att, "flag_reason", None) if not isinstance(att, dict) else att.get("flag_reason")
            filename = getattr(att, "filename", "attachment") if not isinstance(att, dict) else att.get("filename", "attachment")

            if is_flagged and flag_reason:
                if "known malicious" in flag_reason.lower():
                    contrib = 10
                    sig_name = "Known Malicious Attachment Signature"
                elif "double extension" in flag_reason.lower() or "camouflage" in flag_reason.lower() or "spoofing" in flag_reason.lower():
                    contrib = 8
                    sig_name = "Deceptive / Disguised Executable Attachment"
                elif "macro-enabled" in flag_reason.lower():
                    contrib = 6
                    sig_name = "Macro-Enabled Document Payload"
                elif "executable" in flag_reason.lower():
                    contrib = 8
                    sig_name = "High-Risk Executable File Attachment"
                else:
                    contrib = 5
                    sig_name = "Suspicious Attachment Finding"

                cat6_signals.append(ScoreSignal(
                    signal=sig_name,
                    weight=10,
                    contribution=contrib,
                    reason=f"Attachment '{filename}': {flag_reason}.",
                    sourceModule="attachment",
                ))

    cat6_total = min(10, sum(s.contribution for s in cat6_signals))
    signals.extend(cat6_signals)

    # ==========================================
    # PHASE 4 EXTENSION HOOKS (Optional)
    # ==========================================
    if correlation_data and correlation_data.get("campaign_id"):
        signals.append(ScoreSignal(
            signal="Correlated Campaign Cluster Infrastructure",
            weight=15,
            contribution=12,
            reason=f"Linked to active threat campaign cluster {correlation_data['campaign_id']}.",
            sourceModule="correlation",
        ))

    if threat_intel_matches:
        signals.append(ScoreSignal(
            signal="Threat Intelligence Blocklist Hit",
            weight=10,
            contribution=10,
            reason=f"Matched {len(threat_intel_matches)} active threat-intel blocklist records.",
            sourceModule="threat_intel",
        ))

    # ==========================================
    # FINAL SCORE AGGREGATION & BOUNDING
    # ==========================================
    # Sum of normalized categories (strictly guaranteed <= 100)
    raw_total_score = cat1_total + cat2_total + cat3_total + cat4_total + cat5_total + cat6_total
    fraud_score = min(100, max(0, raw_total_score))

    # Deduce Risk Category
    if content_res.bec_indicators or content_res.classification == "bec":
        risk_category = "bec"
    elif fraud_score >= 60 or (content_res.classification == "phishing" and not is_fully_authenticated and (fraud_score >= 35 or (content_res.classification_confidence >= 0.85 and fraud_score >= 25))):
        risk_category = "phishing"
    elif fraud_score >= 35 or (content_res.classification == "phishing" and not is_fully_authenticated) or (content_res.classification == "suspicious" and fraud_score >= 20):
        risk_category = "suspicious"
    else:
        risk_category = "legitimate"

    # Deduce Confidence
    if fraud_score >= 75 or fraud_score <= 25:
        confidence = "high"
    elif fraud_score >= 55 or fraud_score <= 35:
        confidence = "medium"
    else:
        confidence = "low"

    # Generate Explainable Verdict Summary
    reasons = []
    if headers_res.dmarc_result == "fail":
        reasons.append("failed DMARC alignment")
    if is_completely_unauthenticated:
        reasons.append("unauthenticated sender (no SPF/DMARC)")
    if any("Return-Path" in a for a in headers_res.anomalies):
        reasons.append("Return-Path envelope spoofing")
    if domain_res.domain_age_days is not None and domain_res.domain_age_days < 7:
        reasons.append(f"{domain_res.domain_age_days}-day-old domain registration")
    if flagged_urls:
        reasons.append("deceptive lookalike URLs")
    if any(getattr(a, "is_flagged", False) if not isinstance(a, dict) else a.get("is_flagged", False) for a in (attachment_results or [])):
        reasons.append("suspicious attachment payload")
    if content_res.bec_indicators:
        reasons.append("financial payment diversion language")
    elif content_res.flagged_phrases:
        reasons.append("coercive psychological urgency")
    elif content_res.classification == "phishing" and content_res.classification_confidence >= 0.75:
        reasons.append(f"high-confidence phishing content ({int(content_res.classification_confidence*100)}%)")
    if ip_rep_res.is_vpn_tor:
        reasons.append("anonymized VPN/Tor origin node")

    if reasons:
        verdict_summary = f"Likely {risk_category.upper()} — {', '.join(reasons)}."
    else:
        if risk_category == "legitimate":
            if is_fully_authenticated:
                verdict_summary = "Verified legitimate — valid SPF/DKIM/DMARC authentication, established domain, and standard conversational tone."
            else:
                verdict_summary = "Low risk — unauthenticated sender but benign content."
        else:
            verdict_summary = "Anomalous email — suspicious indicators detected across headers and content."

    return CompositeScoringResult(
        fraud_score=fraud_score,
        risk_category=risk_category,
        confidence=confidence,
        verdict_summary=verdict_summary,
        score_breakdown=signals,
    )
