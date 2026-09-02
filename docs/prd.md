# Product Requirements Document — MailTrace

**Tagline:** *Trace the origin, expose the fraud.*
**Version:** 2.0 (Full Scope — SIH)
**Status:** Draft

---

## 1. Background

Email remains one of the most widely used communication channels in government, education, banking, and enterprise ecosystems — and one of the most exploited attack vectors for phishing, impersonation, business email compromise (BEC), financial fraud, credential theft, and malware delivery. Threat actors increasingly use spoofed domains, deceptive sender identities, social engineering, and compromised infrastructure to send convincing fraudulent emails. Traditional controls — spam filters, static blacklists, signature rules — are insufficient against AI-generated language, domain lookalikes, display-name spoofing, hidden redirection links, and relay-chain manipulation. Organizations frequently lack the technical capability to trace the source path, identify probable sender infrastructure, correlate geolocation clues, or support investigation into the origin of a fraudulent email.

## 2. Problem Statement

Current email security ecosystems focus on filtering/blocking suspicious content but provide limited intelligence for deep forensic tracing of fraudulent email origins. Existing tools don't adequately correlate email headers, SMTP relay paths, SPF/DKIM/DMARC results, IP reputation, geolocation indicators, domain registration intelligence, and behavioral patterns into a complete picture of sender identity or operating location. There is a need for an AI-powered platform capable of detecting phishing, spoofed, impersonated, and fraudulent emails in real time or near real time; analyzing the complete technical structure of an email; tracing its transmission path across mail servers; estimating its origin with location; and generating forensic intelligence that assists in identifying malicious infrastructure, compromised systems, or threat actors — while maintaining legal, privacy, and evidentiary standards.

## 3. Proposed Solution

MailTrace is an AI-powered Email Threat Detection, Geolocation and Forensic Intelligence Platform combining NLP, ML, email header forensics, IP intelligence, domain analysis, and graph-based correlation. It ingests raw email content, metadata, and headers; validates sender authentication mechanisms; extracts indicators of compromise; reconstructs relay paths; analyzes originating IPs and associated geolocation data; and generates a confidence-based assessment of fraud risk and probable sender origin — with actionable alerts, visual trace maps, and forensic reports for analysts, administrators, and investigators.

## 4. Goals & Objectives

- Early and accurate detection of fraudulent, spoofed, and phishing-based email attacks.
- Full technical reconstruction of an email's transmission path and authentication posture.
- Estimation of probable origin (IP, geolocation, hosting/VPN/Tor status, domain infrastructure) with honest, stated confidence.
- Identity correlation and attribution support at the infrastructure/campaign level — not a claim of confirmed real-world identity.
- Real-time/near-real-time alerting, analyst dashboarding, and legally-usable forensic reporting.
- Institutional readiness for cyber incident response, forensic investigation, and law-enforcement coordination.
- Compliance-by-design: privacy, retention, masking, and chain-of-custody support built in, not bolted on.

## 5. Target Users

| User | Need |
|---|---|
| SOC / security analyst | Real-time triage — which emails are threats, and the evidence behind the verdict |
| Institutional email administrator (bank, university, government body) | Organization-wide visibility and case management |
| Fraud/investigation unit | Evidence trail, campaign correlation, exportable forensic reports |
| Law enforcement support liaison | Structured forensic reports usable for referral/escalation |
| SIH judges/evaluators | A working, explainable, demonstrable end-to-end system |

## 6. Scope

**In scope (full solution, per problem statement):**
- Fraudulent Email Detection Engine (NLP/ML content + phishing/BEC pattern detection)
- Email Header and Protocol Analysis Module (SPF/DKIM/DMARC, relay-path forensics)
- Origin Traceability and Location Analysis (IP geolocation, VPN/Tor/hosting detection, domain intelligence)
- Identity Correlation and Attribution Support (threat-intel correlation, graph analysis, campaign clustering)
- Alerting, Dashboard, and Forensic Reporting (real-time alerts, analyst dashboard, structured reports, case management)
- Privacy, Legal, and Compliance Safeguards (retention, masking, chain-of-custody, evidence logging)

**Out of scope (explicitly, to set correct expectations):**
- Deterministic identification of a human threat actor's real-world identity — the system provides infrastructure/campaign-level attribution support only.
- Live MTA-level mail interception/blocking in the prototype (email is submitted/uploaded or pulled via a connected test mailbox — architecture supports live gateway integration as a future extension).
- Multi-tenant SaaS deployment, SSO/RBAC hardening, formal legal certification of evidentiary chain-of-custody (handled at prototype level as configurable safeguards, not certified compliance).

## 7. Functional Requirements

### FR1 — Ingestion
- FR1.1: Accept `.eml` upload via UI; support connecting a test mailbox (IMAP) as a stretch goal.
- FR1.2: Parse raw headers, plain/HTML body, attachments, and embedded URLs.
- FR1.3: Compute and persist a SHA-256 hash of the original raw message at ingestion time (evidence integrity).
- FR1.4: Store the raw `.eml` immutably (write-once) separate from derived/analysis data.

