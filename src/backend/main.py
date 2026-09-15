import csv
import io

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from correlator import correlate
from bluf_generator import generate_bluf

# Load .env from the same directory as this file (src/backend/.env)
load_dotenv()

app = FastAPI(
    title="Threat Intelligence Correlation API",
    description="Backend for the Threat Intelligence Correlation & Alert Prioritisation Assistant",
    version="0.1.0",
)

# Allow the React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Required CSV columns (case-insensitive)
REQUIRED_COLUMNS = {"id", "severity", "source", "description"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

# Optional columns the correlator can use when present
OPTIONAL_COLUMNS = {"timestamp", "src_ip", "dst_ip", "hostname", "username"}


@app.get("/")
def root():
    return {"message": "Threat Intelligence API is running"}


@app.get("/api/status")
def get_status():
    """Health-check endpoint used by the frontend dashboard."""
    return {
        "status": "ok",
        "service": "Threat Intelligence Correlation API",
        "version": "0.1.0",
    }


@app.get("/api/alerts")
def get_alerts():
    """Return a small set of placeholder alerts for the dashboard."""
    return {
        "alerts": [
            {"id": 1, "severity": "HIGH",   "source": "IDS",      "description": "Port scan detected from 192.168.1.50"},
            {"id": 2, "severity": "MEDIUM", "source": "Firewall", "description": "Unusual outbound traffic on port 4444"},
            {"id": 3, "severity": "LOW",    "source": "SIEM",     "description": "Failed login attempt on admin account"},
        ],
        "total": 3,
    }


@app.post("/api/alerts/upload")
async def upload_alerts(file: UploadFile = File(...)):
    """
    Accept a CSV file, validate it, and return parsed alerts.

    Expected CSV columns (case-insensitive): id, severity, source, description
    Extra columns are preserved and passed through.
    """
    # ── 1. File-type check ────────────────────────────────────────────────────
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a .csv file.",
        )

    # ── 2. Read raw bytes and enforce size limit ──────────────────────────────
    raw = await file.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(raw) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum allowed size is 5 MB.",
        )

    # ── 3. Decode to text ─────────────────────────────────────────────────────
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Could not decode the file. Please save your CSV as UTF-8.",
        )

    # ── 4. Parse CSV ──────────────────────────────────────────────────────────
    reader = csv.DictReader(io.StringIO(text))

    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="The CSV file has no header row.")

    # Normalise column names to lowercase for comparison
    normalised = {col.strip().lower() for col in reader.fieldnames}
    missing = REQUIRED_COLUMNS - normalised
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required column(s): {', '.join(sorted(missing))}. "
                   f"Expected: {', '.join(sorted(REQUIRED_COLUMNS))}.",
        )

    # ── 5. Build alert list ───────────────────────────────────────────────────
    alerts = []
    for i, row in enumerate(reader, start=2):  # start=2 → row 1 is header
        # Strip whitespace from all values
        clean = {k.strip().lower(): v.strip() for k, v in row.items() if k}

        if not any(clean.values()):
            continue  # skip completely blank rows

        alert: dict = {
            "id":          clean.get("id", str(i)),
            "severity":    clean.get("severity", "UNKNOWN").upper(),
            "source":      clean.get("source", ""),
            "description": clean.get("description", ""),
        }
        # Carry optional columns through if present
        for col in OPTIONAL_COLUMNS:
            if col in clean and clean[col]:
                alert[col] = clean[col]

        alerts.append(alert)

    if len(alerts) == 0:
        raise HTTPException(
            status_code=400,
            detail="The CSV file contains no data rows.",
        )

    # ── 6. Summary counts per severity ───────────────────────────────────────
    severity_counts: dict[str, int] = {}
    for alert in alerts:
        sev = alert["severity"]
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    return {
        "total": len(alerts),
        "severity_counts": severity_counts,
        "alerts": alerts,
    }


async def _parse_csv(file: UploadFile) -> list[dict]:
    """Shared CSV parsing used by both /upload and /correlate."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .csv file.")

    raw = await file.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(raw) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File too large. Maximum allowed size is 5 MB.")

    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Could not decode the file. Please save your CSV as UTF-8.")

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="The CSV file has no header row.")

    normalised = {col.strip().lower() for col in reader.fieldnames}
    missing = REQUIRED_COLUMNS - normalised
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required column(s): {', '.join(sorted(missing))}. "
                   f"Expected: {', '.join(sorted(REQUIRED_COLUMNS))}.",
        )

    alerts = []
    for i, row in enumerate(reader, start=2):
        clean = {k.strip().lower(): v.strip() for k, v in row.items() if k}
        if not any(clean.values()):
            continue
        alert: dict = {
            "id":          clean.get("id", str(i)),
            "severity":    clean.get("severity", "UNKNOWN").upper(),
            "source":      clean.get("source", ""),
            "description": clean.get("description", ""),
        }
        for col in OPTIONAL_COLUMNS:
            if col in clean and clean[col]:
                alert[col] = clean[col]
        alerts.append(alert)

    if len(alerts) == 0:
        raise HTTPException(status_code=400, detail="The CSV file contains no data rows.")

    return alerts


@app.post("/api/alerts/correlate")
async def correlate_alerts(file: UploadFile = File(...)):
    """
    Parse a CSV of security alerts and group them into correlated incidents.

    Correlation rules (applied in order, all rule-based — no ML):
      1. Shared source IP
      2. Shared destination IP
      3. Shared hostname
      4. Shared username
      5. Timestamps within 60 minutes of each other

    Returns incidents sorted by severity then alert count.
    """
    alerts = await _parse_csv(file)
    incidents = correlate(alerts)

    severity_counts: dict[str, int] = {}
    for a in alerts:
        sev = a["severity"]
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    return {
        "total_alerts":    len(alerts),
        "total_incidents": len(incidents),
        "severity_counts": severity_counts,
        "incidents":       incidents,
    }


class BLUFRequest(BaseModel):
    incident: dict


@app.post("/api/bluf")
async def generate_bluf_endpoint(request: BLUFRequest):
    """
    Accept a full incident object (as returned by /api/alerts/correlate) and
    return an AI-generated BLUF using the configured AI provider (Gemini).

    Credentials are read from environment variables — never from the request.
    If GEMINI_API_KEY is not set, returns a configuration notice instead of
    raising an error, so the dashboard degrades gracefully.
    """
    try:
        result = generate_bluf(request.incident)
        return result
    except Exception as exc:
        msg = str(exc)
        # Give the frontend a clear, actionable message for common errors
        if "503" in msg or "UNAVAILABLE" in msg:
            detail = "Gemini model is temporarily overloaded. Please wait a few seconds and try again."
        elif "429" in msg or "RESOURCE_EXHAUSTED" in msg:
            detail = "Gemini rate limit reached. Please wait a moment and try again."
        elif "401" in msg or "403" in msg or "API_KEY_INVALID" in msg:
            detail = "Gemini API key is invalid or lacks permission. Check GEMINI_API_KEY in src/backend/.env."
        elif "404" in msg:
            detail = f"Gemini model not found. Check GEMINI_MODEL in src/backend/.env. Detail: {msg[:200]}"
        else:
            detail = f"AI generation failed: {msg[:300]}"
        raise HTTPException(status_code=502, detail=detail)
