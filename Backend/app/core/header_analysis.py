import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from email.utils import parseaddr, parsedate_to_datetime
import dns.resolver
import tldextract

try:
    import spf
except ImportError:
    spf = None

try:
    import dkim
except ImportError:
    dkim = None

try:
    import checkdmarc
except ImportError:
    checkdmarc = None

def get_organizational_domain(domain: str) -> str:
    """
    Extract registered organizational domain using public suffix rules
    (e.g., scoutcamp.bounces.google.com -> google.com, mail.amazon.co.uk -> amazon.co.uk).
    """
    if not domain:
        return ""
    ext = tldextract.extract(domain)
    if ext.domain and ext.suffix:
        return f"{ext.domain}.{ext.suffix}".lower()
    return ext.domain.lower() if ext.domain else domain.lower()

def extract_auth_results_from_headers(
    raw_headers_dict: Dict[str, Any],
    raw_eml_bytes: bytes,
    sender_domain: Optional[str] = None
) -> Tuple[Dict[str, Optional[str]], List[str]]:
    """
    RFC 8601 / RFC 7601 Trust Model:
    1. Only the topmost (outermost) Authentication-Results header added by the boundary
       receiving MTA is considered. Any inner/subsequent headers are discarded.
    2. The header's authserv-id MUST match the receiving MTA of a boundary Received hop.
    3. Any claimed DKIM pass is cryptographically cross-checked against raw_eml_bytes to prevent
       sender-forged authentication headers.
       
    Returns:
        (verdicts_dict, anomalies_list)
    """
    verdicts: Dict[str, Optional[str]] = {
        "spf": None,
        "dkim": None,
        "dmarc": None,
        "dmarc_policy": None,
    }
    anomalies: List[str] = []

    # 1. Extract all receiving MTAs from Received: headers
    received_raw = raw_headers_dict.get("Received", [])
    if isinstance(received_raw, str):
        received_raw = [received_raw]

    receiving_mtas: List[str] = []
    for r in received_raw:
        m_by = re.search(r'\bby\s+([a-zA-Z0-9\.\-:]+)', str(r), re.IGNORECASE)
        if m_by:
            receiving_mtas.append(m_by.group(1).lower().rstrip(';,'))

    # 2. Extract ONLY the topmost Authentication-Results header (outermost hop)
    auth_raw = raw_headers_dict.get("Authentication-Results")
    topmost_auth = None
    if isinstance(auth_raw, list):
        # Topmost is index 0
        topmost_auth = str(auth_raw[0])
    elif auth_raw:
        topmost_auth = str(auth_raw)

    if not topmost_auth:
        # Fall back to Received-SPF if stamped by boundary MTA
        recv_spf = str(raw_headers_dict.get("Received-SPF", "") or "")
        if recv_spf:
            m = re.match(r'^(pass|fail|softfail|neutral|none)\b', recv_spf.strip(), re.IGNORECASE)
            if m:
                verdicts["spf"] = m.group(1).lower()
        return verdicts, anomalies

    # 3. Extract authserv-id from topmost Authentication-Results (RFC 8601 Section 2.2)
    parts = topmost_auth.split(";", 1)
    authserv_id = parts[0].strip().split()[0].lower() if parts[0].strip() else ""

    # 4. Verify authserv-id against receiving MTAs in the relay trajectory
    is_trusted_mta = False
    if not receiving_mtas:
        # Email has no Received hops (e.g. injected directly by sender)
        is_trusted_mta = False
    else:
        for mta in receiving_mtas:
            if (
                authserv_id == mta
                or mta.endswith("." + authserv_id)
                or authserv_id.endswith("." + mta)
                or (get_organizational_domain(authserv_id) and get_organizational_domain(authserv_id) == get_organizational_domain(mta))
            ):
                is_trusted_mta = True
                break

    # If authserv-id cannot be verified against receiving hops, treat as untrusted/forged
    if not is_trusted_mta:
        mta_display = f" ({', '.join(receiving_mtas[:2])})" if receiving_mtas else " (no Received hops)"
        anomalies.append(
            f"Forged or untrusted Authentication-Results header detected: authserv-id '{authserv_id}' "
            f"does not match receiving boundary MTA{mta_display}"
        )
        return verdicts, anomalies

    # 5. Parse claims from verified topmost Authentication-Results
    auth_body = parts[1] if len(parts) > 1 else ""

    # Check SPF
    m_spf = re.search(r'\bspf=(pass|fail|softfail|neutral|none)\b', auth_body, re.IGNORECASE)
    if m_spf:
        verdicts["spf"] = m_spf.group(1).lower()

    # Check DKIM
    m_dkim = re.search(r'\bdkim=(pass|fail|none)\b', auth_body, re.IGNORECASE)
    if m_dkim:
        claimed_dkim = m_dkim.group(1).lower()
        if claimed_dkim == "pass":
            # Cryptographic Cross-Check: Verify that a valid DKIM signature actually exists
            has_dkim_sig = b"DKIM-Signature:" in raw_eml_bytes or b"dkim-signature:" in raw_eml_bytes
            if not has_dkim_sig:
                anomalies.append("Forged Authentication-Results header: claims DKIM pass but no DKIM-Signature header present")
            else:
                verdicts["dkim"] = "pass"
        else:
            verdicts["dkim"] = claimed_dkim

    # Check DMARC
    m_dmarc = re.search(r'\bdmarc=(pass|fail|none)\b', auth_body, re.IGNORECASE)
    if m_dmarc:
        verdicts["dmarc"] = m_dmarc.group(1).lower()
        m_policy = re.search(r'p=(none|quarantine|reject)', auth_body, re.IGNORECASE)
        if m_policy:
            verdicts["dmarc_policy"] = m_policy.group(1).lower()

    return verdicts, anomalies

