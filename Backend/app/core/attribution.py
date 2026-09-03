from typing import List, Optional, Tuple

def determine_attribution(
    spf_result: Optional[str],
    dkim_result: Optional[str],
    dmarc_result: Optional[str],
    domain_age_days: Optional[int],
    is_vpn_tor: bool,
    anomalies: List[str],
    fraud_score: int,
    risk_category: str,
    bec_indicators: List[str],
) -> Tuple[str, str, str]:
    """
    Classify the likely origin/attack vector category into one of 4 standardized classes:
    1. 'anonymized_infrastructure'
    2. 'spoofed_domain'
    3. 'compromised_account'
    4. 'unattributed'

    Returns:
        Tuple of (attribution_type, attribution_confidence, attribution_reason)
    """
    spf_clean = (spf_result or "none").lower()
    dkim_clean = (dkim_result or "none").lower()
    dmarc_clean = (dmarc_result or "none").lower()
    anomalies_str = " ".join(anomalies).lower() if anomalies else ""

    # 1. Anonymized Infrastructure (VPN / Tor / Bulletproof Node)
    if is_vpn_tor:
        return (
            "anonymized_infrastructure",
            "high",
            "Originating sending relay is confirmed as an anonymized VPN node, Tor exit router, or bulletproof proxy network."
        )

    # 2. Spoofed Domain (Protocol authentication failed with sender mismatch)
    has_auth_failure = dmarc_clean == "fail" or spf_clean == "fail"
    has_identity_mismatch = "mismatch" in anomalies_str or "unaligned" in anomalies_str or "spoof" in anomalies_str
    if has_auth_failure and has_identity_mismatch:
        conf = "high" if dmarc_clean == "fail" else "medium"
        return (
            "spoofed_domain",
            conf,
            "Header identity forged; sending server is not authorized by the legitimate domain's SPF/DMARC policy."
        )

    # 3. Compromised Account (Account Takeover / ATO)
    # Valid or neutral authentication from established domain (> 180 days) containing verified hostile content
    is_auth_pass = spf_clean in ["pass", "neutral"] and dkim_clean in ["pass", "neutral"]
    is_established_domain = domain_age_days is not None and domain_age_days > 180
    is_malicious_content = risk_category in ["phishing", "bec"] or len(bec_indicators) > 0 or fraud_score >= 50

    if is_auth_pass and is_established_domain and is_malicious_content:
        conf = "high" if len(bec_indicators) > 0 or fraud_score >= 70 else "medium"
        return (
            "compromised_account",
            conf,
            "Legitimate enterprise infrastructure and domain authenticated properly, but message payload contains malicious deception/BEC signals indicative of an Account Takeover (ATO)."
        )

    # 4. Fallback: Unattributed
    return (
        "unattributed",
        "low",
        "Insufficient or non-convergent infrastructure telemetry to attribute a specific attack vector."
    )