### FR2 — Email Header and Protocol Analysis Module
- FR2.1: Validate SPF, DKIM, and DMARC; report pass/fail/none per mechanism, with raw evidence (signature, record) retained.
- FR2.2: Reconstruct the Received-header relay chain in chronological order with per-hop timestamps and IPs.
- FR2.3: Detect anomalies: mismatched From/Return-Path/Reply-To domains, forged sender fields, relay manipulation, broken/missing signatures, out-of-order or impossible timestamps.
- FR2.4: Validate whether the email was sent through the domain's authorized infrastructure vs. an unrecognized/suspicious relay.

### FR3 — Fraudulent Email Detection Engine
- FR3.1: NLP analysis of subject/body for urgency cues, impersonation language, and social-engineering patterns.
- FR3.2: Detect phishing indicators: spoofed sender addresses, deceptive/lookalike domains, suspicious attachments, malicious/obfuscated links.
- FR3.3: ML classification into Legitimate / Suspicious / Impersonated / Phishing / Fraud-related.
- FR3.4: Detect BEC-specific patterns: payment diversion requests, fake invoices, credential-harvesting attempts, executive impersonation.
- FR3.5: Resolve obfuscated/shortened URLs (sandboxed fetch) and evaluate final destination domains.

### FR4 — Origin Traceability and Location Analysis
- FR4.1: Extract originating IP addresses from the header chain; identify the earliest reliable sending node.
- FR4.2: Geolocate the originating IP — country/region/city/ISP/hosting provider — with explicit precision/confidence labeling.
- FR4.3: Correlate against known VPN, Tor, open-relay, botnet, and cloud-hosting indicators.
- FR4.4: Perform domain intelligence: WHOIS/RDAP data, DNS/MX records, hosting fingerprint, registrar details; flag newly-registered or suspicious infrastructure.

### FR5 — Identity Correlation and Attribution Support
- FR5.1: Correlate extracted indicators (IP, domain, hash, sender alias) against threat intelligence feeds, blacklists, and prior incidents stored in the system.
- FR5.2: Build a graph-based relationship model between sender domains, IPs, aliases, reply chains, and linked infrastructure.
- FR5.3: Produce a confidence-based investigative assessment: probable sender infrastructure, campaign linkage, and attribution confidence — explicitly not a real-identity claim.
- FR5.4: Flag likely origin category: compromised legitimate account, spoofed domain, anonymized infrastructure (VPN/Tor), or direct actor-controlled environment.

### FR6 — Alerting, Dashboard, and Forensic Reporting
- FR6.1: Generate real-time alerts for high-risk emails before user interaction/administrative approval.
- FR6.2: Analyst dashboard displaying fraud score, spoofing indicators, sender trace path, geolocation map, and attribution confidence.
- FR6.3: Generate structured forensic reports (PDF/JSON) for institutional action, legal review, incident response, and law-enforcement support — including evidence hash and analysis timestamp.
- FR6.4: Searchable case management view grouping related fraudulent emails into campaigns.

### FR7 — Privacy, Legal, and Compliance Safeguards
- FR7.1: Configurable retention policy for stored emails and derived case data.
- FR7.2: Configurable masking of sensitive personal data/metadata in dashboard views and exported reports.
- FR7.3: Full logging of analyst actions on a case (view, export, annotate) to support chain-of-custody.
- FR7.4: Evidence preservation: raw file + hash retained immutably regardless of retention policy applied to derived data, until explicitly purged by an authorized action.

### FR8 — Scoring
- FR8.1: Compute a composite fraud score (0–100) from all module outputs, with documented signal weighting.
- FR8.2: Attach a human-readable explanation of which signals contributed to the score and each signal's reliability — no unexplained black-box verdict.

## 8. Non-Functional Requirements

- **Performance:** Single-email end-to-end analysis completes in under ~10 seconds in the demo path.
- **Explainability:** Every fraud score and attribution claim must be traceable to specific underlying signals.
- **Honesty of confidence:** Geolocation and attribution outputs always carry an explicit confidence/precision label — never presented as certain fact.
- **Portability:** Runs without Docker for local development (Python venv + npm + local Postgres); Docker Compose optional for one-command demo reliability.
- **Data integrity:** Raw ingested emails are immutable and hash-verified; derived analysis data is separately versioned.
- **Auditability:** All analyst interactions with a case are logged with timestamp and user identity.
- **Scalability (design-level, not required for prototype):** Architecture should not preclude moving from single-file upload to a live mail-gateway feed at higher volume later.

## 9. System Architecture (summary)

```
Ingestion
   ↓
Header & Protocol Analysis (SPF/DKIM/DMARC, relay chain)
   ↓
Fraudulent Email Detection Engine (NLP/ML content analysis)
   ↓
Origin Traceability & Location Analysis (IP geolocation, VPN/Tor/hosting)
   ↓
Domain Intelligence (WHOIS/DNS)
   ↓
Identity Correlation & Attribution Support (threat intel, graph clustering)
   ↓
Scoring (composite fraud score + confidence)
   ↓
Alerting & Dashboard  ──→  Forensic Reporting
   ↓
Privacy/Legal/Compliance layer (retention, masking, chain-of-custody) — applies across all stages
```

