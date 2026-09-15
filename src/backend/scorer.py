"""
Incident Risk Scorer
====================
Calculates a transparent 0–100 risk score for a correlated incident.

Scoring is purely additive — each factor contributes a fixed number of points.
Every factor that fires is recorded as a human-readable reason, so analysts can
see exactly why an incident received its score.

Score → Priority mapping
  80–100  CRITICAL
  60–79   HIGH
  40–59   MEDIUM
   0–39   LOW
"""

from __future__ import annotations

import re
from typing import Any

# ── Severity base points ───────────────────────────────────────────────────────
# The highest severity across all alerts in the incident drives the base score.
_SEVERITY_BASE = {
    "HIGH":    40,
    "MEDIUM":  20,
    "LOW":     5,
    "UNKNOWN": 0,
}

# ── Alert-count bonus ──────────────────────────────────────────────────────────
# More correlated alerts = higher confidence the incident is real.
# Capped so a flood of LOW alerts can't alone reach CRITICAL.
def _alert_count_points(n: int) -> tuple[int, str]:
    if n >= 5:
        return 15, f"{n} related alerts (large incident cluster)"
    if n >= 3:
        return 10, f"{n} related alerts (medium incident cluster)"
    if n == 2:
        return 5,  f"{n} related alerts (correlated pair)"
    return 0, ""

# ── Multi-source bonus ─────────────────────────────────────────────────────────
# Alerts from several independent detection tools increase confidence.
def _multi_source_points(sources: set[str]) -> tuple[int, str]:
    n = len(sources)
    if n >= 4:
        return 10, f"Detected by {n} independent sources ({', '.join(sorted(sources))})"
    if n >= 2:
        return 5,  f"Detected by {n} independent sources ({', '.join(sorted(sources))})"
    return 0, ""

# ── Malicious keyword patterns ────────────────────────────────────────────────
# Each pattern carries a point value and a label.
# Patterns are matched case-insensitively against every alert description.
_MALICIOUS_PATTERNS: list[tuple[re.Pattern, int, str]] = [
    (re.compile(r"ransomware",                  re.I), 20, "Ransomware signature detected"),
    (re.compile(r"mimikatz|credential.dump",    re.I), 20, "Credential dumping tool detected (Mimikatz / similar)"),
    (re.compile(r"\bc2\b|command.and.control",  re.I), 15, "Command-and-control (C2) communication"),
    (re.compile(r"lateral.movement|smb.brute",  re.I), 15, "Lateral movement behaviour detected"),
    (re.compile(r"malware|trojan|backdoor",     re.I), 15, "Malware / backdoor activity"),
    (re.compile(r"sql.inject",                  re.I), 10, "SQL injection attempt"),
    (re.compile(r"port.scan|network.scan",      re.I), 10, "Network / port scanning"),
    (re.compile(r"phish",                       re.I), 10, "Phishing activity"),
    (re.compile(r"powershell|psexec",           re.I), 8,  "Suspicious scripting / remote execution"),
    (re.compile(r"privilege.escal|privesc",     re.I), 8,  "Privilege escalation attempt"),
    (re.compile(r"data.exfil|exfiltrat",        re.I), 8,  "Data exfiltration behaviour"),
    (re.compile(r"brute.force|password.spray",  re.I), 8,  "Brute-force / password spraying"),
    (re.compile(r"off.hours|after.hours",       re.I), 5,  "Off-hours activity"),
    (re.compile(r"large.file|bulk.download",    re.I), 5,  "Unusually large data transfer"),
    (re.compile(r"new.*admin|admin.*creat",     re.I), 5,  "New privileged account created"),
    (re.compile(r"locked.out|account.lock",     re.I), 3,  "Account lockout detected"),
]

# Maximum points that keyword matches can contribute (prevents keyword spam
# from pushing a truly LOW incident to CRITICAL on its own).
_KEYWORD_CAP = 30


def _keyword_points(alerts: list[dict[str, Any]]) -> tuple[int, list[str]]:
    """
    Scan all alert descriptions for malicious indicator patterns.
    Returns total points (capped) and deduplicated reason strings.
    """
    fired: dict[str, int] = {}   # label → points (deduplicated per incident)

    for alert in alerts:
        text = alert.get("description", "")
        for pattern, pts, label in _MALICIOUS_PATTERNS:
            if pattern.search(text) and label not in fired:
                fired[label] = pts

    total = min(sum(fired.values()), _KEYWORD_CAP)
    # Sort reasons by point value descending so the most serious appears first
    reasons = [label for label, _ in sorted(fired.items(), key=lambda kv: -kv[1])]
    return total, reasons


# ── Mixed-severity penalty/bonus ──────────────────────────────────────────────
def _severity_spread_points(alerts: list[dict[str, Any]]) -> tuple[int, str]:
    """
    A mix of HIGH + MEDIUM alerts in one incident is a stronger signal than
    all-LOW alerts of the same count.
    """
    sevs = {a["severity"] for a in alerts}
    if "HIGH" in sevs and "MEDIUM" in sevs:
        return 5, "Mix of HIGH and MEDIUM alerts in the same incident"
    return 0, ""


# ── Priority thresholds ────────────────────────────────────────────────────────
def _to_priority(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


# ── Public API ─────────────────────────────────────────────────────────────────

def score_incident(incident: dict[str, Any]) -> dict[str, Any]:
    """
    Accept a correlated incident dict (as produced by correlator.py) and return
    a copy enriched with:
      risk_score  (int, 0–100)
      priority    ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW")
      score_reasons  (list[str])  — ordered most-significant first
    """
    alerts     = incident.get("alerts", [])
    severity   = incident.get("severity", "UNKNOWN")
    sources    = {a.get("source", "") for a in alerts if a.get("source")}

    reasons: list[str] = []
    total = 0

    # ── Factor 1: severity base ────────────────────────────────────────────────
    base_pts = _SEVERITY_BASE.get(severity, 0)
    if base_pts > 0:
        reasons.append(f"Highest alert severity: {severity} (+{base_pts} pts)")
    total += base_pts

    # ── Factor 2: alert count ──────────────────────────────────────────────────
    count_pts, count_reason = _alert_count_points(len(alerts))
    if count_reason:
        reasons.append(f"{count_reason} (+{count_pts} pts)")
    total += count_pts

    # ── Factor 3: malicious keywords ──────────────────────────────────────────
    kw_pts, kw_reasons = _keyword_points(alerts)
    for r in kw_reasons:
        # Find the original point value for this label to include in the reason
        for _, pts, label in _MALICIOUS_PATTERNS:
            if label == r:
                reasons.append(f"{r} (+{pts} pts)")
                break
    total += kw_pts

    # ── Factor 4: multi-source detection ──────────────────────────────────────
    src_pts, src_reason = _multi_source_points(sources)
    if src_reason:
        reasons.append(f"{src_reason} (+{src_pts} pts)")
    total += src_pts

    # ── Factor 5: severity spread ──────────────────────────────────────────────
    spread_pts, spread_reason = _severity_spread_points(alerts)
    if spread_reason:
        reasons.append(f"{spread_reason} (+{spread_pts} pts)")
    total += spread_pts

    # ── Clamp to 0–100 ────────────────────────────────────────────────────────
    risk_score = min(max(total, 0), 100)
    priority   = _to_priority(risk_score)

    return {
        **incident,
        "risk_score":    risk_score,
        "priority":      priority,
        "score_reasons": reasons,
    }