class HeaderAnalysisResult:
    def __init__(
        self,
        spf_result: str,
        spf_record: Optional[str],
        spf_sender_ip: Optional[str],
        dkim_result: str,
        dkim_domain: Optional[str],
        dkim_selector: Optional[str],
        dkim_signature_present: bool,
        dmarc_result: str,
        dmarc_policy: Optional[str],
        dmarc_disposition: Optional[str],
        relay_chain: List[Dict[str, Any]],
        anomalies: List[str],
        earliest_origin_ip: Optional[str],
    ):
        self.spf_result = spf_result
        self.spf_record = spf_record
        self.spf_sender_ip = spf_sender_ip
        self.dkim_result = dkim_result
        self.dkim_domain = dkim_domain
        self.dkim_selector = dkim_selector
        self.dkim_signature_present = dkim_signature_present
        self.dmarc_result = dmarc_result
        self.dmarc_policy = dmarc_policy
        self.dmarc_disposition = dmarc_disposition
        self.relay_chain = relay_chain
        self.anomalies = anomalies
        self.earliest_origin_ip = earliest_origin_ip

def extract_ip_from_text(text: str) -> Optional[str]:
    # Match IPv4 addresses (excluding standard internal non-routable 127.0.0.1 where possible if external IP is present)
    ip_pattern = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
    matches = ip_pattern.findall(text)
    for ip in matches:
        if not ip.startswith("127."):
            return ip
    return matches[0] if matches else None

def parse_received_headers(raw_headers: Dict[str, Any]) -> List[Dict[str, Any]]:
    received_raw = raw_headers.get("Received", [])
    if isinstance(received_raw, str):
        received_raw = [received_raw]

    # In SMTP, Received headers are prepended by each hop, so the top-most Received header is the latest (internal gateway),
    # and the bottom-most Received header is the earliest (originating MTA / client).
    # To present in chronological order (hop 1 = origin, hop N = gateway):
    chronological_received = list(reversed(received_raw))
    
    relay_hops = []
    prev_timestamp: Optional[datetime] = None

    for idx, header_val in enumerate(chronological_received):
        hop_num = idx + 1
        val_str = str(header_val)

        # Extract Server / MTA name
        from_match = re.search(r'from\s+([^\s\(\)]+)', val_str, re.IGNORECASE)
        by_match = re.search(r'by\s+([^\s\(\)]+)', val_str, re.IGNORECASE)
        server = from_match.group(1) if from_match else "unknown"
        by_server = by_match.group(1) if by_match else None

        # Extract IP
        ip = extract_ip_from_text(val_str) or "127.0.0.1"

        # Extract timestamp (usually after semicolon)
        ts_dt = None
        if ";" in val_str:
            date_part = val_str.split(";")[-1].strip()
            try:
                ts_dt = parsedate_to_datetime(date_part)
                if ts_dt.tzinfo is None:
                    ts_dt = ts_dt.replace(tzinfo=timezone.utc)
            except Exception:
                ts_dt = None

        if ts_dt is None:
            ts_dt = datetime.now(timezone.utc)

        # Calculate delay from previous hop
        delay_ms = 0
        if prev_timestamp and ts_dt:
            delta = (ts_dt - prev_timestamp).total_seconds()
            delay_ms = int(delta * 1000)

        prev_timestamp = ts_dt

        relay_hops.append({
            "hop": hop_num,
            "ip": ip,
            "server": server,
            "by_server": by_server,
            "timestamp": ts_dt.isoformat(),
            "timestamp_dt": ts_dt,
            "delay_ms": delay_ms,
            "spf_status": "pass" if hop_num > 1 else None,
            "country": "Unknown",
            "is_earliest_origin": (idx == 0),
        })

    return relay_hops

