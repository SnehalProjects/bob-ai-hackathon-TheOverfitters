# Threat Intelligence Correlation & Alert Prioritisation Assistant
### Team: TheOverfitters · IBM Bob AI Hackathon · Track: AI

---

## Slide 1 — Title

# Threat Intelligence Correlation
## & Alert Prioritisation Assistant

**AI-powered SIEM alert analysis, risk scoring, MITRE ATT&CK mapping, and automated BLUF generation for security analysts**

> Team: **TheOverfitters**
> Sejal Lathigara · Snehal Mishra · Raj Joshi · Mahek Trambadia

---

## Slide 2 — The Problem

### Security Analysts Are Drowning in Alerts

- **Thousands of alerts per day** arrive from SIEM systems, firewalls, EDR, IDS, and threat feeds — all in different formats
- Analysts must manually triage each one to decide: *real threat or noise?*
- **Critical threats get missed** because they are buried under hundreds of low-priority notifications
- **False positives waste time** — the average analyst spends 40–50% of their day investigating alerts that turn out to be benign

### Who is Affected

> Security Operations Center (SOC) analysts, threat hunters, and defence commanders who need fast, accurate situational awareness — not more raw data.

---

## Slide 3 — Why Existing Tools Fall Short

| Current Approach | Problem |
|---|---|
| Raw SIEM dashboards | Show every alert equally — no automatic prioritisation |
| Manual triage | Slow, inconsistent, dependent on individual expertise |
| Basic alert grouping | Groups by exact-match rules; misses cross-tool patterns |
| Analyst-written reports | Time-consuming; quality varies; no AI assistance |

> **The gap:** No single tool automatically correlates alerts, scores them with explainable reasoning, maps to MITRE ATT&CK, *and* produces a ready-to-brief summary — all in one step.

---

## Slide 4 — Our Solution

### AI-Powered Threat Intelligence Assistant

We built a full-stack system that takes a CSV of raw SIEM alerts and automatically:

1. **Correlates** related alerts into incidents using shared IPs, hostnames, usernames, and time proximity
2. **Scores** each incident 0–100 with transparent, explainable risk factors
3. **Maps** detected behaviours to MITRE ATT&CK techniques (no ML — deterministic keyword rules)
4. **Prioritises** incidents so the most critical appear first
5. **Generates** a structured AI BLUF (Bottom Line Up Front) via Google Gemini — ready for a commander briefing

---

## Slide 5 — Key Features (1 of 2)

### Feature 1: Alert Correlation Engine

- Uses a **Union-Find (Disjoint Set)** algorithm — efficient, deterministic, explainable
- Correlation rules (applied in order):
  - Shared **source IP** or **destination IP**
  - Shared **hostname**
  - Shared **username**
  - **Time proximity** (within 15 min) + same detection source
- Output: grouped incidents with all linked IOCs (IPs, hosts, users)

### Feature 2: Explainable Risk Scoring

- Additive scoring model — every point has a named reason:
  - Base severity of highest alert (HIGH = +40 pts)
  - Alert count bonus (5+ alerts = +15 pts)
  - Malicious keyword detection (ransomware, Mimikatz, C2, lateral movement…)
  - Multi-source detection bonus (detected by 4+ tools = +10 pts)
  - Mixed HIGH + MEDIUM severity spread (+5 pts)
- Final score → Priority: **CRITICAL** (80–100) / **HIGH** (60–79) / **MEDIUM** (40–59) / **LOW** (0–39)

---

## Slide 6 — Key Features (2 of 2)

### Feature 3: MITRE ATT&CK Mapping

- Local, curated catalogue of **30+ techniques** across 13 tactics
- Pattern-matched against alert descriptions — no external API calls, no ML
- Coverage: Reconnaissance, Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, C2, Exfiltration, Impact

### Feature 4: AI-Powered BLUF Generation

- Structured prompt sent to **Google Gemini** with full incident context
- Output is a 6-section intelligence brief:
  - **Bottom Line** · **Threat Summary** · **Evidence** · **MITRE ATT&CK** · **Priority & Risk Score** · **Recommended Actions**
- Fail-safe local engine guarantees output even without a valid Gemini key

### Feature 5: Prioritised Threat Dashboard

- React dashboard with incident cards, risk score bars, alert sparklines
- Filter by: **All** / **False Positive** / **Confirmed Threat**
- IOC chips (IP, HOST, USER) with copy-to-clipboard
- Tabbed view: Correlated Incidents | All Alerts

---

## Slide 7 — System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ANALYST BROWSER                      │
│                     React.js Dashboard                       │
│   Upload CSV → View Incidents → Generate BLUF               │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (HTTP)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Python)                   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ correlator.py│  │  scorer.py   │  │    mitre.py      │  │
│  │ Union-Find   │→ │ Additive 0-  │→ │ Keyword→Technique│  │
│  │ grouping     │  │ 100 scoring  │  │ mapping (30+)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                              │                              │
│                    ┌─────────▼──────────┐                   │
│                    │  bluf_generator.py │                   │
│                    │  Gemini REST API   │                   │
│                    │  + Local fallback  │                   │
│                    └────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
              Google Gemini API (gemini-1.5-flash)
