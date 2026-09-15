# Solution Overview

## What We Built

We built the **Threat Intelligence Correlation & Alert Prioritisation Assistant**—an intelligent security operations platform designed to reduce alert overload and accelerate threat response for SOC analysts and security commanders.

The assistant automatically ingests raw, un-correlated SIEM security alerts, groups related alerts into unified incidents using a deterministic Union-Find correlation engine, evaluates a transparent 0–100 risk score with human-readable explanations, maps attack activities directly to MITRE ATT&CK tactics and techniques, builds visual kill-chain attack timelines, and uses Google Gemini AI to generate executive **Bottom Line Up Front (BLUF)** incident summaries with actionable containment recommendations.

## How It Works

The platform operates via a 6-stage operational workflow:

1. **Alert Ingestion & Validation:**
   The user or SIEM feed uploads a CSV file containing security alerts (with required fields: `id`, `severity`, `source`, `description`, and optional fields: `src_ip`, `dst_ip`, `hostname`, `username`, `timestamp`). The FastAPI backend validates file format, size (max 5 MB), structure, and required header columns.

2. **Graph-Based Correlation (Union-Find Engine):**
   The backend applies a deterministic Union-Find (disjoint-set) algorithm to evaluate relationships across alerts. Two alerts are linked into the same incident if they share any common pivot point:
   - Shared Source IP (`src_ip`) or Destination IP (`dst_ip`)
   - Shared Hostname (`hostname`)
   - Shared Username (`username`)
   - Time Proximity (timestamps within 15 minutes of each other from the same detection source)

3. **Transparent Explainable Risk Scoring:**
   Each correlated incident receives an additive risk score from 0 to 100 based on five transparent factors:
   - **Severity Base:** Points driven by the highest alert severity in the cluster (`HIGH` = 40, `MEDIUM` = 20, `LOW` = 5).
   - **Alert Cluster Volume:** Additional points for multi-alert incidents (up to 15 points).
   - **Malicious Keyword Detection:** Regex pattern matching against known attack indicators (e.g., Ransomware, Mimikatz, C2 communication, PowerShell, Lateral Movement) contributing up to 30 points.
   - **Multi-Source Corroboration:** Bonus points when an incident is detected across multiple independent security tools (up to 10 points).
   - **Severity Spread:** Bonus points for mixed `HIGH` + `MEDIUM` alerts.
   
   The score directly maps to a priority tier: **CRITICAL** (80–100), **HIGH** (60–79), **MEDIUM** (40–59), or **LOW** (0–39).

4. **MITRE ATT&CK Mapping & Attack Chain Generation:**
   Alert descriptions are automatically mapped to MITRE ATT&CK framework tactics and technique IDs (e.g., Spearphishing Attachment `T1566.001`, PowerShell `T1059.001`, OS Credential Dumping `T1003.001`, Non-Standard Port C2 `T1071.001`). The backend orders events chronologically to construct an interactive attack kill-chain timeline.

5. **AI-Powered BLUF Summary Generation:**
   When an analyst inspects an incident, the system submits the enriched incident metadata to Google Gemini AI. Gemini generates a structured, executive BLUF report containing:
   - **Threat Summary:** What happened in plain language.
   - **Key Evidence:** IPs, hostnames, usernames, and tools involved.
   - **MITRE Techniques:** Relevant ATT&CK mappings.
   - **Recommended Actions:** Prioritized containment and remediation steps for defense analysts.
   *(Note: If the Gemini API key is unconfigured or rate-limited, a graceful fallback rule-based BLUF summary is automatically displayed).*

6. **Interactive Prioritized Threat Dashboard:**
   The React frontend presents a modern dashboard where incidents are ranked by risk score. Analysts can view summary stats (Total Alerts, Incident Clusters, Critical Threats), filter by severity, inspect entity connections, view timeline kill chains, and copy BLUF executive summaries with a single click.

## Architecture Diagram

> See [`architecture.md`](architecture.md) for the detailed system architecture diagram and specification.

```
[CSV Alert Ingestion] → [FastAPI Backend]
                               ↓
                   [Union-Find Correlator]
                               ↓
                    [Risk Scorer Engine]
                               ↓
                 [MITRE ATT&CK Mapper]
                               ↓
                   [Timeline & Kill Chain]
                               ↓
                  [Gemini AI BLUF Gen]
                               ↓
                  [React Threat Dashboard]
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Deterministic Union-Find Correlation** | Avoids unpredictable "black-box" ML clustering. Union-Find provides 100% deterministic, explainable, and fast \(O(N \alpha(N))\) alert grouping. |
| **Additive Explainable Scoring** | Every point added to an incident score includes a human-readable reason (e.g. "Ransomware signature detected (+20 pts)"), giving analysts total transparency. |
| **LLM Scoped Strictly to Summarization** | Machine learning (Gemini AI) is used specifically for natural language synthesis (BLUF generation) rather than alert grouping, preserving security determinism. |
| **Graceful AI Fallback System** | If Gemini API is offline, missing, or rate-limited, the system falls back to rule-based BLUF generation so SOC operations are never blocked. |
| **File-Based & REST Architecture** | Uses standard CSV input and FastAPI endpoints for easy integration into existing SOC workflows without requiring heavy database migrations. |

## IBM & AI Technologies Used

- **IBM Bob Integration & Repository Standards:** Structured and developed following IBM Bob hackathon guidelines, repository standards, and automated evaluation validation pipelines.
- **Google Gemini API & GenAI SDK:** Utilizes Google Gemini (`gemini-2.5-flash` / Gemini API) via `google-generativeai` SDK to dynamically analyze multi-alert context and produce concise, battle-ready BLUF executive summaries for security commanders.