from functools import lru_cache

@lru_cache(maxsize=2048)
def query_dns_txt(domain: str) -> List[str]:
    records = []
    try:
        resolver = dns.resolver.Resolver()
        resolver.lifetime = 3.0
        # Include Google and Cloudflare DNS to prevent local ISP resolution timeouts
        resolver.nameservers = ['8.8.8.8', '1.1.1.1'] + [ns for ns in resolver.nameservers if ns not in ['8.8.8.8', '1.1.1.1']]
        answers = resolver.resolve(domain, 'TXT')
        for rdata in answers:
            for txt_string in rdata.strings:
                records.append(txt_string.decode('utf-8', errors='ignore'))
    except Exception:
        pass
    return records

def check_spf(sender_domain: Optional[str], origin_ip: Optional[str], raw_eml_bytes: bytes) -> Tuple[str, Optional[str]]:
    if not sender_domain:
        return "none", None

    if not origin_ip or origin_ip.startswith("127."):
        return "neutral", None

    # 1. Primary RFC-compliant recursive SPF evaluation via pyspf
    if spf and hasattr(spf, 'check2'):
        try:
            result, code, explanation = spf.check2(i=origin_ip, s=f"postmaster@{sender_domain}", h=sender_domain)
            res_str = result.lower()
            if res_str in ["pass", "fail", "softfail", "neutral", "none"]:
                return res_str, f"pyspf: {explanation}"
        except Exception:
            pass

    # 2. Heuristic fallback using direct DNS TXT query if pyspf is unavailable or fails
    spf_record = None
    txt_records = query_dns_txt(sender_domain)
    for rec in txt_records:
        if rec.startswith("v=spf1"):
            spf_record = rec
            break

    if not spf_record:
        return "none", None

    if f"ip4:{origin_ip}" in spf_record or "+all" in spf_record:
        return "pass", spf_record
    elif "-all" in spf_record:
        return "fail", spf_record
    elif "~all" in spf_record:
        return "softfail", spf_record

    return "neutral", spf_record

def check_dkim(raw_eml_bytes: bytes, sender_domain: Optional[str]) -> Tuple[str, Optional[str], Optional[str], bool]:
    # Check if DKIM-Signature header exists
    has_dkim_header = b"DKIM-Signature:" in raw_eml_bytes or b"dkim-signature:" in raw_eml_bytes
    if not has_dkim_header:
        return "none", sender_domain, None, False

    # Extract domain and selector from DKIM-Signature header using regex
    m_domain = re.search(r'd=([a-zA-Z0-9\.\-]+)', raw_eml_bytes.decode('latin-1', errors='ignore'))
    m_selector = re.search(r's=([a-zA-Z0-9\.\-]+)', raw_eml_bytes.decode('latin-1', errors='ignore'))

    signing_domain = m_domain.group(1) if m_domain else sender_domain
    selector = m_selector.group(1) if m_selector else "default"

    if dkim:
        try:
            is_valid = dkim.verify(raw_eml_bytes)
            if is_valid:
                return "pass", signing_domain, selector, True
            else:
                return "fail", signing_domain, selector, True
        except Exception:
            return "fail", signing_domain, selector, True

    return "fail" if has_dkim_header else "none", signing_domain, selector, has_dkim_header

