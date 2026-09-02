
# MailTrace — Tech Stack Mapped to Modules

## Module 1: Ingestion (FR1)
| Component | Tech |
|---|---|
| File upload/parsing | Python stdlib `email` (MIME parser) |
| API layer | FastAPI |
| Evidence hashing | `hashlib` (SHA-256) |
| Raw file storage | Local filesystem, immutable |

## Module 2: Email Header & Protocol Analysis (FR2)
| Component | Tech |
|---|---|
| SPF validation | `pyspf` |
| DKIM validation | `dkimpy` |
| DMARC validation | `checkdmarc` |
| DNS/relay lookups | `dnspython` |
| Relay-chain parsing | Custom Python (regex + timestamp ordering on Received headers) |

## Module 3: Fraudulent Email Detection Engine — NLP/ML (FR3)
| Component | Tech |
|---|---|
| Phishing/BEC text classification | scikit-learn (TF-IDF + Logistic Regression) — primary; HuggingFace Transformers (DistilBERT) as stretch upgrade |
| Urgency/impersonation cue extraction | spaCy (NER + rule-matching) |
| Lookalike domain detection | `tldextract` + Levenshtein/homoglyph comparison |
| Link/redirect resolution | `httpx` (sandboxed fetch) |
| Malicious URL reputation | VirusTotal API / URLhaus |
| Training data | Nazario phishing corpus, PhishTank, Enron (legit baseline) |

## Module 4: Origin Traceability & Location Analysis (FR4)
| Component | Tech |
|---|---|
| IP geolocation | MaxMind GeoLite2 (self-hosted DB) |
| VPN/Tor/hosting detection | AbuseIPDB API |
| Domain WHOIS/registration data | `python-whois` / RDAP |
| MX/DNS validity | `dnspython` |

## Module 5: Identity Correlation & Attribution Support (FR5)
| Component | Tech |
|---|---|
| Threat-intel matching | AbuseIPDB, open-source blocklists |
| Campaign/infrastructure clustering | PostgreSQL adjacency model (shared IP/domain/hash lookups — Neo4j only if time allows) |
| Confidence scoring logic | Custom Python (weighted rule engine) |

## Module 6: Scoring (FR8)
| Component | Tech |
|---|---|
| Composite fraud score | Custom Python weighting engine, combining Modules 2–5 outputs |
| Explanation generation | Structured JSON output (signal → weight → contribution) consumed by frontend |

## Module 7: Alerting, Dashboard & Forensic Reporting (FR6)
| Component | Tech |
|---|---|
| Backend API | FastAPI |
| Frontend framework | React + TypeScript |
| Styling | Tailwind CSS |
| Trace map | Leaflet |
| Charts (fraud trends) | Recharts |
| Data fetching | TanStack Query |
| PDF report generation | WeasyPrint |
| Case search | PostgreSQL full-text search |

## Module 8: Privacy, Legal & Compliance Safeguards (FR7)
| Component | Tech |
|---|---|
| Auth (analyst login) | FastAPI + `python-jose` (JWT) |
| Audit logging | PostgreSQL `audit_log` table, written on every case action |
| Retention/masking rules | Configurable Postgres tables + scheduled cleanup job (Python cron/`BackgroundTasks`) |

## Cross-cutting / Infrastructure
| Component | Tech |
|---|---|
| Database | PostgreSQL 16 (native install, no Docker) |
| ORM/migrations | SQLAlchemy + Alembic |
| Config/secrets | `.env` + `python-dotenv` |
| Testing | `pytest` + curated `.eml` fixtures |
| Dev run | `venv` + `uvicorn` (backend), `npm run dev` (frontend) |

---

This mapping is what I'd hand to Claude Code directly — build one module at a time in this order (2 → 3 → 4 → 6 → 7 → 5 → 8), since Module 2 is deterministic and fastest to get demo-ready, and Module 8 (compliance) can be thin for a 20-day prototype without hurting the core demo.