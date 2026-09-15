# 🚀 Threat Intelligence Correlation & Alert Prioritisation Assistant

> **AI-powered assistant that correlates SIEM alerts, assigns explainable risk scores, maps to MITRE ATT&CK, and generates concise BLUF summaries for defence analysts.**

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | TheOverfitters |
| **Track** | AI |
| **Team Lead** | Sejal Lathigara — sejallathigara1008@gmail.com |
| **Members** | Snehal Mishra, Raj Joshi, Mahek Trambadia |

---

## 🎯 Problem Statement

> In 2–3 sentences: What problem does your project solve? Who experiences this problem?

Security and defence analysts receive thousands of alerts every day from SIEM systems, cyber sensors, intelligence feeds, and reports in different formats, making it difficult to identify genuine threats quickly. Missing a critical threat can have serious consequences, while investigating large numbers of false positives wastes valuable analyst time.

---

## 💡 Solution

> In 2–3 sentences: What did you build? How does it solve the problem above?

We built an AI-powered Threat Intelligence Correlation & Alert Prioritisation Assistant that groups related alerts, assigns an explainable risk/priority score, maps suspicious activities to MITRE ATT&CK, and identifies the most important incidents for investigation. It then uses Gemini AI to generate a concise BLUF (Bottom Line Up Front) summary containing the threat, evidence, priority, MITRE techniques, and recommended actions for analysts and commanders.

---

## ✨ Key Features

- **Feature 1: Alert Correlation** — Groups related security alerts based on common IPs, hostnames, usernames, and time windows.
- **Feature 2: Explainable Risk Scoring** — Calculates a 0–100 risk score and classifies incidents as Critical, High, Medium, or Low with clear reasons.
- **Feature 3: MITRE ATT&CK Mapping** — Maps suspicious activities to relevant MITRE ATT&CK techniques such as PowerShell, Phishing, and Credential Dumping.
- **Feature 4: AI-Powered BLUF Generation** — Uses Gemini AI to generate a concise Bottom Line Up Front (BLUF) containing the threat, evidence, priority, MITRE techniques, and recommended actions.
- **Feature 5: Prioritized Threat Dashboard** — Presents the most important incidents first, helping analysts focus on high-priority threats and reduce alert overload.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python, JavaScript, HTML, CSS |
| **Frameworks** | FastAPI, React.js |
| **IBM Technologies** | IBM Bob |
| **AI / APIs** | Google Gemini API, Google GenAI SDK |
| **Databases** | None — file-based prototype |
| **Other** | Git, GitHub, GitHub Actions, CSV, MITRE ATT&CK |

---

## 📁 Repository Structure

```
.
├── demo/                 # Demo artifacts
│   ├── screenshots/      # App screenshots
│   ├── demo-video-link.txt
│   └── live-demo-url.txt
├── docs/                 # Written documentation
│   ├── architecture.md
│   ├── problem-statement.md
│   ├── setup-guide.md
│   ├── solution-overview.md
│   └── template-guide.md
├── presentation/         # Slide deck & presentation files
├── src/                  # All source code
│   ├── backend/          # FastAPI server, alert correlation, risk scoring & Gemini BLUF generator
│   │   ├── bluf_generator.py
│   │   ├── correlator.py
│   │   ├── main.py
│   │   ├── mitre.py
│   │   ├── scorer.py
│   │   └── requirements.txt
│   ├── frontend/         # React.js Web Dashboard UI
│   │   ├── public/
│   │   ├── src/
│   │   └── package.json
│   ├── .env.example
│   └── sample_alerts.csv # Sample SIEM alerts dataset
├── CONTRIBUTING.md
├── README.md
└── submission.yaml       # Structured submission metadata
```

---

## ⚡ How to Run

> **Copy these exact steps from your [`docs/setup-guide.md`](docs/setup-guide.md)**

```bash
# 1. Clone the repo
git clone https://github.com/SnehalProjects/bob-ai-hackathon-TheOverfitters.git
cd bob-ai-hackathon-TheOverfitters

# 2. Set up and run Backend
cd src/backend
python -m venv venv
# On Windows: venv\Scripts\activate | On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env to add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000

# 3. Set up and run Frontend (in a separate terminal)
cd src/frontend
npm install
npm start
```

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/](presentation/) |

---

## ⚠️ Known Limitations

> Be honest — judges appreciate transparency over overclaiming.

- [Limitation 1: File-based prototype using sample CSV data rather than real-time SIEM network streams]
- [Limitation 2: Gemini BLUF generation requires an active internet connection and valid Gemini API key]
- [Limitation 3: Authentication is mocked — not production-ready]

---

## 🏅 What We're Most Proud Of

> Tell the judges what part of your submission is strongest and worth paying close attention to.

[Automated correlation engine combining rule-based heuristics with Gemini AI for instant threat summarization and explainable risk scoring.]

---
