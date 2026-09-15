import sys
from dotenv import load_dotenv
from bluf_generator import generate_bluf

load_dotenv()

sample_incident = {
    "incident_id": "INC-001",
    "priority": "HIGH",
    "risk_score": 75,
    "severity": "HIGH",
    "identifiers": {
        "ips": ["10.0.0.5", "192.168.1.50"],
        "hostnames": ["FS-01"],
        "usernames": ["admin"]
    },
    "alerts": [
        {"id": 1, "severity": "HIGH", "source": "IDS", "description": "Port scan detected", "timestamp": "2024-06-01T08:01:00"},
        {"id": 2, "severity": "HIGH", "source": "Firewall", "description": "Outbound connection to known C2 server", "timestamp": "2024-06-01T08:06:00"}
    ],
    "mitre_techniques": [
        {"technique_id": "T1046", "technique_name": "Network Service Discovery", "tactic": "Reconnaissance", "matched_descriptions": ["Port scan detected"]}
    ],
    "score_reasons": ["Multiple high severity alerts"]
}

print("Executing generate_bluf(sample_incident)...")
result = generate_bluf(sample_incident)
print("RESULT RETURNED:")
print("Configured:", result.get("configured"))
print("Model:", result.get("model"))
print("BLUF Text:\n", result.get("bluf"))
