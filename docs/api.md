# API Documentation — MailTrace

**Base URL (local dev):** `http://localhost:8000`
**Format:** JSON over REST
**Auth:** Bearer JWT (except `/auth/login`)
**Interactive docs:** FastAPI auto-generates Swagger UI at `/docs` and ReDoc at `/redoc` — this document is the human-readable companion.

---

## 1. Authentication

### `POST /auth/login`
Authenticate an analyst and receive a JWT.

**Request body:**
```json
{
  "username": "analyst1",
  "password": "yourpassword"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Response 401:** Invalid credentials.

---

## 2. Ingestion

### `POST /cases/upload`
Upload a raw `.eml` file for analysis. Triggers the full pipeline (header analysis → NLP → geolocation → domain intel → scoring) asynchronously.

**Headers:** `Authorization: Bearer <token>`
**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | file (.eml) | Raw email file |

**Response 202 (Accepted):**
```json
{
  "case_id": "c8f2a1e4-...",
  "status": "processing",
  "submitted_at": "2026-09-02T10:15:00Z",
  "file_hash": "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3"
}
```

**Response 400:** Invalid or unparseable `.eml` file.

---

### `GET /cases/{case_id}/status`
Poll processing status of a submitted case.

**Response 200:**
```json
{
  "case_id": "c8f2a1e4-...",
  "status": "completed",
  "progress": {
    "header_analysis": "done",
    "nlp_analysis": "done",
    "geolocation": "done",
    "domain_intel": "done",
    "scoring": "done"
  }
}
```
`status` values: `processing`, `completed`, `failed`.

---

## 3. Case Retrieval

### `GET /cases`
List cases with pagination and filtering — powers the dashboard case list.

**Query parameters:**
| Param | Type | Description |
|---|---|---|
| `page` | int | Page number (default 1) |
| `limit` | int | Results per page (default 25) |
| `min_score` | int | Filter: minimum fraud score |
| `risk_category` | string | `legitimate` \| `suspicious` \| `phishing` \| `bec` |
| `sort_by` | string | `score` \| `date` (default `date`) |
| `search` | string | Search sender/domain/subject |

**Response 200:**
```json
{
  "total": 142,
  "page": 1,
  "limit": 25,
  "cases": [
    {
      "case_id": "c8f2a1e4-...",
      "subject": "URGENT: Verify Your Microsoft 365 Account",
      "sender": "security@m365-security-alerts.com",
      "received_at": "2026-09-02T10:15:00Z",
      "fraud_score": 87,
      "risk_category": "phishing",
      "spf": "fail",
      "dkim": "fail",
      "dmarc": "fail"
    }
  ]
}
```

---

### `GET /cases/stats`
Aggregated dataset telemetry and risk distribution statistics for dashboard analytics and Recharts visualizations.

**Response 200:**
```json
{
  "total_cases": 142,
  "high_risk_cases": 48,
  "suspicious_cases": 35,
  "legitimate_cases": 59,
  "average_score": 52.4,
  "by_risk_category": [
    { "category": "phishing", "count": 38, "percentage": 27, "color": "#EF4444" },
    { "category": "bec", "count": 10, "percentage": 7, "color": "#F43F5E" },
    { "category": "suspicious", "count": 35, "percentage": 25, "color": "#F59E0B" },
    { "category": "legitimate", "count": 59, "percentage": 41, "color": "#10B981" }
  ],
  "score_brackets": [
    { "range": "0–20", "count": 42, "color": "#10B981" },
    { "range": "21–40", "count": 17, "color": "#28C7E8" },
    { "range": "41–60", "count": 35, "color": "#F59E0B" },
    { "range": "61–80", "count": 30, "color": "#F97316" },
    { "range": "81–100", "count": 18, "color": "#EF4444" }
  ],
  "detection_trends": [
    {
      "date": "2026-08-31",
      "phishing": 6,
      "bec": 2,
      "suspicious": 4,
      "legitimate": 11
    },
    {
      "date": "2026-09-01",
      "phishing": 7,
      "bec": 2,
      "suspicious": 5,
      "legitimate": 14
    }
  ]
}
```

---

### `GET /cases/{case_id}`
Full case detail — overview + all module results.

**Response 200:**
```json
{
  "case_id": "c8f2a1e4-...",
  "subject": "Urgent: Invoice payment update",
  "sender": "billing@paypa1-secure.com",
  "received_at": "2026-09-01T14:22:00Z",
  "file_hash": "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
  "fraud_score": 87,
  "risk_category": "phishing",
  "confidence": "high",
  "verdict_summary": "Likely phishing — spoofed domain, failed DMARC, 2-day-old registration.",
  "score_breakdown": [
    { "signal": "DMARC failure", "weight": 25, "contribution": 25 },
    { "signal": "Domain age < 7 days", "weight": 20, "contribution": 20 },
    { "signal": "NLP: urgency + payment diversion language", "weight": 20, "contribution": 18 },
    { "signal": "Sender IP flagged as VPN exit node", "weight": 15, "contribution": 15 }
  ]
}
```

---

### `GET /cases/{case_id}/headers`
Header/protocol analysis results.

**Response 200:**
```json
{
  "spf": { "result": "fail", "record": "v=spf1 include:_spf.example.com ~all" },
  "dkim": { "result": "fail", "domain": "paypa1-secure.com" },
  "dmarc": { "result": "fail", "policy": "none" },
  "relay_chain": [
    { "hop": 1, "ip": "203.0.113.45", "timestamp": "2026-09-01T14:20:11Z", "server": "mail.paypa1-secure.com" },
    { "hop": 2, "ip": "198.51.100.10", "timestamp": "2026-09-01T14:20:45Z", "server": "relay.example.net" }
  ],
  "anomalies": [
    "From/Return-Path domain mismatch",
    "Reply-To differs from From domain"
  ]
}
```

---

### `GET /cases/{case_id}/content`
NLP/content analysis results.

**Response 200:**
```json
{
  "classification": "phishing",
  "classification_confidence": 0.91,
  "flagged_phrases": [
    "urgent action required",
    "update your payment details immediately"
  ],
  "bec_indicators": ["payment diversion request", "invoice mismatch"],
  "urls": [
    {
      "original": "http://bit.ly/3xYz",
      "resolved": "http://paypa1-secure-login.com/verify",
      "flagged": true,
      "reason": "lookalike domain"
    }
  ],
  "attachments": [
    {
      "filename": "invoice.pdf.exe",
      "declared_content_type": "application/pdf",
      "detected_file_type": "application/x-dosexec",
      "file_size": 45056,
      "file_hash": "a1b2c3d4...",
      "is_flagged": true,
      "flag_reason": "Deceptive double extension detected: disguised as '.pdf' but executes as '.exe'; Payload camouflage: file extension '.exe' hides PE executable binary (MZ header detected)"
    }
  ]
}
```

---

### `GET /cases/{case_id}/origin`
Geolocation and IP intelligence.

**Response 200:**
```json
{
  "originating_ip": "203.0.113.45",
  "geolocation": {
    "country": "Country X",
    "region": "Region Y",
    "city": "City Z",
    "precision_confidence": "country: high, city: low"
  },
  "isp": "Example Hosting Provider",
  "vpn_tor_flag": true,
  "flag_source": "AbuseIPDB",
  "domain_intel": {
    "domain": "paypa1-secure.com",
    "registrar": "Example Registrar Inc.",
    "registered_on": "2026-08-30",
    "domain_age_days": 3,
    "mx_valid": false
  }
}
```

---

### `GET /cases/{case_id}/correlation`
Threat-intel matches and campaign linkage.

**Response 200:**
```json
{
  "threat_intel_matches": [
    { "indicator": "203.0.113.45", "source": "AbuseIPDB", "abuse_score": 78 }
  ],
  "campaign_id": "camp-3391",
  "linked_cases": ["c8f2a1e4-...", "d71b9f02-..."],
  "shared_indicator": "same sending domain family"
}
```

---

## 4. Campaigns

### `GET /campaigns`
List clustered campaigns.

**Response 200:**
```json
{
  "campaigns": [
    {
      "campaign_id": "camp-3391",
      "case_count": 5,
      "shared_indicator": "IP 203.0.113.45",
      "first_seen": "2026-08-29T09:00:00Z",
      "last_seen": "2026-09-01T14:22:00Z"
    }
  ]
}
```

### `GET /campaigns/{campaign_id}`
Full detail of a campaign — all linked cases and shared infrastructure.

---

## 5. Reporting

### `GET /cases/{case_id}/report?format=pdf`
Generate and download the forensic report.

**Query parameters:**
| Param | Type | Description |
|---|---|---|
| `format` | string | `pdf` \| `json` (default `pdf`) |

**Response 200:** File stream (`application/pdf` or `application/json`).

---

## 6. Alerts

### `GET /alerts`
Real-time/recent high-risk alerts (score above configurable threshold).

**Response 200:**
```json
{
  "alerts": [
    {
      "case_id": "c8f2a1e4-...",
      "fraud_score": 87,
      "risk_category": "phishing",
      "triggered_at": "2026-09-01T14:22:10Z"
    }
  ]
}
```

---

## 7. Settings (Privacy/Compliance)

### `GET /settings/retention`
Get current retention policy.

### `PUT /settings/retention`
Update retention policy (admin only).

**Request body:**
```json
{ "retention_days": 90, "auto_purge": true }
```

### `GET /audit-log?case_id={case_id}`
Retrieve audit trail of analyst actions on a case (view/export/annotate), each with timestamp and user.

---

## 8. Error Format (all endpoints)

```json
{
  "error": {
    "code": "INVALID_FILE",
    "message": "Uploaded file is not a valid .eml document",
    "status": 400
  }
}
```

**Common status codes:** `400` (bad request), `401` (unauthorized), `403` (forbidden), `404` (case/resource not found), `422` (validation error), `500` (server error).

---

## 9. Rate Limits & Notes

- Upload endpoint should be rate-limited per analyst (e.g. 20 uploads/minute) to prevent pipeline overload during demo/testing.
- All timestamps are ISO 8601, UTC.
- All monetary/score values are integers 0–100 unless stated otherwise.
- `confidence` fields always use one of: `high`, `medium`, `low` — never a raw probability alone, to keep the UI/API consistent with the product's explainability principle.n