# Methodology — MailTrace

## 1. Overall Approach

MailTrace follows a **modular, signal-fusion methodology** — rather than relying on a single AI verdict, each module independently analyzes one dimension of the email (authentication, content, origin, infrastructure) and produces an evidence-backed signal. These signals are then combined into a final weighted fraud score. This mirrors how real SOC analysts actually investigate suspicious emails, which makes the output explainable and defensible rather than a black box.

## 2. Development Methodology

**Agile, phase-wise incremental development** — each phase produces a working, demo-able increment rather than building everything in parallel and integrating at the end:

- **Phase 1:** Ingestion + deterministic header/protocol analysis (rule-based, no ML dependency — fastest to validate)
- **Phase 2:** NLP/ML content classification + geolocation + domain intelligence
- **Phase 3:** Composite scoring + dashboard + forensic reporting
- **Phase 4:** Correlation/attribution + compliance safeguards

Each phase is tested and demo-ready before the next begins, so the team always has a working system regardless of how far the 20-day timeline stretches.

## 3. Data Collection & Preparation

- **Legitimate email baseline:** Enron email dataset (public, widely used for this exact purpose)
- **Phishing/fraud samples:** Nazario phishing corpus, PhishTank exports, publicly available BEC sample sets
- **Preprocessing:** header normalization, HTML-to-text extraction, URL de-obfuscation, tokenization
- **Labeling:** binary/multi-class labels (Legitimate / Suspicious / Phishing / BEC) derived from source dataset ground truth

## 4. Module-Wise Technical Methodology

**Header & Protocol Analysis (deterministic):**
Parse Received headers top-down to reconstruct the relay chain in true chronological order; validate SPF/DKIM/DMARC against DNS records; apply rule-based anomaly detection (domain mismatch, broken signature, timestamp inconsistency). This module is rule-based, not ML-based — its output is verifiable and used to sanity-check the ML layer downstream.

**Content Analysis (NLP/ML):**
Feature extraction via TF-IDF on subject/body text; train a supervised classifier (Logistic Regression baseline, upgradeable to a fine-tuned transformer) on the labeled dataset; supplement with rule-based cue detection (urgency phrases, executive-impersonation patterns, payment-diversion language) that a purely statistical model can miss.

**Origin & Domain Intelligence:**
Extract the earliest reliable IP from the relay chain; query MaxMind's local geolocation database and AbuseIPDB for reputation/VPN/Tor flags; query WHOIS/RDAP and DNS for domain age, registrar, and MX validity. All outputs carry an explicit confidence/precision label rather than presented as fact.

**Correlation & Attribution:**
Cross-reference extracted indicators (IP, domain, hash) against stored case history and open threat-intel sources; cluster cases sharing infrastructure into "campaigns" using a shared-indicator adjacency approach in Postgres.

**Scoring:**
Weighted rule engine combining all module outputs into a 0–100 score, with each contributing signal and its weight surfaced to the analyst — designed for explainability, not just a probability number.

## 5. Testing & Validation Methodology

- **Unit testing** for each module in isolation (pytest) — e.g., verifying SPF/DKIM parsing against known-good and known-forged sample headers
- **Integration testing** on the full pipeline using curated `.eml` fixtures spanning legitimate, spoofed-domain, BEC, and VPN-hosted phishing cases
- **Classifier evaluation** using standard metrics — precision, recall, F1-score — on a held-out test split, since accuracy alone is misleading for imbalanced phishing/legitimate class distribution
- **Manual verification** against publicly documented phishing campaigns to sanity-check geolocation and domain-intelligence accuracy

## 6. Evaluation Criteria

- Deterministic modules (SPF/DKIM/DMARC) should perform at near-100% accuracy, since these are protocol-verifiable
- NLP classifier evaluated on precision/recall rather than raw accuracy
- End-to-end pipeline latency kept under ~10 seconds per email for demo viability
- Explainability check: every score must be traceable to specific contributing signals

## 7. Why This Methodology

The core methodological decision is **fusion over pure ML** — deterministic, protocol-verifiable checks (SPF/DKIM/DMARC, domain age) are weighted more heavily than the probabilistic ML classifier. This is intentional: it keeps the system defensible and explainable to non-technical stakeholders and judges, avoids the classic hackathon pitfall of an unexplainable ML score, and matches how real institutional email-security tooling is actually built and trusted in production.