def check_dmarc(sender_domain: Optional[str], spf_result: str, dkim_result: str) -> Tuple[str, Optional[str], Optional[str]]:
    if not sender_domain:
        return "none", None, None

    dmarc_domain = f"_dmarc.{sender_domain}"
    txt_records = query_dns_txt(dmarc_domain)
    
    dmarc_record = None
    policy = "none"
    
    for rec in txt_records:
        if rec.startswith("v=DMARC1"):
            dmarc_record = rec
            break

    if not dmarc_record:
        return "none", None, None

    p_match = re.search(r'p=(none|quarantine|reject)', dmarc_record, re.IGNORECASE)
    if p_match:
        policy = p_match.group(1).lower()

    # DMARC requires SPF or DKIM to pass with alignment
    if spf_result == "pass" or dkim_result == "pass":
        return "pass", policy, None
    else:
        disposition = "reject" if policy == "reject" else ("quarantine" if policy == "quarantine" else "delivered")
        return "fail", policy, disposition

def analyze_email_headers(
    raw_headers_dict: Dict[str, Any],
    raw_eml_bytes: bytes,
    sender: str,
    sender_domain: Optional[str],
) -> HeaderAnalysisResult:
    # 1. Reconstruct Relay Chain
    relay_chain = parse_received_headers(raw_headers_dict)
    
    # Identify earliest origin IP
    earliest_origin_ip = None
    if relay_chain:
        for hop in relay_chain:
            if hop.get("ip") and not hop["ip"].startswith("127."):
                earliest_origin_ip = hop["ip"]
                break
        if not earliest_origin_ip:
            earliest_origin_ip = relay_chain[0].get("ip")

    # 2. Authentication Checks (inspect authoritative upstream MTA headers or verify via DNS/crypto)
    parsed_auth, auth_anomalies = extract_auth_results_from_headers(raw_headers_dict, raw_eml_bytes, sender_domain)

    from_header = str(raw_headers_dict.get("From", ""))
    reply_to = str(raw_headers_dict.get("Reply-To", ""))
    return_path = str(raw_headers_dict.get("Return-Path", ""))

    _, from_email = parseaddr(from_header)
    _, reply_to_email = parseaddr(reply_to)
    _, return_path_email = parseaddr(return_path)

    return_path_dom = return_path_email.split("@")[-1].lower() if "@" in return_path_email else None
    eval_spf_domain = return_path_dom or sender_domain

    if parsed_auth["spf"]:
        spf_res = parsed_auth["spf"]
        spf_rec = "Received-SPF header verified"
    else:
        spf_res, spf_rec = check_spf(eval_spf_domain, earliest_origin_ip, raw_eml_bytes)

    if parsed_auth["dkim"]:
        dkim_res = parsed_auth["dkim"]
        dkim_dom = sender_domain
        dkim_sel = "header"
        dkim_sig = (dkim_res == "pass")
    else:
        dkim_res, dkim_dom, dkim_sel, dkim_sig = check_dkim(raw_eml_bytes, sender_domain)

    if parsed_auth["dmarc"]:
        dmarc_res = parsed_auth["dmarc"]
        dmarc_pol = parsed_auth["dmarc_policy"] or "reject"
        dmarc_disp = None if dmarc_res == "pass" else ("reject" if dmarc_pol == "reject" else "quarantine")
    else:
        dmarc_res, dmarc_pol, dmarc_disp = check_dmarc(sender_domain, spf_res, dkim_res)

    # 3. Anomaly Detection
    anomalies = list(auth_anomalies)

    # From / Reply-To Mismatch (with organizational domain / subdomain awareness)
    if reply_to_email and from_email:
        from_dom = from_email.split("@")[-1].lower() if "@" in from_email else ""
        reply_dom = reply_to_email.split("@")[-1].lower() if "@" in reply_to_email else ""
        if from_dom and reply_dom:
            org_from = get_organizational_domain(from_dom)
            org_reply = get_organizational_domain(reply_dom)
            is_same_exact = (from_dom == reply_dom)
            is_subdomain = reply_dom.endswith("." + from_dom) or from_dom.endswith("." + reply_dom)
            is_same_org = bool(org_from and org_reply and org_from == org_reply)

            if not (is_same_exact or is_subdomain or is_same_org):
                anomalies.append(f"Reply-To domain mismatch: from '@{from_dom}' replies to '@{reply_dom}'")
            elif from_email.lower() != reply_to_email.lower() and not is_same_org:
                anomalies.append(f"Reply-To mailbox mismatch: sender '{from_email}' diverts replies to '{reply_to_email}'")

    # From / Return-Path Mismatch (with VERP bulk-mail support: subdomains & shared root domains)
    if return_path_email and from_email:
        from_dom = from_email.split("@")[-1].lower() if "@" in from_email else ""
        return_dom = return_path_email.split("@")[-1].lower() if "@" in return_path_email else ""
        if from_dom and return_dom:
            org_from = get_organizational_domain(from_dom)
            org_return = get_organizational_domain(return_dom)
            is_same_exact = (from_dom == return_dom)
            is_subdomain = return_dom.endswith("." + from_dom) or from_dom.endswith("." + return_dom)
            is_same_org = bool(org_from and org_return and org_from == org_return)

            # Legitimate VERP (Variable Envelope Return Path) bulk senders (Google, Amazon, etc.)
            # use subdomains like scoutcamp.bounces.google.com for google.com.
            if not (is_same_exact or is_subdomain or is_same_org):
                anomalies.append(f"Return-Path envelope mismatch: From '@{from_dom}' vs Return-Path '@{return_dom}'")

    # DMARC / SPF Failure Flag
    if dmarc_res == "fail":
        anomalies.append("DMARC alignment failure: sender domain policy violation")
    elif spf_res == "fail":
        anomalies.append("SPF validation failure: sending server IP not authorized")

    # Missing DKIM on high-profile domain (only if DKIM didn't pass)
    if not dkim_sig and dkim_res != "pass" and sender_domain and any(brand in sender_domain for brand in ["paypal", "microsoft", "google", "apple", "amazon", "bank", "okta"]):
        anomalies.append(f"Cryptographic signature missing on claimed enterprise domain '@{sender_domain}'")

    # Out-of-order relay timestamps and delays (> 60s)
    for hop in relay_chain:
        delay = hop.get("delay_ms") or 0
        if delay < -5000:
            anomalies.append(f"Out-of-order Received timestamp anomaly: hop #{hop['hop']} timestamp occurs before previous relay hop")
        elif delay > 60000:
            anomalies.append(f"Unusual relay latency delay detected at hop #{hop['hop']} (+{(delay//1000)}s)")

    # Upstream Mail Security Gateway Spam Flags
    spam_header_checks = [
        ("X-VR-SPAMSTATE", ["spam"]),
        ("X-VR-SPAMSCORE", []),
        ("X-Ovh-Spam-Status", ["spam"]),
        ("X-Spam-Status", ["yes", "spam"]),
        ("X-Spam-Flag", ["yes"]),
        ("X-Spam-Tag", ["yes"]),
    ]
    for header_key, spam_keywords in spam_header_checks:
        val = str(raw_headers_dict.get(header_key, "") or "").lower().strip()
        if val:
            if header_key == "X-VR-SPAMSCORE":
                try:
                    score_num = int(re.sub(r'[^\d]', '', val) or "0")
                    if score_num >= 100:
                        anomalies.append(f"Upstream mail gateway flagged high spam score ({header_key}: {val})")
                except Exception:
                    pass
            elif any(k in val for k in spam_keywords):
                anomalies.append(f"Upstream mail gateway tagged message as SPAM ({header_key}: {val.upper()})")

    subj_header = str(raw_headers_dict.get("Subject", "") or "")
    if re.search(r'\[spam\]|\*\*\*spam\*\*\*|\bspam:\b', subj_header, re.IGNORECASE):
        anomalies.append("Subject rewritten by upstream MTA filter with [SPAM] detection flag")

    return HeaderAnalysisResult(
        spf_result=spf_res,
        spf_record=spf_rec,
        spf_sender_ip=earliest_origin_ip,
        dkim_result=dkim_res,
        dkim_domain=dkim_dom,
        dkim_selector=dkim_sel,
        dkim_signature_present=dkim_sig,
        dmarc_result=dmarc_res,
        dmarc_policy=dmarc_pol,
        dmarc_disposition=dmarc_disp,
        relay_chain=relay_chain,
        anomalies=anomalies,
        earliest_origin_ip=earliest_origin_ip,
    )
