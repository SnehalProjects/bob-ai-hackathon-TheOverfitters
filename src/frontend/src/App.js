import React, { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const s = {
  app: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    backgroundColor: "#0f172a",
    minHeight: "100vh",
    color: "#e2e8f0",
    margin: 0,
    padding: 0,
  },
  header: {
    backgroundColor: "#1e293b",
    padding: "16px 32px",
    borderBottom: "1px solid #334155",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerTitle: { margin: 0, fontSize: "20px", fontWeight: 600, color: "#f1f5f9" },
  badge: {
    backgroundColor: "#0ea5e9",
    color: "#fff",
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontWeight: 600,
    letterSpacing: "0.05em",
  },
  main: { maxWidth: "1040px", margin: "0 auto", padding: "32px 24px" },

  /* status bar */
  statusCard: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "14px 20px",
    marginBottom: "28px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  },
  dot: (color) => ({
    width: "10px", height: "10px", borderRadius: "50%",
    backgroundColor: color, flexShrink: 0,
  }),

  /* upload card */
  uploadCard: {
    backgroundColor: "#1e293b",
    border: "2px dashed #334155",
    borderRadius: "10px",
    padding: "28px 24px",
    marginBottom: "28px",
    textAlign: "center",
  },
  uploadCardLabel: {
    display: "block", fontSize: "15px", fontWeight: 600,
    color: "#cbd5e1", marginBottom: "16px",
  },
  fileRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "12px", flexWrap: "wrap",
  },
  fileInput: { display: "none" },
  chooseBtn: {
    backgroundColor: "#334155", color: "#e2e8f0",
    border: "1px solid #475569", borderRadius: "6px",
    padding: "8px 18px", fontSize: "14px", cursor: "pointer",
  },
  uploadBtn: (disabled) => ({
    backgroundColor: disabled ? "#1e3a5f" : "#0ea5e9",
    color: disabled ? "#475569" : "#fff",
    border: "none", borderRadius: "6px",
    padding: "8px 20px", fontSize: "14px", fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
  }),
  fileName: { fontSize: "13px", color: "#94a3b8" },
  hint: { marginTop: "12px", fontSize: "12px", color: "#475569" },

  /* banners */
  errorBanner: {
    backgroundColor: "#450a0a", border: "1px solid #7f1d1d",
    color: "#fca5a5", padding: "12px 16px", borderRadius: "6px",
    marginBottom: "20px", fontSize: "14px",
  },
  successBanner: {
    backgroundColor: "#052e16", border: "1px solid #166534",
    color: "#86efac", padding: "12px 16px", borderRadius: "6px",
    marginBottom: "20px", fontSize: "14px",
  },

  /* tabs */
  tabRow: {
    display: "flex", gap: "4px",
    borderBottom: "1px solid #334155", marginBottom: "24px",
  },
  tab: (active) => ({
    padding: "8px 20px", fontSize: "14px", fontWeight: 600,
    cursor: "pointer", border: "none",
    borderBottom: active ? "2px solid #0ea5e9" : "2px solid transparent",
    backgroundColor: "transparent",
    color: active ? "#0ea5e9" : "#94a3b8",
    marginBottom: "-1px",
  }),

  /* summary stat cards */
  statsRow: { display: "flex", gap: "14px", marginBottom: "24px", flexWrap: "wrap" },
  statCard: (color) => ({
    flex: "1 1 110px", backgroundColor: "#1e293b",
    border: `1px solid ${color}`, borderRadius: "8px",
    padding: "14px 18px", textAlign: "center",
  }),
  statNumber: (color) => ({ fontSize: "26px", fontWeight: 700, color }),
  statLabel: {
    fontSize: "11px", color: "#94a3b8", marginTop: "4px",
    textTransform: "uppercase", letterSpacing: "0.07em",
  },

  /* incident card */
  incidentCard: (priority) => {
    const border = { CRITICAL: "#7f1d1d", HIGH: "#7c2d12", MEDIUM: "#713f12", LOW: "#14532d", UNKNOWN: "#334155" };
    return {
      backgroundColor: "#1e293b",
      border: `1px solid ${border[priority] || border.UNKNOWN}`,
      borderRadius: "8px",
      marginBottom: "12px",
      overflow: "hidden",
    };
  },
  incidentHeader: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "14px 18px", cursor: "pointer", userSelect: "none",
  },
  incidentTitle: { fontWeight: 600, fontSize: "15px", flex: 1 },
  incidentMeta: { fontSize: "13px", color: "#94a3b8" },
  incidentBody: { padding: "0 18px 16px", borderTop: "1px solid #334155" },

  /* priority badge */
  priorityBadge: (priority) => {
    const map = {
      CRITICAL: { bg: "#450a0a", text: "#fca5a5", border: "#7f1d1d" },
      HIGH:     { bg: "#431407", text: "#fdba74", border: "#7c2d12" },
      MEDIUM:   { bg: "#422006", text: "#fcd34d", border: "#713f12" },
      LOW:      { bg: "#052e16", text: "#86efac", border: "#14532d" },
    };
    const c = map[priority] || { bg: "#1e293b", text: "#94a3b8", border: "#334155" };
    return {
      backgroundColor: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      padding: "2px 8px", borderRadius: "4px",
      fontWeight: 700, fontSize: "11px", letterSpacing: "0.05em",
    };
  },

  /* score bar */
  scoreBarWrap: {
    backgroundColor: "#0f172a", borderRadius: "4px",
    height: "8px", width: "80px", overflow: "hidden", flexShrink: 0,
  },
  scoreBarFill: (score) => {
    const color =
      score >= 80 ? "#f87171" :
      score >= 60 ? "#fb923c" :
      score >= 40 ? "#fcd34d" : "#4ade80";
    return { height: "100%", width: `${score}%`, backgroundColor: color, borderRadius: "4px" };
  },
  scoreText: { fontSize: "13px", fontWeight: 700, color: "#cbd5e1", flexShrink: 0, minWidth: "32px", textAlign: "right" },

  /* scoring reasons */
  reasonsList: { margin: "8px 0 12px", padding: 0, listStyle: "none" },
  reasonItem: {
    fontSize: "12px", color: "#94a3b8", padding: "2px 0",
    display: "flex", alignItems: "flex-start", gap: "6px",
  },
  reasonDot: { color: "#475569", flexShrink: 0, marginTop: "1px" },

  /* MITRE ATT&CK table */
  mitreTable: { width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "12px" },
  mitreTh: {
    textAlign: "left", padding: "6px 10px",
    borderBottom: "1px solid #1e3a5f",
    color: "#3b82f6", fontWeight: 700, fontSize: "10px",
    textTransform: "uppercase", letterSpacing: "0.08em",
    backgroundColor: "#0c1a2e",
  },
  mitreTd: { padding: "7px 10px", borderBottom: "1px solid #0f172a", verticalAlign: "top" },
  mitreId: {
    fontFamily: "monospace", fontSize: "11px", fontWeight: 700,
    color: "#60a5fa", whiteSpace: "nowrap",
  },
  mitreTactic: {
    display: "inline-block",
    backgroundColor: "#1e3a5f", color: "#93c5fd",
    border: "1px solid #1d4ed8",
    padding: "1px 6px", borderRadius: "3px",
    fontSize: "10px", fontWeight: 600,
    whiteSpace: "nowrap",
  },
  mitreMatchedDesc: { fontSize: "11px", color: "#64748b", marginTop: "2px" },

  /* identifier pills row */
  pillRow: { display: "flex", gap: "6px", flexWrap: "wrap", padding: "10px 0 8px" },
  pill: (color) => ({
    backgroundColor: color + "22",
    border: `1px solid ${color}55`,
    color: color,
    padding: "2px 8px", borderRadius: "4px",
    fontSize: "12px", fontWeight: 600,
  }),

  /* nested alert table */
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px", marginTop: "8px" },
  th: {
    textAlign: "left", padding: "8px 12px",
    borderBottom: "1px solid #334155",
    color: "#64748b", fontWeight: 600, fontSize: "11px",
    textTransform: "uppercase", letterSpacing: "0.07em",
  },
  td: { padding: "9px 12px", borderBottom: "1px solid #0f172a", color: "#e2e8f0" },
  severityBadge: (sev) => {
    const map = {
      HIGH:    { bg: "#450a0a", text: "#fca5a5" },
      MEDIUM:  { bg: "#431407", text: "#fdba74" },
      LOW:     { bg: "#052e16", text: "#86efac" },
      UNKNOWN: { bg: "#1e293b", text: "#94a3b8" },
    };
    const c = map[sev] || map.UNKNOWN;
    return { backgroundColor: c.bg, color: c.text, padding: "2px 7px", borderRadius: "4px", fontWeight: 600, fontSize: "11px" };
  },

  emptyState: { textAlign: "center", padding: "48px", color: "#475569" },

  /* raw alerts table view */
  sectionTitle: { fontSize: "15px", fontWeight: 600, marginBottom: "14px", color: "#cbd5e1" },

  /* BLUF panel */
  blufBtn: (loading) => ({
    marginTop: "16px",
    backgroundColor: loading ? "#1e3a5f" : "#7c3aed",
    color: loading ? "#475569" : "#fff",
    border: "none", borderRadius: "6px",
    padding: "8px 18px", fontSize: "13px", fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", gap: "6px",
  }),
  blufPanel: {
    marginTop: "16px",
    backgroundColor: "#0c1a2e",
    border: "1px solid #4c1d95",
    borderRadius: "8px",
    padding: "16px 20px",
  },
  blufHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: "10px",
  },
  blufTitle: {
    fontSize: "11px", fontWeight: 700, color: "#a78bfa",
    textTransform: "uppercase", letterSpacing: "0.08em",
  },
  blufModel: { fontSize: "10px", color: "#475569" },
  blufText: {
    whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.7",
    color: "#e2e8f0", fontFamily: "inherit",
  },
  blufError: {
    marginTop: "12px", fontSize: "13px", color: "#fca5a5",
    backgroundColor: "#450a0a", border: "1px solid #7f1d1d",
    borderRadius: "6px", padding: "10px 14px",
  },
  blufNotConfigured: {
    marginTop: "12px", fontSize: "13px", color: "#fcd34d",
    backgroundColor: "#422006", border: "1px solid #92400e",
    borderRadius: "6px", padding: "10px 14px",
    whiteSpace: "pre-wrap",
  },
};

