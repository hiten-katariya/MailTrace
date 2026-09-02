import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from email.utils import parseaddr, parsedate_to_datetime
import dns.resolver

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
            if delta > 0:
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

def query_dns_txt(domain: str) -> List[str]:
    records = []
    try:
        answers = dns.resolver.resolve(domain, 'TXT', lifetime=2.0)
        for rdata in answers:
            for txt_string in rdata.strings:
                records.append(txt_string.decode('utf-8', errors='ignore'))
    except Exception:
        pass
    return records

def check_spf(sender_domain: Optional[str], origin_ip: Optional[str], raw_eml_bytes: bytes) -> Tuple[str, Optional[str]]:
    if not sender_domain:
        return "none", None

    spf_record = None
    txt_records = query_dns_txt(sender_domain)
    for rec in txt_records:
        if rec.startswith("v=spf1"):
            spf_record = rec
            break

    if not spf_record:
        return "none", None

    if not origin_ip or origin_ip == "127.0.0.1":
        return "neutral", spf_record

    if spf and hasattr(spf, 'check2'):
        try:
            result, code, explanation = spf.check2(i=origin_ip, s=f"postmaster@{sender_domain}", h=sender_domain)
            res_str = result.lower()
            if res_str in ["pass", "fail", "softfail", "neutral", "none"]:
                return res_str, spf_record
        except Exception:
            pass

    # Heuristic fallback
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

    # 2. Authentication Checks
    spf_res, spf_rec = check_spf(sender_domain, earliest_origin_ip, raw_eml_bytes)
    dkim_res, dkim_dom, dkim_sel, dkim_sig = check_dkim(raw_eml_bytes, sender_domain)
    dmarc_res, dmarc_pol, dmarc_disp = check_dmarc(sender_domain, spf_res, dkim_res)

    # 3. Anomaly Detection
    anomalies = []

    from_header = str(raw_headers_dict.get("From", ""))
    reply_to = str(raw_headers_dict.get("Reply-To", ""))
    return_path = str(raw_headers_dict.get("Return-Path", ""))

    _, from_email = parseaddr(from_header)
    _, reply_to_email = parseaddr(reply_to)
    _, return_path_email = parseaddr(return_path)

    # From / Reply-To Mismatch
    if reply_to_email and from_email:
        from_dom = from_email.split("@")[-1].lower() if "@" in from_email else ""
        reply_dom = reply_to_email.split("@")[-1].lower() if "@" in reply_to_email else ""
        if from_dom and reply_dom and from_dom != reply_dom:
            anomalies.append(f"Reply-To domain mismatch: from '@{from_dom}' replies to '@{reply_dom}'")

    # From / Return-Path Mismatch
    if return_path_email and from_email:
        from_dom = from_email.split("@")[-1].lower() if "@" in from_email else ""
        return_dom = return_path_email.split("@")[-1].lower() if "@" in return_path_email else ""
        if from_dom and return_dom and from_dom != return_dom:
            anomalies.append(f"Return-Path envelope mismatch: From '@{from_dom}' vs Return-Path '@{return_dom}'")

    # DMARC / SPF Failure Flag
    if dmarc_res == "fail":
        anomalies.append("DMARC alignment failure: sender domain policy violation")
    elif spf_res == "fail":
        anomalies.append("SPF validation failure: sending server IP not authorized")

    # Missing DKIM on high-profile domain
    if not dkim_sig and sender_domain and any(brand in sender_domain for brand in ["paypal", "microsoft", "google", "apple", "amazon", "bank", "okta"]):
        anomalies.append(f"Cryptographic signature missing on claimed enterprise domain '@{sender_domain}'")

    # Out-of-order relay delays (> 60s)
    for hop in relay_chain:
        if (hop.get("delay_ms") or 0) > 60000:
            anomalies.append(f"Unusual relay latency delay detected at hop #{hop['hop']} (+{(hop['delay_ms']//1000)}s)")

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
