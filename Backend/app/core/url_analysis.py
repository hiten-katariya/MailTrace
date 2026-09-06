import re
import asyncio
from typing import List, Dict, Any, Optional
import httpx
import tldextract

# Configurable reference list of high-value target brands
KNOWN_BRANDS = [
    "paypal",
    "microsoft",
    "office365",
    "outlook",
    "apple",
    "icloud",
    "google",
    "amazon",
    "okta",
    "workday",
    "docusign",
    "chase",
    "bankofamerica",
    "wellsfargo",
    "quickbooks",
    "intuit",
    "adobe",
    "dropbox",
    "slack",
]

# Legitimate corporate shorteners that should not be flagged as deceptive lookalikes or unknown shorteners
KNOWN_CORPORATE_SHORTENERS: Dict[str, str] = {
    "c.gle": "Google Official Shortener",
    "goo.gl": "Google Official Shortener",
    "g.co": "Google Official Shortener",
    "amzn.to": "Amazon Official Shortener",
    "msft.it": "Microsoft Official Shortener",
    "t.co": "X / Twitter Official Shortener",
    "youtu.be": "YouTube Official Shortener",
    "lnkd.in": "LinkedIn Official Shortener",
    "apple.co": "Apple Official Shortener",
    "fb.me": "Meta / Facebook Official Shortener",
    "bit.ly": "Bitly Shortener",
}

# Dedicated Brand Top-Level Domains (ICANN gTLDs owned by major brands)
BRAND_TLDS = {"google", "apple", "amazon", "microsoft"}

# Common homoglyph substitutions: 0 -> o, 1 -> l/i, vv -> w, rn -> m
HOMOGLYPH_MAP = {
    '0': 'o',
    '1': 'l',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '@': 'a',
    '$': 's',
}

def normalize_homoglyphs(text: str) -> str:
    text_lower = text.lower()
    text_normalized = text_lower.replace("rn", "m").replace("vv", "w")
    for char, replacement in HOMOGLYPH_MAP.items():
        text_normalized = text_normalized.replace(char, replacement)
    return text_normalized

def calculate_levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return calculate_levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def is_lookalike_domain(domain: str) -> tuple[bool, Optional[str]]:
    if not domain:
        return False, None

    clean_domain = domain.lower().strip()
    if clean_domain in KNOWN_CORPORATE_SHORTENERS:
        return False, None

    ext = tldextract.extract(domain)
    registered_domain = ext.domain.lower()

    # If domain suffix is a recognized brand TLD (e.g., play.google -> suffix="google")
    if ext.suffix and ext.suffix.lower() in BRAND_TLDS:
        return False, None

    # Known high-abuse spam/malware TLDs
    ABUSE_TLDS = (".bid", ".win", ".top", ".click", ".loan", ".work", ".date", ".racing", ".download", ".party", ".review", ".stream", ".trade", ".accountant", ".cricket", ".science", ".faith", ".zip", ".mov")
    if ext.suffix and f".{ext.suffix.lower()}" in ABUSE_TLDS:
        return True, f"High-abuse spam/malware TLD ('.{ext.suffix.lower()}')"

    # Disposable/obfuscated redirection domain patterns on cheap or personal TLDs (e.g. .me, .xyz, .top, .tk)
    DISPOSABLE_TLDS = (".me", ".xyz", ".top", ".club", ".tk", ".ml", ".ga", ".cf", ".live", ".guru", ".space")
    if ext.suffix and f".{ext.suffix.lower()}" in DISPOSABLE_TLDS:
        if len(registered_domain) > 15 and any(c.isdigit() for c in registered_domain):
            return True, f"High-risk obfuscated/disposable domain pattern on '.{ext.suffix.lower()}'"

    # Check if domain uses raw IP
    if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain):
        return True, "IP address used as host in URL"

    normalized = normalize_homoglyphs(registered_domain)

    for brand in KNOWN_BRANDS:
        # Exact legitimate brand domain match is not a lookalike
        if registered_domain == brand or clean_domain == f"{brand}.com":
            return False, None

        # Lookalike variant: normalized matches brand exactly (e.g. paypa1 -> paypal)
        if normalized == brand:
            return True, f"Homoglyph typosquatting of '{brand}' (e.g. {domain})"

        # Brand embedded inside a deceptive domain (e.g. microsoft-verify-auth.com, login-paypal.com, paypa1-security.com)
        if brand in normalized or brand in registered_domain:
            return True, f"Deceptive brand impersonation containing '{brand}'"

        # Edit distance of 1 (e.g. micorsoft, paypall, aple)
        if abs(len(registered_domain) - len(brand)) <= 2:
            dist = calculate_levenshtein_distance(registered_domain, brand)
            if dist == 1 or (dist == 2 and len(brand) >= 7):
                return True, f"Typosquatting variant of '{brand}' (edit distance={dist})"

    return False, None

async def resolve_url_safely(url: str, timeout_seconds: float = 2.0) -> Dict[str, Any]:
    ext = tldextract.extract(url)
    domain_name = f"{ext.domain}.{ext.suffix}" if ext.suffix else ext.domain

    if domain_name.lower() in KNOWN_CORPORATE_SHORTENERS:
        is_flagged = False
        reason = f"Verified corporate shortener ({KNOWN_CORPORATE_SHORTENERS[domain_name.lower()]})"
    else:
        is_flagged, reason = is_lookalike_domain(domain_name)
    resolved_url = url
    hops = 0
    status_code = None

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=timeout_seconds,
            headers={"User-Agent": "MailTrace-Security-Scanner/2.0"},
            verify=False  # Do not fail on self-signed certs in forensic sandboxing
        ) as client:
            resp = await client.head(url)
            resolved_url = str(resp.url)
            hops = len(resp.history)
            status_code = resp.status_code

            # Check resolved final destination
            res_ext = tldextract.extract(resolved_url)
            res_domain = f"{res_ext.domain}.{res_ext.suffix}" if res_ext.suffix else res_ext.domain
            if not is_flagged:
                is_flagged, reason = is_lookalike_domain(res_domain)
                if is_flagged:
                    reason = f"Redirected to: {reason}"

    except Exception as e:
        # Graceful sandbox timeout / unreachable handling
        resolved_url = url

    return {
        "original": url,
        "resolved": resolved_url,
        "domain": domain_name,
        "is_flagged": is_flagged,
        "reason": reason or ("Verified standard link" if not is_flagged else "Flagged domain"),
        "redirect_hops": hops,
        "status_code": status_code,
    }

async def analyze_urls(urls: List[str]) -> List[Dict[str, Any]]:
    if not urls:
        return []

    # Deduplicate and limit to first 15 URLs to prevent DOS attacks
    unique_urls = list(dict.fromkeys(urls))[:15]
    tasks = [resolve_url_safely(url) for url in unique_urls]
    results = await asyncio.gather(*tasks, return_exceptions=False)
    return results