const SEV_ORDER     = ["HIGH", "MEDIUM", "LOW"];
const SEV_COLOUR    = { HIGH: "#f87171", MEDIUM: "#fb923c", LOW: "#4ade80", TOTAL: "#38bdf8", INCIDENTS: "#a78bfa" };
const PRIORITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

/* ─────────────────────────────────────────────
   IncidentCard — collapsible
───────────────────────────────────────────── */
function IncidentCard({ incident }) {
  const [open,       setOpen]       = useState(false);
  const [blufState,  setBlufState]  = useState("idle");   // idle | loading | done | error
  const [blufResult, setBlufResult] = useState(null);     // { bluf, model, configured }
  const [blufError,  setBlufError]  = useState(null);

  const {
    incident_id, priority, severity, risk_score, score_reasons,
    alert_count, identifiers, alerts, mitre_techniques,
  } = incident;

  const allIps     = identifiers.ips       || [];
  const allHosts   = identifiers.hostnames || [];
  const allUsers   = identifiers.usernames || [];
  const reasons    = score_reasons         || [];
  const techniques = mitre_techniques      || [];

  async function handleGenerateBluf() {
    setBlufState("loading");
    setBlufError(null);
    try {
      const res  = await fetch("/api/bluf", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ incident }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Unknown error from backend");
      }
      setBlufResult(data);
      setBlufState("done");
    } catch (err) {
      setBlufError(err.message);
      setBlufState("error");
    }
  }

  return (
    <div style={s.incidentCard(priority)}>
      {/* ── collapsed header ── */}
      <div style={s.incidentHeader} onClick={() => setOpen((o) => !o)}>
        {/* priority badge */}
        <span style={s.priorityBadge(priority)}>{priority}</span>

        {/* incident ID */}
        <span style={s.incidentTitle}>{incident_id}</span>

        {/* score bar + number */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={s.scoreBarWrap}>
            <div style={s.scoreBarFill(risk_score)} />
          </div>
          <span style={s.scoreText}>{risk_score}</span>
        </div>

        {/* alert count */}
        <span style={s.incidentMeta}>{alert_count} alert{alert_count !== 1 ? "s" : ""}</span>

        {/* chevron */}
        <span style={{ color: "#475569", fontSize: "13px" }}>{open ? "▲" : "▼"}</span>
      </div>

      {/* ── expanded body ── */}
      {open && (
        <div style={s.incidentBody}>

          {/* MITRE ATT&CK techniques section */}
          {techniques.length > 0 && (
            <div style={{ marginTop: "12px", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
                MITRE ATT&amp;CK Techniques
              </div>
              <table style={s.mitreTable}>
                <thead>
                  <tr>
                    <th style={s.mitreTh}>Technique ID</th>
                    <th style={s.mitreTh}>Technique Name</th>
                    <th style={s.mitreTh}>Tactic</th>
                    <th style={s.mitreTh}>Matched Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {techniques.map((t) => (
                    <tr key={t.technique_id}>
                      <td style={s.mitreTd}>
                        <span style={s.mitreId}>{t.technique_id}</span>
                      </td>
                      <td style={{ ...s.mitreTd, color: "#e2e8f0" }}>{t.technique_name}</td>
                      <td style={s.mitreTd}>
                        <span style={s.mitreTactic}>{t.tactic}</span>
                      </td>
                      <td style={s.mitreTd}>
                        {t.matched_descriptions.map((d, i) => (
                          <div key={i} style={s.mitreMatchedDesc}>› {d}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* score reasoning section */}
          {reasons.length > 0 && (
            <div style={{ marginTop: "12px", marginBottom: "4px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>
                Risk Score Breakdown
              </div>
              <ul style={s.reasonsList}>
                {reasons.map((r, i) => (
                  <li key={i} style={s.reasonItem}>
                    <span style={s.reasonDot}>›</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* identifier pills */}
          {(allIps.length > 0 || allHosts.length > 0 || allUsers.length > 0) && (
            <div style={s.pillRow}>
              {allIps.map((ip) => <span key={ip} style={s.pill("#38bdf8")}>IP: {ip}</span>)}
              {allHosts.map((h) => <span key={h}  style={s.pill("#a78bfa")}>HOST: {h}</span>)}
              {allUsers.map((u) => <span key={u}  style={s.pill("#34d399")}>USER: {u}</span>)}
            </div>
          )}

          {/* alert rows */}
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
            Related Alerts
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>ID</th>
                <th style={s.th}>Sev</th>
                <th style={s.th}>Source</th>
                <th style={s.th}>Description</th>
                <th style={s.th}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, idx) => (
                <tr key={idx}>
                  <td style={s.td}>{a.id}</td>
                  <td style={s.td}><span style={s.severityBadge(a.severity)}>{a.severity}</span></td>
                  <td style={s.td}>{a.source}</td>
                  <td style={s.td}>{a.description}</td>
                  <td style={s.td}>{a.timestamp || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── BLUF generation ── */}
          <button
            onClick={handleGenerateBluf}
            disabled={blufState === "loading"}
            style={s.blufBtn(blufState === "loading")}
          >
            {blufState === "loading" ? "Generating…" : "✦ Generate AI BLUF"}
          </button>

          {blufState === "error" && (
            <div style={s.blufError}>⚠ {blufError}</div>
          )}

          {blufState === "done" && blufResult && (
            <div style={s.blufPanel}>
              <div style={s.blufHeader}>
                <span style={s.blufTitle}>AI-Generated BLUF — {incident_id}</span>
                <span style={s.blufModel}>Model: {blufResult.model}</span>
              </div>
              {!blufResult.configured ? (
                <div style={s.blufNotConfigured}>{blufResult.bluf}</div>
              ) : (
                <pre style={s.blufText}>{blufResult.bluf}</pre>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   App
───────────────────────────────────────────── */
export default function App() {
  const [apiStatus,    setApiStatus]    = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState(null);
  const [result,       setResult]       = useState(null); // correlate response
  const [activeTab,    setActiveTab]    = useState("incidents");

  const fileInputRef = useRef(null);

  /* check backend on mount */
  useEffect(() => {
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => setApiStatus("ok"))
      .catch(() => setApiStatus("error"));
  }, []);

  function handleFileChange(e) {
    const file = e.target.files[0] || null;
    setSelectedFile(file);
    setUploadError(null);
    setResult(null);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please select a .csv file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);
    setUploadError(null);
    setResult(null);

    try {
      const res  = await fetch("/api/alerts/correlate", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        const msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        setUploadError(msg);
      } else {
        setResult(data);
        setActiveTab("incidents");
      }
    } catch {
      setUploadError("Network error — make sure the backend is running on port 8000.");
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    setSelectedFile(null);
    setResult(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* derived */
  const statusColour =
    apiStatus === "ok" ? "#22c55e" : apiStatus === "error" ? "#ef4444" : "#94a3b8";
  const statusLabel =
    apiStatus === "ok"    ? "Backend connected" :
    apiStatus === "error" ? "Backend unreachable — start uvicorn on port 8000" :
    "Connecting…";
  const uploadDisabled = !selectedFile || uploading || apiStatus !== "ok";

  /* ── Render ── */
  return (
    <div style={s.app}>
      <header style={s.header}>
        <h1 style={s.headerTitle}>Threat Intelligence Dashboard</h1>
        <span style={s.badge}>HACKATHON v0.1</span>
      </header>

      <main style={s.main}>

        {/* status bar */}
        <div style={s.statusCard}>
          <div style={s.dot(statusColour)} />
          <span>{statusLabel}</span>
        </div>

        {/* upload card */}
        <div style={s.uploadCard}>
          <label style={s.uploadCardLabel}>Upload Security Alerts CSV</label>
          <div style={s.fileRow}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={s.fileInput}
              id="csv-input"
              onChange={handleFileChange}
            />
            <label htmlFor="csv-input" style={s.chooseBtn}>Choose file</label>
            <span style={s.fileName}>{selectedFile ? selectedFile.name : "No file selected"}</span>
            <button onClick={handleUpload} disabled={uploadDisabled} style={s.uploadBtn(uploadDisabled)}>
              {uploading ? "Analysing…" : "Analyse & Correlate"}
            </button>
            {result && <button onClick={handleClear} style={s.chooseBtn}>Clear</button>}
          </div>
          <p style={s.hint}>
            Required: <code>id, severity, source, description</code> &nbsp;·&nbsp;
            Optional (for better correlation): <code>timestamp, src_ip, dst_ip, hostname, username</code>
          </p>
        </div>

        {/* error banner */}
        {uploadError && <div style={s.errorBanner}>⚠ {uploadError}</div>}

        {/* results */}
        {result && (() => {
          const { total_alerts, total_incidents, incidents } = result;

          // Count incidents by priority (derived client-side from incidents array)
          const priorityCounts = {};
          incidents.forEach((inc) => {
            priorityCounts[inc.priority] = (priorityCounts[inc.priority] || 0) + 1;
          });

          const PRIORITY_COLOUR = { CRITICAL: "#f87171", HIGH: "#fb923c", MEDIUM: "#fcd34d", LOW: "#4ade80" };

          return (
            <>
              <div style={s.successBanner}>
                ✓ Correlated <strong>{total_alerts}</strong> alerts into{" "}
                <strong>{total_incidents}</strong> incident{total_incidents !== 1 ? "s" : ""} from{" "}
                <em>{selectedFile?.name}</em>
              </div>

              {/* summary stat cards */}
              <div style={s.statsRow}>
                <div style={s.statCard(SEV_COLOUR.TOTAL)}>
                  <div style={s.statNumber(SEV_COLOUR.TOTAL)}>{total_alerts}</div>
                  <div style={s.statLabel}>Alerts</div>
                </div>
                <div style={s.statCard(SEV_COLOUR.INCIDENTS)}>
                  <div style={s.statNumber(SEV_COLOUR.INCIDENTS)}>{total_incidents}</div>
                  <div style={s.statLabel}>Incidents</div>
                </div>
                {PRIORITY_ORDER.map((p) =>
                  priorityCounts[p] ? (
                    <div key={p} style={s.statCard(PRIORITY_COLOUR[p])}>
                      <div style={s.statNumber(PRIORITY_COLOUR[p])}>{priorityCounts[p]}</div>
                      <div style={s.statLabel}>{p}</div>
                    </div>
                  ) : null
                )}
              </div>

              {/* tab bar */}
              <div style={s.tabRow}>
                <button style={s.tab(activeTab === "incidents")} onClick={() => setActiveTab("incidents")}>
                  Incidents ({total_incidents})
                </button>
                <button style={s.tab(activeTab === "all")} onClick={() => setActiveTab("all")}>
                  All Alerts ({total_alerts})
                </button>
              </div>

              {/* incidents tab */}
              {activeTab === "incidents" && (
                <>
                  <h2 style={s.sectionTitle}>Correlated Incidents</h2>
                  {incidents.map((inc) => (
                    <IncidentCard key={inc.incident_id} incident={inc} />
                  ))}
                </>
              )}

              {/* all alerts tab */}
              {activeTab === "all" && (
                <>
                  <h2 style={s.sectionTitle}>All Alerts</h2>
                  <table style={{ ...s.table, fontSize: "14px" }}>
                    <thead>
                      <tr>
                        <th style={s.th}>ID</th>
                        <th style={s.th}>Severity</th>
                        <th style={s.th}>Source</th>
                        <th style={s.th}>Description</th>
                        <th style={s.th}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidents.flatMap((inc) =>
                        inc.alerts.map((a, idx) => (
                          <tr key={`${inc.incident_id}-${idx}`}>
                            <td style={s.td}>{a.id}</td>
                            <td style={s.td}><span style={s.severityBadge(a.severity)}>{a.severity}</span></td>
                            <td style={s.td}>{a.source}</td>
                            <td style={s.td}>{a.description}</td>
                            <td style={s.td}>{a.timestamp || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </>
          );
        })()}

        {/* empty state */}
        {!result && !uploadError && (
          <div style={s.emptyState}>
            Upload a CSV file above to correlate and view security incidents.
          </div>
        )}

      </main>
    </div>
  );
}
