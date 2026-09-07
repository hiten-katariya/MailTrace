# MailTrace — Enterprise Multi-Signal Email Forensic & Anti-Phishing Station

[![Python Version](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.14-38B2AC.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-336791.svg)](https://www.postgresql.org/)
[![Test Suite](https://img.shields.io/badge/tests-63%20passed-success.svg)](https://docs.pytest.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

MailTrace is a production-grade, explainable email forensics and incident response platform designed for Security Operations Center (SOC) analysts, incident responders, and security engineers. 

Unlike traditional black-box spam filters that output an arbitrary score without justification, MailTrace implements a **multi-signal fusion architecture**. It independently evaluates cryptographic email protocols, transmission relay headers, natural language intent, computer-vision image forensics (Quishing & OCR), origin infrastructure reputation, and campaign clustering. Every verdict is backed by an itemized, explainable forensic ledger where each contributing signal, weight, and plain-language explanation is fully transparent.

---

## Table of Contents

- [Key Capabilities](#key-capabilities)
- [System Architecture](#system-architecture)
- [Core Forensic Engines](#core-forensic-engines)
  - [1. Ingestion & Live Mailbox Sync](#1-ingestion--live-mailbox-sync)
  - [2. Header & Relay Hop Forensics](#2-header--relay-hop-forensics)
  - [3. NLP & Language Deception Engine](#3-nlp--language-deception-engine)
  - [4. Quishing & Computer Vision Forensics](#4-quishing--computer-vision-forensics)
  - [5. Origin & Geolocation Intelligence](#5-origin--geolocation-intelligence)
  - [6. Threat Campaign Correlation & Interactive Graph](#6-threat-campaign-correlation--interactive-graph)
- [Multi-Signal Composite Scoring Engine](#multi-signal-composite-scoring-engine)
- [Compliance, Privacy & Retention Engine](#compliance-privacy--retention-engine)
- [Tech Stack](#tech-stack)
- [Project Directory Layout](#project-directory-layout)
- [Installation & Setup](#installation--setup)
- [Running MailTrace](#running-mailtrace)
- [Automated Testing & Verification](#automated-testing--verification)
- [API Reference](#api-reference)
- [License](#license)

---

## Key Capabilities

- **Explainable Multi-Signal Composite Scoring (0–100):** Strictly bounded into six normalized categories (Protocol, Header, Domain/Origin, NLP, URL, Attachment/Quishing) with clear severity classifications: `legitimate` ($<20$), `suspicious` ($20\text{--}69$), `phishing` ($\ge 70$), and `bec` (business email compromise).
- **Interactive Force-Directed Campaign Graph:** Node-link network visualization powered by `d3-force` rendering crisp React SVG elements with zoom, pan, drag-and-drop node physics, connected neighbor highlighting, HUD tooltips, and click-to-investigate case routing.
- **Modern Quishing & Screenshot Lure Forensics:** Scans attachments and embedded inline data images using a dual-engine QR decoder (`pyzbar` + OpenCV) and optical character recognition (`pytesseract`). Identifies image-only filter evasion lures where threat actors eliminate body text to evade NLP detection.
- **Cryptographic Trust Boundary Enforcement:** Unpacks and verifies SPF, DKIM, and DMARC alignments against live DNS authoritative servers. Detects and invalidates forged internal `Authentication-Results` headers injected by malicious upstream relays.
- **Chronological Relay Hop Reconstruction:** Top-down parsing of all `Received` headers with latency calculation, RFC-compliant hop ordering, and timestamp travel anomaly detection.
- **Live Google Mail (OAuth2) Synchronization:** Real-time mailbox monitoring via Google OAuth2 (`gmail.modify`), background differential history polling (APScheduler, 15s intervals), and Server-Sent Events (SSE) streaming directly to the analyst interface.
- **Strict Compliance & Safe Trash Retention:** Non-destructive retention engine with configurable retention windows, PII masking for GDPR/HIPAA compliance, automated safe trashing to Google's 30-day recoverable trash folder, and tamper-evident audit logging.

---

## System Architecture

```
                                  +-------------------------------------------------+
                                  |            Mail Ingestion Gateway               |
                                  |  - RFC 822 / MIME Parser (email stdlib)         |
                                  |  - SHA-256 Immutable Evidence Hashing           |
                                  |  - Live Gmail OAuth2 Sync (gmail.modify + SSE)  |
                                  +-------------------------------------------------+
                                                           |
               +-------------------------------------------+-------------------------------------------+
               |                                           |                                           |
               v                                           v                                           v
+-----------------------------+             +-----------------------------+             +-----------------------------+
| Header & Protocol Engine    |             | NLP & Content Engine        |             | Quishing & Vision Engine    |
| - Live SPF / DKIM / DMARC   |             | - ML Classifier (Logistic / |             | - Dual QR Decoder           |
| - Relay Hop Reconstruction  |             |   MLP Neural Network)       |             |   (pyzbar + cv2 fallback)   |
| - Forged Auth Invalidation  |             | - Coercive Urgency Scoring  |             | - Tesseract OCR Extraction  |
| - Reply-To Spoof Detection  |             | - BEC / CEO Impersonation   |             | - Image-Only Lure Detection |
+-----------------------------+             +-----------------------------+             +-----------------------------+
               |                                           |                                           |
               +-------------------------------------------+-------------------------------------------+
                                                           |
               +-------------------------------------------+-------------------------------------------+
               |                                           |                                           |
               v                                           v                                           v
+-----------------------------+             +-----------------------------+             +-----------------------------+
| Origin & Geolocation Intel  |             | URL & Lookalike Engine      |             | Campaign Correlation Engine |
| - MaxMind GeoLite2 City DB  |             | - Homoglyph / Typosquatting |             | - Shared IP / Domain Pivot  |
| - Autonomous System Lookup  |             | - Sandboxed Redirect Check  |             | - Body Skeleton Hash Pivot  |
| - AbuseIPDB VPN / Tor Check |             | - Threat Reputation Feed    |             | - Interactive d3-force SVG  |
| - WHOIS Domain Age Tracking |             | - Deceptive Subdomain Flags |             |   Network Cluster Graph     |
+-----------------------------+             +-----------------------------+             +-----------------------------+
                                                           |
                                                           v
                                            +-----------------------------+
                                            | Composite Scoring Engine    |
                                            | - 6 Bounded Risk Categories |
                                            | - Max 100 Normalized Score  |
                                            | - Itemized Forensic Ledger  |
                                            +-----------------------------+
                                                           |
                                                           v
                                            +-----------------------------+
                                            | Dark SOC Analyst Station    |
                                            | - React 18 + TypeScript     |
                                            | - Real-time Incident Feed   |
                                            | - Forensic Detail & Reports |
                                            +-----------------------------+
```

---

## Core Forensic Engines

### 1. Ingestion & Live Mailbox Sync
- **Cryptographic Evidence Chain:** Computes an immediate SHA-256 digest over the raw RFC 822 `.eml` payload upon receipt. Raw bytes are preserved immutably in local storage to guarantee legal evidentiary integrity.
- **Gmail OAuth2 Protocol:** Uses Google OAuth2 authorization code grant (`https://www.googleapis.com/auth/gmail.modify`). Refresh tokens are encrypted at rest using 32-byte Fernet symmetric keys.
- **Differential Polling:** Background daemon executes every 15 seconds querying Google `users.history.list` API, ingesting only newly delivered messages without re-scanning mailbox history.
- **Live Event Streaming:** Dispatches real-time SSE updates (`GET /api/cases/stream`) to active analyst dashboards as soon as analysis pipelines finish.

### 2. Header & Relay Hop Forensics
- **Authentication Protocol Auditing:** 
  - Validates SPF records using `pyspf` by cross-referencing sender IP against the DNS authorization envelope.
  - Verifies DKIM cryptographic signatures using `dkimpy`, retrieving public keys via DNS TXT records.
  - Evaluates DMARC alignment (`checkdmarc`) verifying both SPF and DKIM identifier alignment against published organizational policies (`reject`, `quarantine`, `none`).
- **Internal Trust Boundary Protection:** Analyzes upstream relay hops to detect untrusted intermediary servers that forge internal `Authentication-Results: spf=pass` headers to fool naive parsers.
- **Hop Sequencing & Delay Anomalies:** Sorts all RFC 5322 `Received` headers chronologically, measures per-hop latency, and flags anomalous transit delays ($>6$ hours) or backward timestamp anomalies.

### 3. NLP & Language Deception Engine
- **Balanced Machine Learning Classifier:** Trained on an rigorously audited and deduplicated corpus spanning Enron legitimate baselines, Nazario phishing archives, and real-world honeypot captures.
- **Anti-Leakage Token Preprocessing:** Custom stopword filtering removes honeypot dataset artifacts and temporal identifiers, ensuring classification is strictly based on social engineering language.
- **Heuristic Threat Indicators:**
  - Executive Impersonation & BEC: Detects display-name spoofing mimicking senior corporate leadership paired with off-platform communication requests.
  - Coercive Urgency & Pressure: Flags artificial deadlines, threats of service interruption, and legal threats.
  - Payment Diversion: Surfaces wire transfer requests, revised routing instructions, and unauthorized invoice notifications.

### 4. Quishing & Computer Vision Forensics
- **Dual-Engine QR Code Processing:** Automatically extracts and scans PNG, JPEG, GIF, and WebP attachments along with inline Base64 data URIs. Employs `pyzbar` as primary engine with automatic fallback to OpenCV's `cv2.QRCodeDetector`.
- **Target URL Pipeline Routing:** Decoded QR URLs bypass conventional perimeter blindness by routing directly through MailTrace's URL analysis engine to check for homoglyphs, brand impersonation, and redirects.
- **Optical Character Recognition (OCR):** Uses `pytesseract` to extract visible text from screenshot-style image lures. Evaluates text through the NLP classifier to catch image-based phishing attacks.
- **Image-Only Lure Detection:** Flags evasion techniques where threat actors strip textual content ($<60$ characters) and replace the body with a single large embedded graphic lure.

### 5. Origin & Geolocation Intelligence
- **High-Precision Geolocation:** Queries a local MaxMind GeoLite2 City database to resolve country, city, coordinates, and Autonomous System Number (ASN) for the primary originating relay IP.
- **Anonymizer & Proxy Detection:** Cross-references originating IPs against AbuseIPDB to identify Tor exit nodes, commercial VPN egress points, bulletproof hosting providers, and cloud relay infrastructure.
- **Domain Age & RDAP Auditing:** Performs automated WHOIS/RDAP lookups to compute domain registration age, flagging newly registered domains ($<30$ days old) typically associated with disposable phishing infrastructure.

### 6. Threat Campaign Correlation & Interactive Graph
- **Infrastructure Clustered Pivoting:** Automatically correlates disparate cases sharing identical indicators:
  - Originating Public Relay IP
  - Sender Domain Family (e.g. `*.lookalike-portal.com`)
  - Normalized Body Text Skeleton Hash (detecting mass phishing templates across changing sender addresses)
  - Target Brand Profile
- **Interactive Force-Directed Graph (`d3-force`):**
  - **Hub-and-Spoke Topology:** Visualizes the shared correlation pivot as a prominent glowing central hub, connected to satellite incident cases and auxiliary infrastructure nodes.
  - **Dynamic Node Risk Colors:** Cases are dynamically color-coded by verified risk category: Red (`phishing`), Rose (`bec`), Amber (`suspicious`), and Green (`legitimate`).
  - **Performance Safeguard:** Automatically caps graph rendering to the top 35 incidents when clusters grow large, preventing visual clutter while providing a one-click toggle to uncap.
  - **Analyst Controls:** Drag-to-rearrange nodes, canvas pan and zoom, node hover HUD inspection, and one-click case routing.
  - **Dual-View Switcher:** Defaults to the dense, accessible **Evidence List & Timeline** view for rapid scanning, with instantaneous toggle to the interactive **Network Graph**.

---

## Multi-Signal Composite Scoring Engine

MailTrace calculates an explainable composite score on a strictly bounded $0\text{--}100$ point scale across six dedicated forensic categories:

| Category | Maximum Points | Analysis Scope | Key Contributing Signals |
| :--- | :---: | :--- | :--- |
| **1. Protocol Authentication** | **20 pts** | SPF, DKIM, DMARC validation | DMARC policy reject (+15), SPF hard fail (+10), DKIM fail (+10), forged internal auth header (+20). |
| **2. Header & Relay Anomalies** | **15 pts** | Header consistency & hop trace | Reply-To domain mismatch (+10), missing Message-ID (+5), out-of-order hop timestamps (+8), excessive transit latency (+5). |
| **3. Domain & Origin Reputation** | **25 pts** | Origin IP, ASN, WHOIS, DNS | Tor exit / bulletproof hosting (+15), AbuseIPDB reputation ($>50\%$) (+15), newly registered domain $<30$ days (+15), MX record absent (+10). |
| **4. NLP & Language Markers** | **20 pts** | Text classification & heuristics | ML phishing prediction (+12), BEC wire transfer pattern (+15), CEO display name spoof (+10), high urgency cues (+8). |
| **5. URL & Destination Risk** | **10 pts** | Link integrity & redirects | Homoglyph / typosquat domain (+8), IP-based URL (+5), known malicious URLhaus match (+10), deceptive link anchor mismatch (+6). |
| **6. Attachment & Quishing Risk** | **10 pts** | Image & file payload forensics | Malicious QR code target (+10), OCR screenshot lure (+6), image-only text evasion lure (+3), executable / weaponized attachment (+10). |

$$\text{Composite Fraud Score} = \min\left(100, \sum_{i=1}^{6} \text{Category Score}_i\right)$$

### Strict Severity Buckets
- **Verified Clean (`legitimate`):** $0 \le \text{Score} < 20$
- **Suspicious (`suspicious`):** $20 \le \text{Score} < 70$
- **Critical Threat (`phishing`):** $70 \le \text{Score} \le 100$
- **Executive Impersonation (`bec`):** Triggered when high-confidence display name impersonation or payment diversion patterns are validated.

---

## Compliance, Privacy & Retention Engine

- **Configurable Retention Windows:** Administrators can set data retention periods (e.g. 7, 30, 90 days). A scheduled background compliance worker automatically purges expired incident cases and on-disk raw evidence.
- **PII Masking:** Full toggleable anonymization masking user email addresses and sender identities across all screens and PDF exports (e.g. `j****n@target-corp.com`) to support GDPR and HIPAA compliance requirements.
- **Safe Gmail Trash Lifecycle (`auto_trash_on_purge`):** When enabled, emails originating from Gmail that pass the retention expiration threshold are moved to the user's Gmail Trash folder via `users.messages.trash`. Messages remain safely recoverable within Google's native 30-day trash grace period.
- **Immutable Forensic Audit Trail:** Every sensitive operation (case deletion, batch purging, retention policy modification, Gmail trashing) is recorded to a dedicated, queryable `audit_log` table with analyst attribution and timestamps.

---

## Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.13) with asynchronous request pipeline
- **Database & ORM:** PostgreSQL 16 with SQLAlchemy 2.0 (AsyncPG) and Alembic migrations
- **Email & MIME Parsing:** Python Standard Library `email` (RFC 822 parser)
- **Protocol Verification:** `pyspf`, `dkimpy`, `checkdmarc`, `dnspython`
- **Machine Learning & NLP:** `scikit-learn` (TF-IDF vectorizer + classifier), `joblib`, `spacy`
- **Computer Vision & Quishing:** `pyzbar`, `opencv-python-headless`, `pytesseract`, `Pillow`
- **Threat Intelligence & Geo:** `geoip2` / `maxminddb` (GeoLite2 City), `python-whois`, `tldextract`
- **Background Tasks & Sync:** `apscheduler`, `cryptography` (Fernet), `google-api-python-client`
- **Testing:** `pytest`, `pytest-asyncio`

### Frontend
- **Framework:** React 18 with TypeScript and Vite
- **Styling:** Tailwind CSS (custom Dark SOC visual design tokens)
- **Graph Visualization:** `d3-force` (headless physics simulation with custom SVG rendering)
- **State Management & Querying:** TanStack React Query v5
- **Icons & UI Elements:** Lucide React, Headless UI, `clsx`, `tailwind-merge`
- **Maps & Charts:** Leaflet, React-Leaflet, Recharts

---

## Project Directory Layout

```
MailTrace/
├── Backend/                       # FastAPI backend service
│   ├── alembic/                   # Database schema migration scripts
│   │   └── versions/              # Versioned migrations (0001 through 0005)
│   ├── app/
│   │   ├── api/                   # API route controllers
│   │   │   ├── audit.py           # Audit log endpoints
│   │   │   ├── campaigns.py       # Threat campaign cluster endpoints
│   │   │   ├── cases.py           # Case management, upload & SSE streaming
│   │   │   ├── gmail.py           # Gmail OAuth2 & sync endpoints
│   │   │   ├── retention.py       # Retention policy & PII masking endpoints
│   │   │   └── stats.py           # Dashboard statistics & metrics
│   │   ├── core/                  # Core forensic analysis engines
│   │   │   ├── correlation.py     # Campaign clustering & infrastructure matching
│   │   │   ├── domain_intel.py    # WHOIS, RDAP & domain age auditing
│   │   │   ├── header_analysis.py # Relay hop reconstruction & spoof detection
│   │   │   ├── image_analysis.py  # Quishing, QR decoder & OCR text extraction
│   │   │   ├── ingestion.py       # MIME parsing & evidence hashing
│   │   │   ├── nlp_analysis.py    # TF-IDF classification & BEC cue detection
│   │   │   ├── protocol_checks.py # Live SPF, DKIM & DMARC validators
│   │   │   ├── retention.py       # Retention worker & Gmail trash handling
│   │   │   ├── scoring.py         # 6-Category explainable composite scoring
│   │   │   └── url_analysis.py    # Homoglyphs & redirect resolution
│   │   ├── models/                # SQLAlchemy database models
│   │   ├── schemas/               # Pydantic request and response schemas
│   │   ├── config.py              # Application settings & environment parsing
│   │   ├── database.py            # Async & sync database engine configurations
│   │   └── main.py                # FastAPI entrypoint, middleware & route mounting
│   ├── data/                      # MaxMind GeoLite2 databases and training datasets
│   ├── models/                    # Serialized ML model artifacts (.joblib)
│   ├── tests/                     # Comprehensive Pytest test suite
│   │   ├── fixtures/              # Curated RFC 822 .eml forensic test emails
│   │   ├── test_auth_trust.py     # Forged header rejection tests
│   │   ├── test_correlation.py    # Threat campaign clustering tests
│   │   ├── test_headers.py        # Protocol and hop parsing tests
│   │   ├── test_quishing.py       # QR decoding, OCR and lure tests
│   │   └── test_scoring.py        # Composite score bounds & signal tests
│   └── requirements.txt           # Backend Python dependencies
├── src/                           # React + TypeScript frontend application
│   ├── components/
│   │   ├── campaign/              # Campaign views & d3-force CampaignGraph.tsx
│   │   ├── case-detail/           # Tabs: Overview, Headers, Content, Map, Report
│   │   ├── common/                # Navbar, EvidenceCard, RiskChip, Modals
│   │   ├── dashboard/             # Incident queue table, metric bars, filters
│   │   └── gmail/                 # Live Mailbox cards & OAuth connect modal
│   ├── lib/                       # Formatting, risk utilities & helpers
│   ├── mocks/                     # Local demo fixtures and fallback API store
│   ├── pages/                     # Routed pages (Dashboard, CaseDetail, Campaigns, etc.)
│   ├── types/                     # TypeScript interfaces and enum definitions
│   ├── App.tsx                    # Main router & layout container
│   └── main.tsx                   # React root mount point
├── docs/                          # Architectural specifications and design documents
│   ├── api.md                     # Comprehensive REST API specifications
│   ├── design.md                  # SOC tool design philosophy & visual system
│   ├── meth.md                    # Research methodology & signal-fusion theory
│   ├── plan.md                    # Milestone schedule & architectural roadmap
│   ├── prd.md                     # Product Requirements Document (FR1 - FR8)
│   └── tech.md                    # Technology-to-module mapping
├── .env.example                   # Environment configuration template
├── package.json                   # Frontend dependencies and build scripts
├── run.py                         # Single-command unified backend server launcher
├── tailwind.config.js             # Custom Dark SOC color palette configuration
├── tsconfig.json                  # Strict TypeScript compiler options
└── vite.config.ts                 # Vite bundler configuration
```

---

## Installation & Setup

### Prerequisites

- **Python:** Version `3.11` to `3.13`
- **Node.js:** Version `18.x` or `20.x` (with `npm`)
- **Database:** PostgreSQL 16 running locally on port `5432`
- **Tesseract OCR (Optional, for live OCR extraction):**
  - Windows: [UB-Mannheim Tesseract Installer](https://github.com/UB-Mannheim/tesseract/wiki)
  - Linux: `sudo apt-get install tesseract-ocr`
  - macOS: `brew install tesseract`
  *(Note: If Tesseract is not installed, MailTrace gracefully degrades OCR and continues running all QR code and text analysis).*

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/hiten-katariya/MailTrace.git
cd MailTrace
```

---

### Step 2: Configure Environment Variables

Copy the template `.env.example` into a new `.env` file at the root:

```bash
cp .env.example .env
```

Edit `.env` to configure your PostgreSQL credentials and optional API keys:

```env
# PostgreSQL Database URLs
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/mailtrace
SYNC_DATABASE_URL=postgresql://postgres:your_password@localhost:5432/mailtrace

# Application JWT Security
SECRET_KEY=generate_a_secure_random_string_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# External Intelligence (Optional free keys)
ABUSEIPDB_API_KEY=your_optional_abuseipdb_key

# GeoLite2 City Database Path
MAXMIND_DB_PATH=GeoLite2-City.mmdb

# Google OAuth & Gmail Live Sync (Optional for live Gmail monitoring)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
TOKEN_ENCRYPTION_KEY=generate_with_cryptography_Fernet_generate_key
GMAIL_POLL_INTERVAL_SECONDS=15
```

---

### Step 3: Setup Backend Virtual Environment & Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r Backend/requirements.txt
```

---

### Step 4: Run Database Migrations

Initialize the PostgreSQL database schema using Alembic:

```bash
# Ensure PostgreSQL is running and the database 'mailtrace' exists
# (e.g. created via 'CREATE DATABASE mailtrace;' in psql)
alembic upgrade head
```

---

### Step 5: Install Frontend Dependencies

```bash
npm install
```

---

## Running MailTrace

### 1. Launch the Backend Server

Start the FastAPI forensic station backend:

```bash
python run.py
```
*The backend API and Swagger UI will be available at [http://localhost:8000](http://localhost:8000) (Interactive Swagger Docs at [http://localhost:8000/docs](http://localhost:8000/docs)).*

### 2. Launch the Frontend Application

In a separate terminal, launch the Vite development server:

```bash
npm run dev
```
*The analyst dashboard will open at [http://localhost:5173](http://localhost:5173).*

---

## Automated Testing & Verification

MailTrace maintains a strict, zero-regression test suite covering every forensic module, including cryptographic protocol validation, relay spoof detection, quishing detection, and score bounds.

### Run Backend Pytest Suite

```bash
python -m pytest Backend/tests/ -v
```

**Test Coverage Summary (63 passed, 0 failures):**
- `test_auth_trust_boundary.py`: Verifies rejection of forged `Authentication-Results` headers injected by untrusted upstream relays.
- `test_headers.py`: Validates RFC 5322 parsing, relay latency calculations, and Reply-To domain mismatch detection.
- `test_quishing.py`: Tests dual-engine QR code extraction, lookalike URL routing, OCR text parsing, image-only evasion lure detection, and false-positive immunity on benign corporate logos.
- `test_scoring.py`: Enforces composite score mathematical bounds ($0 \le \text{Score} \le 100$), risk bucket alignment, and explainable signal weighting.
- `test_correlation.py`: Confirms multi-pivot threat campaign clustering across origin IPs and domain families.

### Run Frontend Production Build

```bash
npm run build
```
*Executes full TypeScript type-checking (`tsc`) and Vite production bundling to guarantee zero type errors.*

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/cases` | List all analyzed incident cases with filtering and pagination |
| `POST` | `/api/cases/upload` | Ingest and evaluate a raw `.eml` file through the forensic pipeline |
| `GET` | `/api/cases/{case_id}` | Retrieve comprehensive forensic details for a single case |
| `GET` | `/api/cases/{case_id}/headers` | Reconstruct chronological relay hops and authentication badges |
| `GET` | `/api/cases/{case_id}/content` | Get NLP analysis, flagged phrases, and Quishing/OCR findings |
| `GET` | `/api/cases/{case_id}/origin` | Retrieve MaxMind geolocation, ISP, ASN, and WHOIS domain age |
| `GET` | `/api/cases/{case_id}/report` | Export structured JSON forensic report for legal documentation |
| `DELETE` | `/api/cases/{case_id}` | Purge an individual incident case and associated raw evidence |
| `POST` | `/api/cases/batch-delete` | Purge multiple cases simultaneously with audit logging |
| `GET` | `/api/cases/stream` | Server-Sent Events (SSE) stream broadcasting live case updates |
| `GET` | `/api/campaigns` | List active threat campaign clusters and shared indicators |
| `GET` | `/api/campaigns/{campaign_id}` | Retrieve campaign infrastructure graph nodes and timeline events |
| `GET` | `/api/gmail/status` | Check live Gmail OAuth2 connection and polling status |
| `POST` | `/api/gmail/callback` | Exchange OAuth2 authorization code for encrypted refresh token |
| `GET` | `/api/retention/policy` | Retrieve current retention configuration and PII masking status |
| `PUT` | `/api/retention/policy` | Update retention days, PII masking, or Gmail safe trash policy |
| `GET` | `/api/audit/logs` | Query tamper-evident analyst action audit logs |

*For complete schema definitions and sample payloads, refer to [docs/api.md](docs/api.md).*

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