## 10. Tech Stack

- **Backend:** Python (FastAPI)
- **Header/protocol:** `dkimpy`, `pyspf`, `checkdmarc`, `dnspython`
- **NLP/ML:** scikit-learn baseline → HuggingFace transformer (DistilBERT/RoBERTa) for phishing/BEC classification; spaCy for entity/urgency-cue extraction
- **Domain intelligence:** `python-whois`, RDAP, DNS/MX lookups
- **Geolocation:** MaxMind GeoLite2 (self-hosted DB)
- **Threat intelligence:** AbuseIPDB, open-source blocklists, MISP (feed ingestion)
- **Correlation graph:** Neo4j (or a lightweight in-Postgres adjacency model if time-constrained)
- **Primary database:** **PostgreSQL 16** — stores case records, header/authentication results, WHOIS/domain data, scoring breakdowns, campaign clusters, audit logs
- **Optional time-series layer:** TimescaleDB extension on the same Postgres instance, for an events/alerts table powering "alerts over time" dashboard charts (added in later phase, not required for MVP)
- **Object storage:** local filesystem (prototype) for immutable raw `.eml` storage, with hash recorded in Postgres
- **Search:** Postgres full-text search for prototype scope (Elasticsearch as future upgrade if case volume grows)
- **Frontend:** React + Leaflet (trace map)
- **ORM/migrations:** SQLAlchemy + Alembic
- **Local dev:** Python venv + npm, connecting directly to local Postgres
- **Demo deployment:** Docker Compose (optional, for one-command reliability on judges' machines)

## 11. Data Model (high-level, Postgres)

- `cases` — one row per analyzed email (id, ingestion timestamp, raw file hash, fraud score, confidence label, status)
- `headers` — parsed header fields, SPF/DKIM/DMARC results per case
- `relay_hops` — ordered relay chain entries per case (IP, timestamp, hop position)
- `geolocation` — IP, country/region/city, ISP, VPN/Tor/hosting flag, precision label, per case
- `domain_intel` — WHOIS/DNS results per sending domain
- `nlp_findings` — classification label, confidence, flagged phrases/patterns per case
- `urls` — extracted/resolved URLs per case, with reputation flags
- `threat_intel_matches` — indicator matches against external feeds, per case
- `campaigns` — clustered groups of related cases, with shared-infrastructure linkage
- `audit_log` — analyst actions per case (view/export/annotate), timestamped
- `retention_policy` / `masking_rules` — configurable settings tables

## 12. Milestones (build order)

1. **Phase 1:** Ingestion + header/protocol analysis + basic rule-based scoring + minimal dashboard, all on Postgres.
2. **Phase 2:** NLP/ML content detection engine + IP geolocation + domain intelligence.
3. **Phase 3:** Composite scoring with confidence explanation + full dashboard (case list, case detail, trace map) + forensic report export.
4. **Phase 4:** Identity correlation/attribution (threat-intel matching, graph clustering, campaign view) + privacy/compliance controls (retention, masking, audit log) + optional Timescale events table for alert-volume charts.

## 13. Success Metrics

- Correctly classifies a curated test set (legitimate, spoofed, phishing, BEC samples) with near-100% accuracy on deterministic signals (SPF/DKIM/DMARC) and credible accuracy on the ML classifier.
- Dashboard shows fraud score + full signal breakdown for each test case within the demo window.
- Forensic report exports successfully with a verifiable evidence hash.
- Campaign clustering correctly groups at least one set of related synthetic/test phishing emails.
- End-to-end system runs from a documented setup process (venv + npm + local Postgres) without requiring Docker.

## 14. Risks & Limitations

- **Attribution limit:** VPNs, Tor, and compromised legitimate accounts can defeat IP-based origin tracing; the system surfaces probable infrastructure and campaign linkage, not confirmed real-world identity.
- **Geolocation precision:** Reliable at country/ISP level; city-level is approximate — stated explicitly in the UI via confidence labeling (FR4.2).
- **External API dependency:** WHOIS/threat-intel/geolocation feeds may rate-limit or require API keys; plan for cached/offline fallback data for the live demo.
- **ML classifier accuracy:** Bounded by available training data in the prototype timeframe; mitigated by weighting deterministic signals (SPF/DKIM/DMARC, domain age) more heavily than the ML score in the composite fraud score.
- **Compliance scope:** Privacy/retention/masking/chain-of-custody features are implemented as configurable safeguards appropriate to a prototype — not a certified evidentiary or legally-audited system.

## 15. Assumptions

- Prototype operates on submitted/uploaded emails (and optionally a connected test mailbox), not live production MTA interception.
- PostgreSQL is available locally (or via a provisioned instance) for both development and demo; SQLite is not used in this version now that Postgres is the standard store.
- Judges/evaluators will assess the system primarily via the dashboard and forensic report output, so these two surfaces should receive the most polish within the build timeline.