```

**Data Flow:**
1. Analyst uploads CSV of SIEM alerts via the dashboard
2. FastAPI parses and validates the file
3. Correlator groups alerts → Scorer adds risk score → MITRE mapper adds techniques
4. Incidents returned to dashboard, sorted by risk score (highest first)
5. On demand: incident sent to Gemini → structured BLUF returned and displayed

---

## Slide 8 — Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 | Single-page dashboard, CSV upload, incident cards |
| **Backend** | FastAPI (Python) | REST API, CSV parsing, orchestration |
| **Correlation** | Pure Python (Union-Find) | Deterministic alert grouping |
| **Risk Scoring** | Pure Python (additive rules) | Explainable 0–100 scoring |
| **MITRE Mapping** | Python (regex catalogue) | 30+ technique mappings, no ML |
| **AI / BLUF** | Google Gemini 1.5 Flash | Structured intelligence brief generation |
| **Dev Tooling** | IBM Bob, GitHub, GitHub Actions | AI-assisted development & CI |
| **Data Format** | CSV | Lightweight, universal SIEM export format |

---

## Slide 9 — IBM Bob's Role

### How We Used IBM Bob

IBM Bob was used throughout the development process as an AI coding assistant:

- **Scaffolded** the FastAPI backend structure and endpoint design
- **Developed** the Union-Find correlation algorithm and edge-case handling
- **Wrote** the additive risk scoring engine with explainable reason tracking
- **Built** the MITRE ATT&CK keyword catalogue (30+ techniques across 13 tactics)
- **Designed and iterated** the React dashboard UI — from initial layout to the final clean, professional design
- **Debugged** CORS configuration, CSV parsing edge cases, and Gemini API fallback logic
- **Generated** documentation, README, and project structure

> Bob accelerated the entire development cycle — what would have taken days of setup was done in hours, letting the team focus on the security domain logic.

---

## Slide 10 — Demo Walkthrough

### What the Demo Shows

1. **Upload** `sample_alerts.csv` — 20 real-world-style alerts across 6 detection sources
2. **Correlation result** — 20 alerts grouped into ~7 incidents automatically
3. **Incident INC-001** — CRITICAL (score 95+): ransomware + Mimikatz + C2 + port scan, all correlated via shared IP `192.168.1.50`
4. **Expand incident** — view MITRE techniques (T1595, T1071, T1003, T1486…), score factors, related alerts
5. **Generate Brief** — one click calls Gemini and returns a 6-section BLUF in ~3 seconds
6. **False Positive filter** — mark low-confidence incidents as FP and filter them out

### Sample Incident — INC-001 (CRITICAL, Score 95)

```
Alerts: Port scan → C2 connection → Malware process → Mimikatz → Ransomware
Source IPs: 192.168.1.50, FS-01, WORKSTATION-04
MITRE: T1595 Active Scanning · T1071 C2 · T1003 Credential Dumping · T1486 Ransomware
```

---

## Slide 11 — Results & Impact

### What the System Achieves

| Metric | Before (Manual) | After (Our System) |
|---|---|---|
| Time to group related alerts | Minutes–hours | < 1 second |
| Risk prioritisation | Subjective, inconsistent | Deterministic 0–100 score |
| MITRE technique mapping | Requires expert knowledge | Automatic, 30+ techniques |
| Incident briefing | 20–30 min to write | ~3 seconds (Gemini BLUF) |
| Alert overload | All alerts equal weight | Sorted by risk, FP filterable |

### Key Insight
> A single CSV upload transforms a flat list of 20 raw alerts into a prioritised, explained, MITRE-mapped, AI-briefed threat picture — in under 5 seconds.

---

## Slide 12 — Known Limitations & Future Work

### Current Limitations

- **File-based prototype** — ingests CSV exports, not live SIEM streams
- **No authentication** — single-user, no role-based access
- **Static MITRE catalogue** — keyword rules, not semantic matching
- **No persistence** — results are not saved between sessions
- **Gemini dependency** — live BLUF requires internet + valid API key (fallback engine covers demos)

### Future Roadmap

- [ ] Live SIEM integration (Splunk, IBM QRadar, Microsoft Sentinel)
- [ ] Persistent incident database with analyst notes and audit trail
- [ ] LLM-based MITRE mapping for better semantic coverage
- [ ] Role-based access: Analyst / Team Lead / Commander views
- [ ] Automated alert feed polling + real-time dashboard updates
- [ ] Confidence scores + false-positive learning from analyst feedback

---

## Slide 13 — What We're Most Proud Of

### The Correlation + Scoring Pipeline

The combination of:
- A **deterministic Union-Find engine** that explains exactly *why* alerts were grouped
- An **additive scorer** where every point is traceable to a named factor
- A **curated MITRE catalogue** that works offline with zero latency
- A **Gemini BLUF** that synthesises all of the above into a human-readable brief

...means the system is **fully transparent** — an analyst can see exactly how every decision was made. There are no black boxes.

> "Explainability is not optional in security. An analyst needs to trust the tool, and trust requires understanding."

---

## Slide 14 — Team

| Name | Role |
|---|---|
| **Sejal Lathigara** | Team Lead · Backend architecture · Gemini integration |
| **Snehal Mishra** | Alert correlation engine · Risk scoring |
| **Raj Joshi** | MITRE ATT&CK mapping · API design |
| **Mahek Trambadia** | Frontend dashboard · UI/UX |

**Track:** AI
**Hackathon:** IBM Bob AI Hackathon

---

## Slide 15 — Thank You

# Thank You

### Threat Intelligence Correlation & Alert Prioritisation Assistant
**Team TheOverfitters**

> *"From thousands of alerts to one clear brief — in seconds."*

**GitHub:** `bob-ai-hackathon-TheOverfitters`
**Tech:** Python · FastAPI · React · Google Gemini · MITRE ATT&CK · IBM Bob

---

*Generated for IBM Bob AI Hackathon presentation.*
