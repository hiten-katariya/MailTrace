import pytest
from backend.app.core.url_analysis import is_lookalike_domain, normalize_homoglyphs

def test_homoglyph_detection():
    # paypa1.com -> paypal
    flagged, reason = is_lookalike_domain("paypa1.com")
    assert flagged is True
    assert "paypal" in reason.lower()

    # micros0ft.com -> microsoft
    flagged, reason = is_lookalike_domain("micros0ft.com")
    assert flagged is True
    assert "microsoft" in reason.lower()

    # Raw IP URL
    flagged, reason = is_lookalike_domain("192.168.1.10")
    assert flagged is True
    assert "ip address" in reason.lower()

    # Legitimate domains
    flagged, _ = is_lookalike_domain("google.com")
    assert flagged is False

    flagged, _ = is_lookalike_domain("microsoft.com")
    assert flagged is False
