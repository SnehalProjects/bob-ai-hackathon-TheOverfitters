# Setup Guide

> **This file is read by the automated evaluation pipeline. Be precise and complete.**

## Prerequisites

Before you begin, ensure you have the following installed:

- [x] **Python 3.10+** (Python 3.11 recommended)
- [x] **Node.js 18+** & `npm`
- [x] **Git**
- [x] **Google Gemini API Key** (Free API key available at [Google AI Studio](https://aistudio.google.com/app/apikey))

---

## Environment Variables

Copy `src/.env.example` to `src/backend/.env` and fill in your Gemini API key:

```bash
# Windows Command Prompt / PowerShell
copy src\.env.example src\backend\.env

# Linux / macOS
cp src/.env.example src/backend/.env
```

| Variable | Description | Required | Default |
|---|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for AI-powered BLUF summaries | Yes (for AI features) | `your_gemini_api_key_here` |
| `GEMINI_MODEL` | Gemini model identifier | Optional | `gemini-2.5-flash` |
| `APP_PORT` | FastAPI backend server port | Optional | `8000` |
| `APP_ENV` | Application environment mode | Optional | `development` |

> ℹ️ *Note: If `GEMINI_API_KEY` is not set or remains as placeholder text, the backend will automatically generate structured rule-based BLUF summaries so all core functionality remains fully usable.*

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/SnehalProjects/bob-ai-hackathon-TheOverfitters.git
cd bob-ai-hackathon-TheOverfitters

# 2. Set up and activate Python Virtual Environment for Backend
cd src/backend
python -m venv venv

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
venv\Scripts\activate.bat
# On Linux / macOS:
source venv/bin/activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Install React frontend dependencies (in src/frontend)
cd ../frontend
npm install
```

---

## Running the Application

### Step 1: Start the Backend API Server

Open a terminal window and execute:

```bash
cd src/backend
# Activate virtual environment if not already activated:
# Windows: venv\Scripts\activate | Linux/macOS: source venv/bin/activate

uvicorn main:app --reload --port 8000
```

The FastAPI backend will start running at: `http://localhost:8000`  
Swagger API Documentation is available at: `http://localhost:8000/docs`

### Step 2: Start the React Frontend Dashboard

Open a **second terminal window** and execute:

```bash
cd src/frontend
npm start
```

The React threat dashboard will automatically open in your browser at: `http://localhost:3000`

---

## Running Tests & Verifications

The repository includes test scripts in `src/backend` to verify API endpoints, correlation logic, timeline generation, and Gemini AI BLUF synthesis:

```bash
cd src/backend
# Ensure virtual environment is activated

# 1. Test Backend API Endpoints (Health check, Alert upload, Correlator)
python test_endpoint.py

# 2. Test Timeline & Attack Chain Generator
python test_timeline.py

# 3. Test Gemini AI BLUF Summary Generation
python test_gemini.py
```

---

## Quick Demo Walkthrough

To immediately test the application with pre-built SIEM alert data:

1. Open `http://localhost:3000` in your web browser.
2. Click **Upload Alert File** (or drag and drop).
3. Select the provided sample dataset at `src/sample_alerts.csv`.
4. Observe the correlated incident clusters, explainable 0–100 risk scores, MITRE ATT&CK tags, and attack kill-chain timeline.
5. Click **Generate BLUF Summary** on any incident card to view the AI-generated executive report.

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `ModuleNotFoundError: No module named 'fastapi'` | Virtual environment not activated or packages not installed | Run `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Linux/macOS), then run `pip install -r requirements.txt`. |
| `Gemini authentication failed (401/403)` | Missing or invalid `GEMINI_API_KEY` | Get a free key at [aistudio.google.com](https://aistudio.google.com/app/apikey) and set `GEMINI_API_KEY=your_key` in `src/backend/.env`. |
| `ERR_CONNECTION_REFUSED` on frontend | Backend FastAPI server is not running | Ensure `uvicorn main:app --reload --port 8000` is running in your backend terminal window. |
| `Port 8000 is already in use` | Another process is occupying port 8000 | Kill the process running on port 8000 or specify a different port: `uvicorn main:app --reload --port 8080`. |
| `NPM package installation errors` | Node version incompatibility or stale cache | Ensure Node.js 18+ is installed (`node -v`). Run `npm cache clean --force` and `npm install` inside `src/frontend`. |

