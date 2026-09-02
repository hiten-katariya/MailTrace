# Design Document — MailTrace

## 1. Design Philosophy

MailTrace is a security/forensics tool, not a consumer app — the design should communicate **trust, clarity, and evidence**, not flashiness. Every screen should answer three questions instantly: *Is this email dangerous? Why? What's the proof?* Analysts under time pressure need scannable severity, not decorative UI.

**Core principles:**
- **Evidence-first** — every score/verdict is always shown next to the signals that produced it. No unexplained numbers.
- **Calm urgency** — use color to signal risk level, but avoid alarm-fatigue (no flashing, no aggressive red everywhere).
- **Progressive disclosure** — dashboard shows summary; case detail reveals full forensic depth on demand.
- **Consistency with SOC/security tooling conventions** — analysts are used to dark-mode-friendly, dense, data-forward interfaces (think Splunk, TheHive, VirusTotal) — don't over-simplify into a consumer-app aesthetic.

## 2. Design System

**Color palette:**
- Neutral base: dark slate/graphite background option (SOC tools default to dark mode), with a light mode alternative for institutional/report contexts.
- Risk semantics (used consistently everywhere — badges, score bars, map pins):
 - Low risk / legitimate → green
 - Suspicious → amber/yellow
 - High risk / phishing / BEC → red
 - Unknown/insufficient data → gray
- One accent color (e.g. blue or teal) for interactive elements, links, and primary actions — kept separate from the risk-semantic colors so it's never confused with a severity signal.

**Typography:**
- Clean sans-serif throughout (Inter, IBM Plex Sans, or similar — good for dense data tables and monospace-adjacent technical fields).
- Monospace font specifically for technical values: IP addresses, hashes, headers, domain names — this visually distinguishes "raw evidence" from "interpreted analysis" at a glance.
- Clear type scale: page titles, section headers, body text, and a smaller "meta" size for timestamps/labels — 3–4 sizes max, no more.

**Iconography:**
- Consistent icon set (outline style) for: mail, shield/alert, globe/location, link, domain, clock, user — used identically across dashboard and detail views so recognition is instant.

**Spacing & density:**
- Favor a denser layout than a typical consumer product — analysts scan a lot of data quickly. But maintain generous spacing *within* each data block so it doesn't feel cluttered — density between sections, breathing room within them.

## 3. Information Architecture

```
Login
  └── Dashboard (case list)
        ├── Case Detail
        │     ├── Overview tab (score + summary)
        │     ├── Header Trace tab (relay chain, SPF/DKIM/DMARC)
        │     ├── Content Analysis tab (NLP findings, flagged phrases)
        │     ├── Origin & Geolocation tab (map, IP intel, domain intel)
        │     ├── Correlation tab (campaign links, threat-intel matches)
        │     └── Export Report (PDF/JSON)
        ├── Campaign View (clustered related cases)
        ├── Upload / Submit Email
        └── Settings (retention, masking, user management)
```

## 4. Key Screens

### 4.1 Dashboard (Case List)
- Table/list of analyzed cases: sender, subject, timestamp, fraud score (visual bar/badge), risk category, quick status icons for SPF/DKIM/DMARC pass-fail.
- Sort/filter by score, date, risk category, campaign.
- A slim summary strip at the top: total cases analyzed, high-risk count today, active campaigns — gives judges/analysts an instant read of system activity without opening anything.
- Search bar for case lookup (sender, domain, IP).

### 4.2 Case Detail
- **Header area:** subject line, sender, score badge (large, color-coded), one-line plain-English verdict ("Likely phishing — spoofed domain, failed DMARC, 2-day-old registration").
- **Tabbed body** (see architecture above) so the page isn't overwhelming — summary first, forensic depth behind tabs.
- **Overview tab** is the most important screen in the whole product: a signal breakdown list (each contributing factor + its weight + a short explanation), not just a number. This is what makes the tool "explainable" rather than a black box — design it like a checklist/ledger, not a chart.
- **Header Trace tab:** visually reconstruct the relay chain as a horizontal or vertical hop sequence (server → server → server), each hop showing IP, timestamp, and pass/fail auth badges inline.
- **Origin & Geolocation tab:** map (Leaflet) with a pin at the estimated origin, clearly labeled with a confidence level ("Country-level confidence: high; City-level: low") rather than a falsely precise pin-drop.
- **Correlation tab:** simple node-link or list view of related cases/campaigns sharing infrastructure.

### 4.3 Campaign View
- Group of related cases shown as a cluster — list of linked cases plus the shared indicator (same IP, same domain family, same phishing kit signature) called out explicitly.

### 4.4 Upload/Submit
- Simple drag-and-drop `.eml` upload, with a progress state while the pipeline runs (ingestion → header check → NLP → geolocation → scoring) — showing this as a short animated step sequence reinforces the multi-signal methodology visually, which is good for the demo narrative.

### 4.5 Forensic Report (PDF export)
- Should mirror the case-detail structure but formatted for print/formal use: case summary, evidence hash, full signal breakdown, header trace, geolocation, timestamp of analysis, analyst name (if logged in).

## 5. Interaction Patterns

- **Score visualization:** a horizontal bar or ring, 0–100, color-graded — but always paired with the text label (never rely on color alone, for accessibility and for judges glancing at a screenshot).
- **Confidence labeling:** wherever the system shows a location, attribution, or classification, pair it with a small "confidence: high/medium/low" tag — make this a reusable component since it appears everywhere and is core to the product's honesty principle.
- **Hover/click-through:** hovering a relay hop or signal in the Overview tab should highlight the corresponding raw data in the detail tabs — reinforces "every score traces back to evidence."

## 6. Accessibility

- Never encode risk level by color alone — always pair with text/icon (colorblind-safe).
- Sufficient contrast in both dark and light mode.
- Keyboard-navigable case list and tabs (analysts often work fast, keyboard-first).

## 7. Tone of Voice (UI copy)

- Plain, factual, non-alarmist: "SPF failed" not "DANGER: SPF FAILED!!"
- Verdict lines should be a single explainable sentence, not a jargon dump — e.g. "This looks like a spoofed invoice request — sender domain was registered 2 days ago and fails DMARC."
- Never claim certainty the system doesn't have — use "likely," "probable," "estimated" consistently in copy, matching the confidence-labeling principle throughout.

## 8. Design Deliverables to Produce

1. Color/type/spacing tokens (design system file)
2. Dashboard wireframe → high-fidelity mock
3. Case Detail (Overview + Header Trace + Geolocation tabs) wireframe → high-fidelity mock
4. Upload flow mock
5. Forensic report PDF template
6. Component library: score badge, confidence tag, relay-hop node, risk-color chip — build these once, reuse everywhere.