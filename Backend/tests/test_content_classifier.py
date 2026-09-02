import pytest
from backend.app.core.content_analysis import analyze_email_content

def test_classify_phishing_urgency():
    subject = "Security Alert: Confirm your Identity Immediately"
    body = "Your account will be suspended within 24 hours. Action is required immediately to verify your identity."
    sender = "security@alert-portal.com"

    res = analyze_email_content(subject, body, sender)
    assert res.classification in ["phishing", "suspicious"]
    assert res.sentiment_urgency_score > 30
    assert len(res.flagged_phrases) >= 1

def test_classify_bec_wire_transfer():
    subject = "STRICTLY CONFIDENTIAL: Urgent Wire Transfer"
    body = "Please execute an urgent wire transfer to the attached routing number for our confidential acquisition."
    sender = "ceo@corporate-exec.com"

    res = analyze_email_content(subject, body, sender)
    assert res.classification == "bec"
    assert len(res.bec_indicators) >= 1
    assert any("wire transfer" in ind.lower() for ind in res.bec_indicators)

def test_classify_clean_business_email():
    subject = "Team Lunch and Sprint Review"
    body = "Hi team, let's meet at 12:30 PM for lunch in the cafeteria followed by our sprint retrospective."
    sender = "manager@company.com"

    res = analyze_email_content(subject, body, sender)
    assert res.classification == "legitimate"
    assert res.sentiment_urgency_score == 0
    assert len(res.flagged_phrases) == 0
