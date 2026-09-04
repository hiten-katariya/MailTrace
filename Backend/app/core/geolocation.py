import os
from typing import Dict, Any, Optional
import maxminddb
from backend.app.config import settings

class GeolocationResult:
    def __init__(
        self,
        originating_ip: str,
        country: Optional[str],
        region: Optional[str],
        city: Optional[str],
        latitude: Optional[float],
        longitude: Optional[float],
        precision_confidence: str,
        isp: Optional[str],
        asn: Optional[str],
    ):
        self.originating_ip = originating_ip
        self.country = country
        self.region = region
        self.city = city
        self.latitude = latitude
        self.longitude = longitude
        self.precision_confidence = precision_confidence
        self.isp = isp
        self.asn = asn

def get_mmdb_path() -> Optional[str]:
    # Check configured path, root path, or backend/data path
    candidates = [
        settings.MAXMIND_DB_PATH,
        os.path.join("backend", "data", "GeoLite2-City.mmdb"),
        "GeoLite2-City.mmdb",
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return None

import ipaddress

def geolocate_ip(ip: str) -> GeolocationResult:
    if not ip or ip == "localhost":
        ip = "127.0.0.1"

    # Validate that IP string is well-formed IPv4 or IPv6
    try:
        parsed_ip = ipaddress.ip_address(ip)
        if parsed_ip.is_loopback or parsed_ip.is_private:
            return GeolocationResult(
                originating_ip=ip,
                country="Local Loopback" if parsed_ip.is_loopback else "Private Network",
                region="Private Network",
                city="Internal Node",
                latitude=0.0,
                longitude=0.0,
                precision_confidence="internal: high",
                isp="Internal / Loopback",
                asn="AS0",
            )
    except ValueError:
        return GeolocationResult(
            originating_ip=ip,
            country="Unknown Country",
            region="Unknown Region",
            city="Unknown City",
            latitude=None,
            longitude=None,
            precision_confidence="country: low, city: low",
            isp="Invalid / Unroutable IP",
            asn=None,
        )

    mmdb_path = get_mmdb_path()
    if not mmdb_path:
        return GeolocationResult(
            originating_ip=ip,
            country="Unknown Country",
            region="Unknown Region",
            city="Unknown City",
            latitude=None,
            longitude=None,
            precision_confidence="country: low, city: low",
            isp="Unknown ISP",
            asn=None,
        )

    try:
        with maxminddb.open_database(mmdb_path) as reader:
            record = reader.get(ip)
            if not record:
                return GeolocationResult(
                    originating_ip=ip,
                    country="Unknown Country",
                    region="Unknown Region",
                    city="Unknown City",
                    latitude=None,
                    longitude=None,
                    precision_confidence="country: low, city: low",
                    isp="Cloud / Unregistered Node",
                    asn=None,
                )

            country_data = record.get("country", {})
            country_name = country_data.get("names", {}).get("en", "Unknown Country")
            
            subdivisions = record.get("subdivisions", [])
            region_name = subdivisions[0].get("names", {}).get("en") if subdivisions else None

            city_data = record.get("city", {})
            city_name = city_data.get("names", {}).get("en")

            location_data = record.get("location", {})
            lat = location_data.get("latitude")
            lng = location_data.get("longitude")
            accuracy_radius = location_data.get("accuracy_radius", 100)

            # Precision confidence labeling
            if city_name and accuracy_radius <= 25:
                precision = "country: high, city: high"
            elif city_name:
                precision = "country: high, city: medium"
            elif country_name != "Unknown Country":
                precision = "country: high, city: low"
            else:
                precision = "country: low, city: low"

            isp_name = record.get("traits", {}).get("isp") or record.get("traits", {}).get("organization") or "Internet Hosting Provider"
            asn_str = f"AS{record.get('traits', {}).get('autonomous_system_number')}" if record.get('traits', {}).get('autonomous_system_number') else None

            return GeolocationResult(
                originating_ip=ip,
                country=country_name,
                region=region_name,
                city=city_name,
                latitude=lat,
                longitude=lng,
                precision_confidence=precision,
                isp=isp_name,
                asn=asn_str,
            )

    except Exception as e:
        print(f"Error reading MaxMind database for {ip}: {e}")
        return GeolocationResult(
            originating_ip=ip,
            country="Unknown Country",
            region="Unknown Region",
            city="Unknown City",
            latitude=None,
            longitude=None,
            precision_confidence="country: low, city: low",
            isp="Network Node",
            asn=None,
        )
