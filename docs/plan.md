# MailTrace — Full Execution Plan

## Team Setup
- Assign module owners: Backend/API lead, Header-forensics lead, NLP/ML lead, Geolocation/Domain-intel lead, Frontend/Dashboard lead. Team members can double up across modules if the group is small.
- Everyone installs: Python 3.11, Node.js, PostgreSQL 16, Git, and a code editor.
- Create the GitHub repo with the agreed folder structure (`backend/`, `frontend/`, `data/`).
- Set up a shared `.env.example` and database connection convention so no one blocks on config.

---

## Phase 1 — Ingestion + Header/Protocol Analysis + Basic Score + Minimal UI

**Goal:** A working end-to-end path — upload an email, get a real (rule-based) verdict. This is the safety-net MVP.

- Set up FastAPI project skeleton with SQLAlchemy + Alembic; connect to local PostgreSQL.
- Define core tables: `cases`, `headers`, `relay_hops`, `audit_log`.
- Build `.eml` upload endpoint: parse raw MIME (headers, body, attachments, URLs) using Python's `email` module.
- Compute and store SHA-256 hash of the raw file at ingestion.
- Implement SPF validation (`pyspf`), DKIM validation (`dkimpy`), DMARC validation (`checkdmarc`).
- Parse and reconstruct the Received-header relay chain in chronological order; store as `relay_hops`.
- Implement anomaly rules: From/Return-Path/Reply-To mismatch, broken/missing signatures, out-of-order timestamps.
- Build a simple rule-based scoring function combining these checks into a preliminary fraud score.
- Build a minimal React frontend: upload form + a results page showing SPF/DKIM/DMARC status and the relay chain.
- Test against a curated set of known-legitimate and known-forged sample `.eml` files.
- **Checkpoint:** Upload an email, see SPF/DKIM/DMARC results and a fraud score, end to end.

---

## Phase 2 — NLP/ML Content Detection + Geolocation + Domain Intelligence

**Goal:** Add the "why does this look like phishing" and "where did it come from" layers.

- Collect and preprocess training data: Enron (legitimate baseline), Nazario corpus + PhishTank exports (phishing), public BEC sample sets.
- Build TF-IDF + Logistic Regression baseline classifier (Legitimate / Suspicious / Phishing / BEC); train, evaluate on precision/recall/F1, save model artifact.
- Add spaCy-based rule layer for urgency cues, executive-impersonation phrasing, payment-diversion language — this catches what the statistical model misses.
- Extract and resolve URLs (`httpx`, sandboxed); detect lookalike/homoglyph domains with `tldextract`; check against VirusTotal/URLhaus where feasible.
- Integrate MaxMind GeoLite2 (self-hosted DB) to geolocate the earliest reliable IP in the relay chain — country/region/ISP level, with an explicit precision label.
- Integrate AbuseIPDB to flag VPN/Tor/hosting-provider origin IPs.
- Integrate `python-whois`/RDAP for domain registration date, registrar, registrant country; flag newly-registered domains.
- Validate MX/DNS records for the sending domain via `dnspython`.
- Store all new signals in their respective tables (`nlp_findings`, `urls`, `geolocation`, `domain_intel`).
- **Checkpoint:** Each analyzed email now returns a content classification, flagged phishing/BEC language, resolved URLs, geolocation, and domain intelligence — not just header results.

---

## Phase 3 — Composite Scoring + Full Dashboard + Forensic Reporting

**Goal:** Turn raw module outputs into something an analyst (and a judge) can actually read and trust.

- Build the composite scoring engine: weighted combination of header/protocol signals, NLP/ML classification, geolocation/domain flags — deterministic signals weighted more heavily than the ML score.
- Generate a structured explanation object: which signals fired, their individual weight, and their contribution to the final score.
- Build the analyst dashboard: case list view (sortable/filterable by score), case detail view showing header trace, geolocation map (Leaflet), scoring breakdown, and flagged content.
- Add dashboard charts (Recharts) for score distribution / detection trends across the test dataset.
- Build PDF forensic report export (WeasyPrint): includes evidence hash, all module findings, and the scoring explanation.
- Add case search (PostgreSQL full-text search) across ingested cases.
- **Checkpoint:** A judge can open the dashboard, click a case, and see a fully explained verdict with a downloadable forensic report — this is your primary demo surface, so polish it more than any other part.

---

## Phase 4 — Correlation/Attribution + Compliance Safeguards (stretch goals)

**Goal:** The "advanced" layer — build this only once Phases 1–3 are fully solid.

- Implement threat-intel cross-referencing against AbuseIPDB and open blocklists for each case's extracted IP/domain.
- Build campaign clustering: group cases sharing IP, domain, or content-hash indicators using a shared-indicator adjacency query in Postgres.
- Add a campaign view to the dashboard showing linked cases and shared infrastructure.
- Add confidence-based attribution labeling: compromised account vs. spoofed domain vs. anonymized infrastructure vs. likely direct actor.
- Implement analyst authentication (FastAPI + JWT) for the dashboard.
- Implement audit logging for every case view/export/annotation action.
- Add configurable retention and masking rules for stored case data.
- **If time allows:** add a TimescaleDB-backed events table for an "alerts over time" chart.

---

## Testing Throughout
- Unit tests (`pytest`) for each module in isolation — especially SPF/DKIM/DMARC parsing against known-good and known-forged headers, since this must be near-100% reliable.
- Integration tests running the full pipeline against the curated `.eml` fixture set (legitimate, spoofed-domain, BEC, VPN-hosted phishing).
- Classifier evaluated on precision/recall/F1 on a held-out split — accuracy alone is misleading given class imbalance.
- Manual sanity-check of geolocation/domain-intelligence output against a couple of publicly documented phishing campaigns.

## Demo Preparation
- Curate 3–4 clean example cases covering: one clean legitimate email, one spoofed-domain phish, one BEC-style fraud, one VPN-hosted sender — pre-loaded so the live demo doesn't depend on network conditions.
- Prepare a short, honest answer for the "can you always find who sent it" question — the system surfaces probable infrastructure and campaign linkage, not confirmed real-world identity, same as real SOC/CERT tooling.
- Rehearse the setup process end to end on a clean machine (fresh Postgres install, `venv`, `npm install`) to make sure there's no missing dependency or config step on demo day.