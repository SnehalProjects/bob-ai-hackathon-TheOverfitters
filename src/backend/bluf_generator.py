"""
BLUF Generator — Google Gemini
================================
Generates a concise commander-facing BLUF (Bottom Line Up Front) for a
correlated, scored, and MITRE-mapped security incident.

Credentials are loaded exclusively from environment variables — never
hardcoded and never returned in any API response or log output.

Required environment variable:
  GEMINI_API_KEY   — Google AI Studio API key
                     https://aistudio.google.com/app/apikey

Optional environment variables:
  GEMINI_MODEL     — Gemini model to use
                     (default: gemini-3.6-flash)

If GEMINI_API_KEY is absent or empty the function returns a clear
"not configured" message with configured=False so the rest of the
dashboard continues to work without credentials.
"""

from __future__ import annotations

import os
from typing import Any

from google import genai
from google.genai import types as genai_types

# ── Environment variable names ─────────────────────────────────────────────────
_API_KEY_VAR   = "GEMINI_API_KEY"
_MODEL_VAR     = "GEMINI_MODEL"
_DEFAULT_MODEL = "gemini-3.6-flash"


# ── Prompt builder ─────────────────────────────────────────────────────────────

def _build_prompt(incident: dict[str, Any]) -> str:
    """
    Construct a tightly scoped prompt from the incident data.

    The prompt instructs the model to:
    - Use ONLY the facts provided — no invented IPs, users, or evidence.
    - Produce a structured BLUF with six named sections.
    - Be concise and professional (commander-readable in under 2 minutes).
    """
    inc_id   = incident.get("incident_id", "UNKNOWN")
    priority = incident.get("priority",    "UNKNOWN")
    score    = incident.get("risk_score",  0)
    severity = incident.get("severity",    "UNKNOWN")

    # Identifiers
    ids   = incident.get("identifiers", {})
    ips   = ", ".join(ids.get("ips",       [])) or "None identified"
    hosts = ", ".join(ids.get("hostnames", [])) or "None identified"
    users = ", ".join(ids.get("usernames", [])) or "None identified"

    # Alerts
    alerts = incident.get("alerts", [])
    alert_lines = "\n".join(
        f"  - [Alert {a.get('id','')} | {a.get('severity','')} | {a.get('source','')}] "
        f"{a.get('description','')} "
        f"(timestamp: {a.get('timestamp','unknown')})"
        for a in alerts
    )

    # MITRE techniques
    techs = incident.get("mitre_techniques", [])
    tech_lines = (
        "\n".join(
            f"  - {t['technique_id']} {t['technique_name']} [{t['tactic']}]"
            for t in techs
        )
        if techs else "  - No techniques mapped"
    )

    # Risk score reasons
    reasons = incident.get("score_reasons", [])
    reason_lines = (
        "\n".join(f"  - {r}" for r in reasons)
        or "  - No reasons recorded"
    )

    prompt = f"""You are a cybersecurity analyst writing an intelligence brief for a security commander.

Generate a structured BLUF (Bottom Line Up Front) for the following security incident.

IMPORTANT RULES:
- Use ONLY the facts provided below. Do not invent or assume any IP addresses, usernames, hostnames, malware names, or attack details not present in the data.
- If a section has no relevant data, write "No data available."
- Be concise. The entire BLUF must be readable in under 2 minutes.
- Use plain text only. No markdown formatting, no asterisks, no hash symbols.

=== INCIDENT DATA ===
Incident ID : {inc_id}
Priority    : {priority}
Risk Score  : {score}/100
Severity    : {severity}

Affected Assets:
  IP Addresses : {ips}
  Hostnames    : {hosts}
  Usernames    : {users}

Security Alerts ({len(alerts)} total):
{alert_lines}

MITRE ATT&CK Techniques:
{tech_lines}

Risk Score Factors:
{reason_lines}
=== END INCIDENT DATA ===

Now write the BLUF using exactly these six labelled sections. Each label must appear on its own line followed by a colon.

BOTTOM LINE:
[One sentence. State what is happening, to whom, and how severe it is.]

THREAT SUMMARY:
[2-3 sentences. Describe the attack pattern based solely on the alerts above.]

EVIDENCE:
[List the specific alert IDs, sources, and descriptions that support the threat summary. Only cite alerts present in the data above.]

MITRE ATT&CK TECHNIQUES:
[List each mapped technique ID, name, and tactic. Only include techniques from the data above.]

PRIORITY & RISK SCORE:
[State the priority classification and risk score. Explain the top 2 scoring factors.]

RECOMMENDED ACTIONS:
[3-5 concrete investigation steps appropriate to the threat. Base them on the evidence above.]
"""
    return prompt.strip()


# ── Main public function ───────────────────────────────────────────────────────

def generate_bluf(incident: dict[str, Any]) -> dict[str, Any]:
    """
    Generate a BLUF for the given incident dict using the Gemini API.

    Returns:
      { "bluf": "<text>", "model": "<model_name>", "configured": True/False }

    If GEMINI_API_KEY is missing, returns configured=False with setup instructions
    so the dashboard degrades gracefully without raising an exception.

    Raises:
      Exception — on API errors, rate limits, or network failures.
      The caller (main.py) wraps these in a 502 HTTP response.
    """
    api_key    = os.getenv(_API_KEY_VAR, "").strip()
    model_name = os.getenv(_MODEL_VAR, _DEFAULT_MODEL).strip() or _DEFAULT_MODEL

    # ── Graceful not-configured path ──────────────────────────────────────────
    if not api_key:
        return {
            "bluf": (
                "AI generation is not configured.\n\n"
                "To enable it:\n"
                "1. Get a free Gemini API key: https://aistudio.google.com/app/apikey\n"
                "2. Copy src/.env.example to src/backend/.env\n"
                "3. Set GEMINI_API_KEY=<your key> in src/backend/.env\n"
                "4. Restart the backend: uvicorn main:app --reload --port 8000"
            ),
            "model":      model_name,
            "configured": False,
        }

    # ── Configure Gemini client (google-genai SDK, stable v1 endpoint) ────────
    client = genai.Client(
        api_key=api_key,
        http_options={"api_version": "v1"},
    )
    prompt = _build_prompt(incident)

    # ── Call Gemini ───────────────────────────────────────────────────────────
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            temperature=0.2,        # low temperature = factual, consistent output
            max_output_tokens=1024,
        ),
    )

    generated_text = response.text.strip()

    return {
        "bluf":       generated_text,
        "model":      model_name,
        "configured": True,
    }
