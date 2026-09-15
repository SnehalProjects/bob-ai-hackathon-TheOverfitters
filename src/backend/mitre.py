"""
MITRE ATT&CK Technique Mapper
==============================
Maps correlated incidents to MITRE ATT&CK techniques using keyword-based matching
against alert descriptions.

The mapping is a small, hand-curated local list — no external API calls, no ML.
Each entry declares which keywords in an alert description should trigger it.

Coverage (deliberately limited to common techniques — expand as needed):
  Reconnaissance     T1595, T1590, T1592
  Initial Access     T1566, T1190
  Execution          T1059.001, T1059.003, T1053.005, T1204
  Persistence        T1136, T1547
  Privilege Esc.     T1068, T1548
  Defense Evasion    T1070, T1562
  Credential Access  T1003, T1110, T1555
  Discovery          T1046, T1082, T1083
  Lateral Movement   T1021.002, T1570
  Collection         T1039, T1113
  C2                 T1071, T1095
  Exfiltration       T1041, T1048
  Impact             T1486, T1489
"""

from __future__ import annotations

import re
from typing import Any


# ── Local MITRE technique catalogue ───────────────────────────────────────────
# Each entry: (technique_id, technique_name, tactic, [keyword_patterns])
# Patterns are matched case-insensitively against alert descriptions.

_TECHNIQUES: list[tuple[str, str, str, list[str]]] = [
    # ── Reconnaissance ────────────────────────────────────────────────────────
    ("T1595",     "Active Scanning",
     "Reconnaissance",
     ["port scan", "network scan", "icmp flood", "host discovery"]),

    ("T1592",     "Gather Victim Host Information",
     "Reconnaissance",
     ["host enumeration", "smb enumeration", "rdp scan"]),

    # ── Initial Access ────────────────────────────────────────────────────────
    ("T1566",     "Phishing",
     "Initial Access",
     ["phish", "phishing", "spear-phish", "malicious email", "malicious attachment"]),

    ("T1190",     "Exploit Public-Facing Application",
     "Initial Access",
     ["sql inject", "sql injection", "web exploit", "rce", "remote code execution",
      "cve-", "exploit"]),

    # ── Execution ─────────────────────────────────────────────────────────────
    ("T1059.001", "Command and Scripting Interpreter: PowerShell",
     "Execution",
     ["powershell", "ps1", "invoke-expression", "iex "]),

    ("T1059.003", "Command and Scripting Interpreter: Windows Command Shell",
     "Execution",
     ["cmd.exe", "command shell", "command prompt", "wscript", "cscript"]),

    ("T1053.005", "Scheduled Task/Job: Scheduled Task",
     "Execution",
     ["scheduled task", "schtask", "at.exe", "cron job"]),

    ("T1204",     "User Execution",
     "Execution",
     ["user executed", "macro", "malicious document", "office application",
      "malware process spawned"]),

    # ── Persistence ───────────────────────────────────────────────────────────
    ("T1136",     "Create Account",
     "Persistence",
     ["new.*admin", "admin.*creat", "local admin account", "new account created",
      "user account created"]),

    ("T1547",     "Boot or Logon Autostart Execution",
     "Persistence",
     ["autorun", "startup", "registry run", "boot persist"]),

    # ── Privilege Escalation ─────────────────────────────────────────────────
    ("T1068",     "Exploitation for Privilege Escalation",
     "Privilege Escalation",
     ["privilege escalat", "privesc", "local exploit"]),

    ("T1548",     "Abuse Elevation Control Mechanism",
     "Privilege Escalation",
     ["uac bypass", "sudo abuse", "elevation"]),

    # ── Defense Evasion ───────────────────────────────────────────────────────
    ("T1070",     "Indicator Removal",
     "Defense Evasion",
     ["log cleared", "log deleted", "event log", "indicator removal"]),

    ("T1562",     "Impair Defenses",
     "Defense Evasion",
     ["antivirus disabled", "av disabled", "firewall disabled", "defender disabled"]),

    # ── Credential Access ─────────────────────────────────────────────────────
    ("T1003",     "OS Credential Dumping",
     "Credential Access",
     ["mimikatz", "credential dump", "lsass", "ntds", "hashdump", "pass-the-hash"]),

    ("T1110",     "Brute Force",
     "Credential Access",
     ["brute force", "brute-force", "password spray", "failed login",
      "multiple failed", "login attempt", "account lock"]),

    ("T1555",     "Credentials from Password Stores",
     "Credential Access",
     ["credential store", "keychain", "password store", "saved password"]),

    # ── Discovery ─────────────────────────────────────────────────────────────
    ("T1046",     "Network Service Discovery",
     "Discovery",
     ["port scan", "service scan", "nmap", "network scan", "smb scan"]),

    ("T1082",     "System Information Discovery",
     "Discovery",
     ["system info", "whoami", "hostname enum", "os version"]),

    ("T1083",     "File and Directory Discovery",
     "Discovery",
     ["file discovery", "directory listing", "dir /s", "find /", "ls -la"]),

    # ── Lateral Movement ─────────────────────────────────────────────────────
    ("T1021.002", "Remote Services: SMB/Windows Admin Shares",
     "Lateral Movement",
     ["smb", "lateral movement", "admin share", "psexec", "pass-the-hash"]),

    ("T1570",     "Lateral Tool Transfer",
     "Lateral Movement",
     ["lateral tool", "file transfer to", "tool moved"]),

    # ── Collection ────────────────────────────────────────────────────────────
    ("T1039",     "Data from Network Shared Drive",
     "Collection",
     ["network share", "shared drive", "unc path"]),

    ("T1113",     "Screen Capture",
     "Collection",
     ["screen capture", "screenshot"]),

    # ── Command and Control ───────────────────────────────────────────────────
    ("T1071",     "Application Layer Protocol",
     "Command and Control",
     [r"\bc2\b", "command.and.control", "c2 server", "beacon", "c&c"]),

    ("T1095",     "Non-Application Layer Protocol",
     "Command and Control",
     ["icmp tunnel", "dns tunnel", "covert channel"]),

    # ── Exfiltration ─────────────────────────────────────────────────────────
    ("T1041",     "Exfiltration Over C2 Channel",
     "Exfiltration",
     ["exfiltrat", "data exfil", "data theft", "outbound data"]),

    ("T1048",     "Exfiltration Over Alternative Protocol",
     "Exfiltration",
     ["large.*download", "large file", "bulk download", "dns exfil", "ftp upload"]),

    # ── Impact ────────────────────────────────────────────────────────────────
    ("T1486",     "Data Encrypted for Impact",
     "Impact",
     ["ransomware", "file encrypted", "encrypt", "ransom note"]),

    ("T1489",     "Service Stop",
     "Impact",
     ["service stop", "service disabled", "process kill", "kill process"]),
]

