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
    # Phase 4 extension hooks
    correlation_data: Optional[Dict[str, Any]] = None,
    threat_intel_matches: Optional[List[Dict[str, Any]]] = None,
) -> CompositeScoringResult:
    signals: List[ScoreSignal] = []

    # ==========================================
    # CATEGORY 1: Protocol Authentication (Max 25 pts)
    # ==========================================
    cat1_signals = []
    
    # DMARC
    if headers_res.dmarc_result == "fail":
        cat1_signals.append(ScoreSignal(
            signal="DMARC Policy Failure",
            weight=15,
            contribution=15,
            reason="MTA disposition rejected/quarantined transmission due to unaligned sender domain policy.",
            sourceModule="header",
        ))
    
    # SPF
    if headers_res.spf_result == "fail":
        cat1_signals.append(ScoreSignal(
            signal="SPF Validation Failure",
            weight=5,
            contribution=5,
            reason="Sending MTA IP is not authorized in published DNS SPF TXT record.",
            sourceModule="header",
        ))
    elif headers_res.spf_result == "softfail":
        cat1_signals.append(ScoreSignal(
            signal="SPF Softfail Anomaly",
            weight=5,
            contribution=3,
            reason="Sending MTA IP produced ~all softfail policy match.",
            sourceModule="header",
        ))

    # DKIM
    if headers_res.dkim_result == "fail" or (not headers_res.dkim_signature_present and headers_res.dmarc_result == "fail"):
        cat1_signals.append(ScoreSignal(
            signal="DKIM Cryptographic Signature Failure",
            weight=5,
            contribution=5,
            reason="Cryptographic DKIM public key signature missing or failed RSA validation.",
            sourceModule="header",
        ))

    # Normalize Cat 1 to max 25
    cat1_total = min(25, sum(s.contribution for s in cat1_signals))
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
        elif "Return-Path" in anomaly:
            cat2_signals.append(ScoreSignal(
                signal="Return-Path Envelope Spoofing",
                weight=7,
                contribution=7,
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
    if content_res.classification in ["phishing", "bec"]:
        ml_contrib = int(content_res.classification_confidence * 10)
        cat4_signals.append(ScoreSignal(
            signal="NLP Phishing Classifier Confidence",
            weight=10,
            contribution=ml_contrib,
            reason=f"DistilBERT/TF-IDF statistical model evaluated text with {int(content_res.classification_confidence*100)}% phishing probability.",
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
        bec_str = ", ".join(content_res.bec_indicators[:2])
        cat4_signals.append(ScoreSignal(
            signal="Business Email Compromise (BEC) Financial Pretext",
            weight=5,
            contribution=5,
            reason=f"Detected payment diversion / executive impersonation markers: {bec_str}.",
            sourceModule="nlp",
        ))

    cat4_total = min(20, sum(s.contribution for s in cat4_signals))
    signals.extend(cat4_signals)

    # ==========================================
    # CATEGORY 5: URL & Payload De-obfuscation (Max 15 pts)
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

    cat5_total = min(15, sum(s.contribution for s in cat5_signals))
    signals.extend(cat5_signals)

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
    raw_total_score = cat1_total + cat2_total + cat3_total + cat4_total + cat5_total
    fraud_score = min(100, max(0, raw_total_score))

    # Deduce Risk Category
    if content_res.bec_indicators and (fraud_score >= 50 or "wire" in str(content_res.bec_indicators).lower()):
        risk_category = "bec"
    elif fraud_score >= 70:
        risk_category = "phishing"
    elif fraud_score >= 40:
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
    if domain_res.domain_age_days is not None and domain_res.domain_age_days < 7:
        reasons.append(f"{domain_res.domain_age_days}-day-old domain registration")
    if flagged_urls:
        reasons.append("deceptive lookalike URLs")
    if content_res.bec_indicators:
        reasons.append("financial payment diversion language")
    elif content_res.flagged_phrases:
        reasons.append("coercive psychological urgency")
    if ip_rep_res.is_vpn_tor:
        reasons.append("anonymized VPN/Tor origin node")

    if reasons:
        verdict_summary = f"Likely {risk_category.upper()} — {', '.join(reasons)}."
    else:
        if risk_category == "legitimate":
            verdict_summary = "Verified legitimate — valid SPF/DKIM/DMARC authentication, established domain, and standard conversational tone."
        else:
            verdict_summary = "Anomalous email — suspicious indicators detected across headers and content."

    return CompositeScoringResult(
        fraud_score=fraud_score,
        risk_category=risk_category,
        confidence=confidence,
        verdict_summary=verdict_summary,
        score_breakdown=signals,
    )
