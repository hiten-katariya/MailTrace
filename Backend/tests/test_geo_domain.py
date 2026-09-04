import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from backend.app.core.geolocation import geolocate_ip
from backend.app.core.domain_intel import analyze_domain_intel
from backend.app.core.ip_reputation import query_abuseipdb

def test_local_ip_geolocation():
    res = geolocate_ip("127.0.0.1")
    assert res.country == "Local Loopback"
    assert res.latitude == 0.0

def test_external_ip_geolocation():
    res = geolocate_ip("8.8.8.8")
    assert res.country != ""
    assert res.precision_confidence is not None

def test_domain_intel_analysis():
    res = analyze_domain_intel("google.com")
    assert res.domain == "google.com"
    assert res.mx_valid is True
    assert res.domain_age_days is not None

@pytest.mark.asyncio
async def test_vpn_tor_origin_mocked():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "data": {
            "abuseConfidenceScore": 95,
            "isTor": True,
            "usageType": "Data Center/Web Hosting/Transit",
            "isp": "Tor Exit Router Network",
            "countryCode": "DE",
        }
    }

    mock_client_instance = AsyncMock()
    mock_client_instance.get = AsyncMock(return_value=mock_resp)

    class MockAsyncClientContext:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return mock_client_instance
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

    with patch("backend.app.core.ip_reputation.settings.ABUSEIPDB_API_KEY", "dummy-test-key"):
        with patch("backend.app.core.ip_reputation.httpx.AsyncClient", side_effect=MockAsyncClientContext):
            res = await query_abuseipdb("185.220.101.5")
            assert res.is_vpn_tor is True
            assert res.abuse_score == 95
            assert "AbuseIPDB" in res.flag_source
            assert res.isp == "Tor Exit Router Network"
