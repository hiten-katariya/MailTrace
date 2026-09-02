import pytest
from backend.app.core.geolocation import geolocate_ip
from backend.app.core.domain_intel import analyze_domain_intel

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