# Pre-compile all patterns for speed
_COMPILED: list[tuple[str, str, str, list[re.Pattern]]] = [
    (tid, name, tactic, [re.compile(kw, re.I) for kw in keywords])
    for tid, name, tactic, keywords in _TECHNIQUES
]


# ── Public API ─────────────────────────────────────────────────────────────────

def map_incident(incident: dict[str, Any]) -> dict[str, Any]:
    """
    Scan every alert description in the incident against the technique catalogue.
    Returns a copy of the incident enriched with:

      mitre_techniques: list of {
          technique_id,
          technique_name,
          tactic,
          matched_descriptions   ← which alert descriptions triggered this entry
      }

    Techniques are deduplicated across all alerts in the incident.
    Results are sorted by tactic then technique ID.
    """
    alerts = incident.get("alerts", [])

    # technique_id → { name, tactic, matched_descriptions (set) }
    found: dict[str, dict[str, Any]] = {}

    for alert in alerts:
        desc = alert.get("description", "")
        for tid, name, tactic, patterns in _COMPILED:
            for pattern in patterns:
                if pattern.search(desc):
                    if tid not in found:
                        found[tid] = {
                            "technique_id":          tid,
                            "technique_name":        name,
                            "tactic":                tactic,
                            "matched_descriptions":  set(),
                        }
                    found[tid]["matched_descriptions"].add(desc)
                    break   # one pattern match per technique per alert is enough

    # Convert sets to sorted lists for JSON serialisation
    techniques = []
    for entry in found.values():
        techniques.append({
            "technique_id":         entry["technique_id"],
            "technique_name":       entry["technique_name"],
            "tactic":               entry["tactic"],
            "matched_descriptions": sorted(entry["matched_descriptions"]),
        })

    # Sort: tactic alphabetically, then technique ID
    techniques.sort(key=lambda t: (t["tactic"], t["technique_id"]))

    return {**incident, "mitre_techniques": techniques}
