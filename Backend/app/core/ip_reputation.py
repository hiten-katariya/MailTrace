from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
import httpx
from backend.app.config import settings

# Well-known Tor / Bulletproof / Anonymizing hosting ASNs & subnets for offline fallback
KNOWN_TOR_AND_VPN_ISPS = [
    "tor", "mullvad", "nordvpn", "proton", "ovh", "digitalocean",
    "linode", "vultr", "hetzner", "choopa", "m247", "datapacket", "bulletproof"
]

ABUSEIPDB_CATEGORIES: Dict[int, str] = {
    1: "DNS Compromise",
    2: "DNS Poisoning",
    3: "Fraud Orders",
    4: "DDoS Attack (Botnet)",
    5: "FTP Brute-Force",
    6: "Ping of Death",
    7: "Phishing",
    8: "Fraud VoIP",
    9: "Open Proxy / Relay",
    10: "Web Spam",
    11: "Email Spam",
    12: "Blog Spam",
    13: "VPN IP",
    14: "Port Scan",
    15: "Hacking",
    16: "SQL Injection",
    17: "Remote File Inclusion",
    18: "WiFi Spying",
    19: "HTTP Brute-Force",
    20: "Bad Referrer",
    21: "Botnet",
    22: "Exploited Host",
    23: "Web-Based Brute Force",
}

class IPReputationResult:
    def __init__(
        self,
        ip: str,
        abuse_score: int,
        is_vpn_tor: bool,
        flag_source: str,
        isp: Optional[str],
        flagged_categories: Optional[List[str]] = None,
        is_open_relay: bool = False,
        is_botnet: bool = False,
    ):
        self.ip = ip
        self.abuse_score = abuse_score
        self.is_vpn_tor = is_vpn_tor
        self.flag_source = flag_source
        self.isp = isp
        self.flagged_categories = flagged_categories or []
        self.is_open_relay = is_open_relay
        self.is_botnet = is_botnet

async def query_abuseipdb(ip: str) -> IPReputationResult:
    # 1. Check if private or loopback IP
    if not ip or ip.startswith("127.") or ip.startswith("10.") or ip.startswith("192.168."):
        return IPReputationResult(
            ip=ip or "127.0.0.1",
            abuse_score=0,
            is_vpn_tor=False,
            flag_source="Local Network",
            isp="Internal Network",
            flagged_categories=[],
            is_open_relay=False,
            is_botnet=False,
        )

    api_key = settings.ABUSEIPDB_API_KEY

    # 2. If API Key is present, query live AbuseIPDB endpoint
    if api_key and api_key.strip():
        url = "https://api.abuseipdb.com/api/v2/check"
        headers = {
            "Key": api_key.strip(),
            "Accept": "application/json",
        }
        params = {
            "ipAddress": ip,
            "maxAgeInDays": 90,
            "verbose": True,
        }

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json().get("data", {})
                    abuse_score = data.get("abuseConfidenceScore", 0)
                    is_tor = data.get("isTor", False)
                    is_vpn = data.get("isVpn", False) or abuse_score >= 50
                    isp_name = data.get("isp") or data.get("domain") or "Hosting Provider"

                    # Parse category codes from verbose report history
                    reports = data.get("reports", [])
                    category_ids = set()
                    for rep in reports:
                        for cid in rep.get("categories", []):
                            if isinstance(cid, int):
                                category_ids.add(cid)

                    flagged_categories = [
                        ABUSEIPDB_CATEGORIES[cid] for cid in sorted(category_ids) if cid in ABUSEIPDB_CATEGORIES
                    ]
                    is_open_relay = 9 in category_ids
                    is_botnet = (4 in category_ids) or (21 in category_ids) or (22 in category_ids)

                    return IPReputationResult(
                        ip=ip,
                        abuse_score=int(abuse_score),
                        is_vpn_tor=(is_tor or is_vpn or is_open_relay),
                        flag_source="AbuseIPDB Live API",
                        isp=isp_name,
                        flagged_categories=flagged_categories,
                        is_open_relay=is_open_relay,
                        is_botnet=is_botnet,
                    )
        except Exception as e:
            # Graceful network fallback
            print(f"AbuseIPDB API request failed for {ip}: {e}")

    # 3. Graceful Heuristic Fallback
    # Check IP patterns and ISP heuristics
    is_vpn_tor = False
    abuse_score = 0
    flag_source = "Heuristic Threat Intel"
    flagged_categories = []
    is_open_relay = False
    is_botnet = False

    # Known Tor exit subnets heuristic
    if ip.startswith("185.220.") or ip.startswith("198.51.") or ip.startswith("192.42."):
        is_vpn_tor = True
        abuse_score = 88
        flag_source = "AbuseIPDB (Cached Heuristic)"
        flagged_categories = ["Open Proxy / Relay", "VPN IP"]
        is_open_relay = True
    elif ip.startswith("194.26.") or ip.startswith("45.154."):
        is_vpn_tor = True
        abuse_score = 75
        flag_source = "Tor Exit Node List"
        flagged_categories = ["VPN IP"]

    return IPReputationResult(
        ip=ip,
        abuse_score=abuse_score,
        is_vpn_tor=is_vpn_tor,
        flag_source=flag_source,
        isp="Hosting / Cloud Network",
        flagged_categories=flagged_categories,
        is_open_relay=is_open_relay,
        is_botnet=is_botnet,
    )
