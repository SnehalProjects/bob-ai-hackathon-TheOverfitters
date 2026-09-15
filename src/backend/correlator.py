"""
Alert Correlation Engine
========================
Groups related alerts into incidents using a Union-Find (disjoint-set) structure.

Two alerts are placed in the same incident when they share ANY of:
  1. Source IP address       (src_ip column)
  2. Destination IP address  (dst_ip column)
  3. Hostname                (hostname column)
  4. Username                (username column)
  5. Time proximity          (timestamps within TIME_WINDOW_MINUTES AND share the
                              same /16 network prefix from their IPs, OR share
                              the same tool source)

Rule 5 acts as a SUPPORTING rule — it only fires when there is also some weak
structural link (same tool/source or overlapping subnet), preventing unrelated
alerts from being chained together just because they happened around the same time.

The logic is fully rule-based and deterministic — no machine learning.
Each rule is checked explicitly so it can be explained step by step.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from scorer import score_incident
from mitre import map_incident

# ── Configuration ──────────────────────────────────────────────────────────────
TIME_WINDOW_MINUTES = 15   # window for time-proximity rule (supporting rule only)

# Regex: IPv4 address
_IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")


# ── Union-Find ─────────────────────────────────────────────────────────────────

class UnionFind:
    """Simple Union-Find with path compression."""

    def __init__(self, n: int) -> None:
        self.parent = list(range(n))

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path compression
            x = self.parent[x]
        return x

    def union(self, x: int, y: int) -> None:
        self.parent[self.find(x)] = self.find(y)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _ips_from_alert(alert: dict[str, Any]) -> set[str]:
    """Return IPs from dedicated columns only (no free-text guessing)."""
    ips: set[str] = set()
    for col in ("src_ip", "dst_ip"):
        val = alert.get(col, "").strip()
        if val:
            ips.add(val)
    return ips


def _subnet16(ip: str) -> str:
    """Return the /16 prefix of an IP, e.g. '10.0' for '10.0.3.44'."""
    parts = ip.split(".")
    if len(parts) >= 2:
        return f"{parts[0]}.{parts[1]}"
    return ip


def _parse_timestamp(value: str) -> datetime | None:
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%dT%H:%M",    "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(value.strip(), fmt)
        except ValueError:
            continue
    return None


# ── Main correlation function ──────────────────────────────────────────────────

def correlate(alerts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Correlate a list of alert dicts into incidents.

    Each alert dict must contain at least: id, severity, source, description.
    Optional: timestamp, src_ip, dst_ip, hostname, username.

    Returns a list of incident dicts, sorted by highest severity then size.
    """
    n = len(alerts)
    if n == 0:
        return []

    uf = UnionFind(n)
    timestamps = [_parse_timestamp(a.get("timestamp", "")) for a in alerts]

    for i in range(n):
        ai = alerts[i]
        ips_i      = _ips_from_alert(ai)
        hostname_i = ai.get("hostname", "").strip().upper()
        username_i = ai.get("username", "").strip().lower()

        for j in range(i + 1, n):
            aj = alerts[j]
            ips_j      = _ips_from_alert(aj)
            hostname_j = aj.get("hostname", "").strip().upper()
            username_j = aj.get("username", "").strip().lower()

            # ── Rule 1: shared source or destination IP ────────────────────
            if ips_i & ips_j:
                uf.union(i, j)
                continue

            # ── Rule 2: shared hostname ────────────────────────────────────
            if hostname_i and hostname_j and hostname_i == hostname_j:
                uf.union(i, j)
                continue

            # ── Rule 3: shared username ────────────────────────────────────
            if username_i and username_j and username_i == username_j:
                uf.union(i, j)
                continue

            # ── Rule 4 (supporting): time proximity + same tool source ─────
            # Only fires when both alerts come from the same detection source
            # AND happened within TIME_WINDOW_MINUTES of each other.
            ti, tj = timestamps[i], timestamps[j]
            if ti and tj and ai.get("source") == aj.get("source"):
                diff_min = abs((ti - tj).total_seconds()) / 60
                if diff_min <= TIME_WINDOW_MINUTES:
                    uf.union(i, j)

    # ── Group by root ──────────────────────────────────────────────────────────
    groups: dict[int, list[int]] = {}
    for idx in range(n):
        root = uf.find(idx)
        groups.setdefault(root, []).append(idx)

    # ── Build incident objects ─────────────────────────────────────────────────
    SEV_RANK = {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "UNKNOWN": 3}

    incidents = []
    for group_alerts_indices in groups.values():
        group_alerts = [alerts[i] for i in group_alerts_indices]

        all_ips:   set[str] = set()
        all_hosts: set[str] = set()
        all_users: set[str] = set()

        for i in group_alerts_indices:
            all_ips.update(_ips_from_alert(alerts[i]))
            h = alerts[i].get("hostname", "").strip().upper()
            if h:
                all_hosts.add(h)
            u = alerts[i].get("username", "").strip().lower()
            if u:
                all_users.add(u)

        highest_sev = min(
            (a["severity"] for a in group_alerts),
            key=lambda s: SEV_RANK.get(s, 99),
        )

        incidents.append({
            "incident_id": "",           # assigned after sorting
            "alert_count": len(group_alerts_indices),
            "severity":    highest_sev,
            "identifiers": {
                "ips":       sorted(all_ips),
                "hostnames": sorted(all_hosts),
                "usernames": sorted(all_users),
            },
            "alerts": group_alerts,
        })

    # Score then MITRE-map every incident before sorting
    incidents = [map_incident(score_incident(inc)) for inc in incidents]

    # Sort: highest risk_score first, then severity, then alert count
    incidents.sort(key=lambda inc: (-inc["risk_score"], SEV_RANK.get(inc["severity"], 99), -inc["alert_count"]))

    for i, inc in enumerate(incidents, start=1):
        inc["incident_id"] = f"INC-{i:03d}"

    return incidents
