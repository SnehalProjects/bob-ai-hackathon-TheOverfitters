import React, { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   Global styles
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { font-size: 14px; }

  body {
    background: #111318;
    color: #c9d1d9;
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  code, .mono {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes dotPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }

  .fade-in { animation: fadeSlideIn 0.2s ease both; }

  button { cursor: pointer; }
  button:disabled { cursor: not-allowed; }

  /* Row hover */
  .tr-hover:hover td { background: rgba(255,255,255,0.025); }

  /* Card header hover */
  .card-header:hover { background: rgba(255,255,255,0.02); }

  /* Chip copy icon */
  .ioc-chip .copy-btn { opacity: 0; transition: opacity 0.15s; }
  .ioc-chip:hover .copy-btn { opacity: 1; }

  /* Tab underline */
  .tab-item { border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s; }
  .tab-item:hover { color: #e6edf3 !important; }
  .tab-item.active { color: #e6edf3 !important; border-color: #4493f8 !important; }

  /* Filter pill */
  .filter-pill { transition: background 0.15s, color 0.15s, border-color 0.15s; }
  .filter-pill:hover { border-color: #4493f8 !important; color: #c9d1d9 !important; }
  .filter-pill.active { background: rgba(68,147,248,0.12) !important; border-color: #4493f8 !important; color: #79c0ff !important; }

  /* Buttons */
  .btn-ghost:hover { background: rgba(255,255,255,0.05) !important; }
  .btn-primary:hover:not(:disabled) { background: #1f6feb !important; }

  /* Score marker transition */
  .score-marker { transition: left 0.3s ease; }

  /* BLUF section */
  .bluf-section { border-left: 2px solid #30363d; padding-left: 14px; margin-bottom: 18px; }
  .bluf-section:last-child { margin-bottom: 0; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
`;

if (!document.getElementById("app-css")) {
  const s = document.createElement("style");
  s.id = "app-css";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   Design tokens — muted, professional
───────────────────────────────────────────── */
const T = {
  // Backgrounds
  bg:        "#111318",
  surface:   "#161b22",
  surfaceEl: "#1c2128",
  surfaceHov:"#21262d",

  // Borders
  border:    "#30363d",
  borderSub: "#21262d",

  // Text
  text:      "#e6edf3",
  textSec:   "#8b949e",
  textDis:   "#484f58",

  // Accent (single, restrained blue)
  accent:    "#4493f8",
  accentMut: "#1f6feb",

  // Severity — muted, not neon
  CRITICAL:  "#e05252",   // muted red
  HIGH:      "#d18b4a",   // muted amber
  MEDIUM:    "#c9a227",   // muted yellow
  LOW:       "#3fb950",   // muted green

  // Tactic colors — desaturated
  tactic: {
    "Reconnaissance":       "#5aade8",
    "Initial Access":       "#d18b4a",
    "Execution":            "#9d6fe8",
    "Persistence":          "#c76070",
    "Privilege Escalation": "#d47843",
    "Defense Evasion":      "#88a833",
    "Credential Access":    "#c9a227",
    "Discovery":            "#4493f8",
    "Lateral Movement":     "#c06090",
    "Collection":           "#8b6fe8",
    "Command and Control":  "#e05252",
    "Exfiltration":         "#d18b4a",
    "Impact":               "#c94040",
  },
};

const PRIORITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function sevColor(s) {
  return { CRITICAL: T.CRITICAL, HIGH: T.HIGH, MEDIUM: T.MEDIUM, LOW: T.LOW }[s] || T.textDis;
}

function tacticColor(t) {
  return T.tactic[t] || T.textSec;
}

/* ─────────────────────────────────────────────
   Utility components
───────────────────────────────────────────── */

/* Severity dot + label badge */
function SevBadge({ sev }) {
  const c = sevColor(sev);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "11px", fontWeight: 500,
      color: c,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, flexShrink: 0, display: "inline-block" }} />
      {sev}
    </span>
  );
}

/* Priority pill */
function PriorityPill({ priority }) {
  const c = sevColor(priority);
  return (
    <span style={{
      display: "inline-block",
      fontSize: "10px", fontWeight: 600,
      color: c,
      background: c + "18",
      border: `1px solid ${c}30`,
      borderRadius: "4px",
      padding: "1px 7px",
      letterSpacing: "0.03em",
      flexShrink: 0,
    }}>{priority}</span>
  );
}

/* Segmented score bar */
function ScoreBar({ score }) {
  const pct = Math.min(Math.max(score, 0), 100);
  const barColor =
    pct >= 80 ? T.CRITICAL :
    pct >= 60 ? T.HIGH :
    pct >= 40 ? T.MEDIUM : T.LOW;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: 88, height: 4, background: T.borderSub, borderRadius: 2, flexShrink: 0 }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${pct}%`, background: barColor,
          borderRadius: 2, transition: "width 0.4s ease",
        }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 600, color: barColor, minWidth: 24, fontFamily: "'JetBrains Mono', monospace" }}>
        {score}
      </span>
    </div>
  );
}

/* Sparkline — alert cadence over time */
function Sparkline({ alerts }) {
  if (!alerts || alerts.length < 2) return null;

  const pts = alerts
    .map(a => { const d = new Date(a.timestamp); return isNaN(d) ? null : { t: d.getTime(), s: a.severity }; })
    .filter(Boolean)
    .sort((a, b) => a.t - b.t);

  if (pts.length < 2) return null;

  const W = 64, H = 20;
  const minT = pts[0].t, maxT = pts[pts.length - 1].t;
  const range = maxT - minT || 1;
  const yMap = { HIGH: 2, CRITICAL: 2, MEDIUM: 9, LOW: 16 };

  const coords = pts.map(p => ({
    x: ((p.t - minT) / range) * (W - 4) + 2,
    y: yMap[p.s] ?? 9,
    c: sevColor(p.s),
  }));

  const line = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg width={W} height={H} style={{ flexShrink: 0, opacity: 0.6 }}>
      <path d={line} fill="none" stroke={T.border} strokeWidth="1.5" />
      {coords.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill={p.c} />
      ))}
    </svg>
  );
}

/* IOC chip with copy */
function IocChip({ type, value }) {
  const [copied, setCopied] = useState(false);
  const typeColor = { IP: T.accent, HOST: "#9d6fe8", USER: T.LOW }[type] || T.textSec;

  function copy(e) {
    e.stopPropagation();
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }

  return (
    <span className="ioc-chip" style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      border: `1px solid ${T.border}`,
      borderRadius: "4px",
      padding: "2px 8px",
      fontSize: "11px",
      background: T.surfaceEl,
      userSelect: "none",
    }}>
      <span style={{ color: T.textDis, fontSize: "10px" }}>{type}</span>
      <span className="mono" style={{ color: T.text }}>{value}</span>
      <span
        className="copy-btn mono"
        onClick={copy}
        title="Copy"
        style={{ color: copied ? T.LOW : T.textDis, fontSize: "10px", cursor: "pointer", marginLeft: 2 }}
      >{copied ? "✓" : "⎘"}</span>
    </span>
  );
}

/* Status indicator */
function StatusDot({ status }) {
  const color = status === "ok" ? T.LOW : status === "error" ? T.CRITICAL : T.textDis;
  const label = status === "ok" ? "API connected" : status === "error" ? "API unreachable" : "Connecting…";
  const anim  = status === null ? "dotPulse 1.4s ease infinite" : "none";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", animation: anim }} />
      <span style={{ fontSize: "12px", color: T.textSec }}>{label}</span>
    </div>
  );
}

/* Section label */
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 600, color: T.textDis, letterSpacing: "0.05em", marginBottom: 10, textTransform: "uppercase" }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   BLUF Panel
───────────────────────────────────────────── */
function BlufPanel({ incidentId, result }) {
  const raw   = result?.bluf  || "";
  const model = result?.model || "";

  const SECTIONS = [
    { key: "BOTTOM LINE",             label: "Bottom Line",           accent: T.CRITICAL },
    { key: "THREAT SUMMARY",          label: "Threat Summary",        accent: T.HIGH },
    { key: "EVIDENCE",                label: "Evidence",              accent: T.MEDIUM },
    { key: "MITRE ATT&CK TECHNIQUES", label: "MITRE ATT&CK",         accent: T.accent },
    { key: "PRIORITY & RISK SCORE",   label: "Priority & Risk Score", accent: T.LOW },
    { key: "RECOMMENDED ACTIONS",     label: "Recommended Actions",   accent: "#9d6fe8" },
  ];

  // Parse sections from raw text
  const parsed = {};
  let rem = raw;
  [...SECTIONS].reverse().forEach(({ key }) => {
    const re = new RegExp(`${key.replace(/[&()]/g, c => `\\${c === "&" ? "&" : c}`)}\\s*:`, "i");
    const idx = rem.search(re);
    if (idx !== -1) {
      parsed[key] = rem.slice(idx).replace(re, "").trim();
      rem = rem.slice(0, idx);
    }
  });
  const hasSections = Object.keys(parsed).length > 0;

  const ts = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

  return (
    <div className="fade-in" style={{
      marginTop: 16,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px",
        background: T.surfaceEl,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: "11px", fontWeight: 600, color: T.text,
          }}>Intelligence Brief</span>
          <span className="mono" style={{ fontSize: "11px", color: T.textSec }}>{incidentId}</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: T.textDis }}>{model}</span>
          <span className="mono" style={{ fontSize: "10px", color: T.textDis }}>{ts}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 20px", background: T.surface }}>
        {hasSections ? SECTIONS.map(({ key, label, accent }) => {
          const content = parsed[key];
          if (!content) return null;
          const isMain = key === "BOTTOM LINE";
          return (
            <div key={key} className="bluf-section" style={{ borderLeftColor: accent + "60" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: accent, letterSpacing: "0.04em", marginBottom: 4, textTransform: "uppercase" }}>
                {label}
              </div>
              <div style={{
                fontSize: isMain ? "14px" : "13px",
                fontWeight: isMain ? 600 : 400,
                color: isMain ? T.text : T.textSec,
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}>{content}</div>
            </div>
          );
        }) : (
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "13px", color: T.textSec, lineHeight: 1.65 }}>{raw}</pre>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   IncidentCard
───────────────────────────────────────────── */
function IncidentCard({ incident, fpFilter }) {
  const [open,       setOpen]       = useState(false);
  const [blufState,  setBlufState]  = useState("idle");
  const [blufResult, setBlufResult] = useState(null);
  const [blufError,  setBlufError]  = useState(null);
  const [tag,        setTag]        = useState(null); // null | "fp" | "confirmed"

  const {
    incident_id, priority, severity, risk_score, score_reasons = [],
    alert_count, identifiers = {}, alerts = [], mitre_techniques = [],
  } = incident;

  const ips   = identifiers.ips       || [];
  const hosts = identifiers.hostnames || [];
  const users = identifiers.usernames || [];

  // Filter
  if (fpFilter === "fp"        && tag !== "fp")        return null;
  if (fpFilter === "confirmed" && tag !== "confirmed") return null;

  async function fetchBluf(e) {
    e.stopPropagation();
    if (blufState === "loading") return;
    setBlufState("loading");
    setBlufError(null);
    try {
      const res  = await fetch("http://127.0.0.1:8000/api/bluf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Backend error");
      setBlufResult(data);
      setBlufState("done");
    } catch (err) {
      setBlufError(err.message);
      setBlufState("error");
    }
  }

  const pc = sevColor(priority);

  return (
    <div style={{
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      marginBottom: 8,
      overflow: "hidden",
      background: T.surface,
    }}>
      {/* ── Row header ── */}
      <div
        className="card-header"
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "11px 16px",
          cursor: "pointer", userSelect: "none",
        }}
        onClick={() => setOpen(o => !o)}
      >
        {/* Priority */}
        <PriorityPill priority={priority} />

        {/* ID */}
        <span className="mono" style={{ fontSize: "12px", color: T.textSec, flexShrink: 0, minWidth: 72 }}>
          {incident_id}
        </span>

        {/* Score bar */}
        <ScoreBar score={risk_score} />

        {/* Severity */}
        <SevBadge sev={severity} />

        {/* Sparkline */}
        <Sparkline alerts={alerts} />

        {/* Alert count */}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: "12px", color: T.textDis }}>
          {alert_count} alert{alert_count !== 1 ? "s" : ""}
        </span>

        {/* Tag toggles */}
        <span
          onClick={e => { e.stopPropagation(); setTag(t => t === "fp" ? null : "fp"); }}
          style={{
            fontSize: "10px", padding: "1px 6px", borderRadius: 3,
            border: `1px solid ${tag === "fp" ? T.MEDIUM + "80" : T.border}`,
            color: tag === "fp" ? T.MEDIUM : T.textDis,
            background: tag === "fp" ? T.MEDIUM + "14" : "transparent",
            cursor: "pointer",
          }}
        >FP</span>
        <span
          onClick={e => { e.stopPropagation(); setTag(t => t === "confirmed" ? null : "confirmed"); }}
          style={{
            fontSize: "10px", padding: "1px 6px", borderRadius: 3,
            border: `1px solid ${tag === "confirmed" ? T.LOW + "80" : T.border}`,
            color: tag === "confirmed" ? T.LOW : T.textDis,
            background: tag === "confirmed" ? T.LOW + "14" : "transparent",
            cursor: "pointer",
          }}
        >Confirmed</span>

        {/* Brief button */}
        <button
          onClick={fetchBluf}
          disabled={blufState === "loading"}
          style={{
            fontSize: "11px", padding: "3px 10px", borderRadius: 5,
            border: `1px solid ${T.border}`,
            background: "transparent",
            color: blufState === "loading" ? T.textDis : T.accent,
            display: "flex", alignItems: "center", gap: 4,
          }}
          onClick={fetchBluf}
        >
          {blufState === "loading" ? (
            <span style={{ animation: "dotPulse 1s infinite" }}>Generating…</span>
          ) : "Generate Brief"}
        </button>

        {/* Chevron */}
        <span style={{
          color: T.textDis, fontSize: "10px",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.18s ease",
          display: "inline-block", flexShrink: 0,
        }}>▼</span>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div className="fade-in" style={{ borderTop: `1px solid ${T.border}`, padding: "16px 16px 18px" }}>

          {/* IOC chips */}
          {(ips.length > 0 || hosts.length > 0 || users.length > 0) && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {ips.map(v    => <IocChip key={v} type="IP"   value={v} />)}
              {hosts.map(v  => <IocChip key={v} type="HOST" value={v} />)}
              {users.map(v  => <IocChip key={v} type="USER" value={v} />)}
            </div>
          )}

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* MITRE table */}
            {mitre_techniques.length > 0 && (
              <div style={{ flex: "2 1 320px", minWidth: 0 }}>
                <SectionLabel>MITRE ATT&amp;CK</SectionLabel>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr>
                      {["ID", "Technique", "Tactic"].map(h => (
                        <th key={h} style={{
                          textAlign: "left", padding: "5px 8px",
                          borderBottom: `1px solid ${T.border}`,
                          color: T.textDis, fontWeight: 600, fontSize: "10px",
                          letterSpacing: "0.04em", textTransform: "uppercase",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mitre_techniques.map(t => {
                      const tc = tacticColor(t.tactic);
                      return (
                        <tr key={t.technique_id} className="tr-hover">
                          <td style={{ padding: "6px 8px", borderBottom: `1px solid ${T.borderSub}` }}>
                            <span className="mono" style={{ fontSize: "11px", color: T.accent }}>{t.technique_id}</span>
                          </td>
                          <td style={{ padding: "6px 8px", borderBottom: `1px solid ${T.borderSub}`, color: T.text, fontSize: "12px" }}>
                            {t.technique_name}
                          </td>
                          <td style={{ padding: "6px 8px", borderBottom: `1px solid ${T.borderSub}` }}>
                            <span style={{
                              fontSize: "10px", fontWeight: 500, color: tc,
                              background: tc + "18", border: `1px solid ${tc}30`,
                              borderRadius: 3, padding: "1px 6px",
                            }}>{t.tactic}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Score breakdown */}
            {score_reasons.length > 0 && (
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <SectionLabel>Score Factors</SectionLabel>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                  {score_reasons.map((r, i) => (
                    <li key={i} style={{ fontSize: "12px", color: T.textSec, display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <span style={{ color: T.textDis, flexShrink: 0, marginTop: 2 }}>·</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Related alerts */}
          <div style={{ marginTop: 18 }}>
            <SectionLabel>Related Alerts</SectionLabel>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  {["ID", "Severity", "Source", "Description", "Timestamp"].map(h => (
                    <th key={h} style={{
                      textAlign: "left", padding: "5px 10px",
                      borderBottom: `1px solid ${T.border}`,
                      color: T.textDis, fontWeight: 600, fontSize: "10px",
                      letterSpacing: "0.04em", textTransform: "uppercase",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, i) => (
                  <tr key={i} className="tr-hover">
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSub}` }}>
                      <span className="mono" style={{ fontSize: "11px", color: T.textDis }}>{a.id}</span>
                    </td>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSub}` }}>
                      <SevBadge sev={a.severity} />
                    </td>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSub}`, color: T.textSec, fontSize: "12px" }}>
                      {a.source}
                    </td>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSub}`, color: T.text }}>
                      {a.description}
                    </td>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.borderSub}` }}>
                      <span className="mono" style={{ fontSize: "10px", color: T.textDis }}>{a.timestamp || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BLUF error */}
          {blufState === "error" && (
            <div style={{
              marginTop: 12, padding: "10px 14px", borderRadius: 6,
              background: T.CRITICAL + "10", border: `1px solid ${T.CRITICAL}30`,
              color: T.CRITICAL, fontSize: "12px",
            }}>
              {blufError}
            </div>
          )}

          {/* BLUF result */}
          {blufState === "done" && blufResult && (
            <BlufPanel incidentId={incident_id} result={blufResult} />
          )}

        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stat card
───────────────────────────────────────────── */
function StatCard({ label, value, color }) {
  return (
    <div style={{
      flex: "1 1 90px",
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderTop: `2px solid ${color}`,
      borderRadius: 8,
      padding: "14px 18px",
      textAlign: "center",
    }}>
      <div className="mono" style={{ fontSize: "22px", fontWeight: 600, color, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: "11px", color: T.textDis, letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   App root
───────────────────────────────────────────── */
export default function App() {
  const [apiStatus,      setApiStatus]      = useState(null);
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [uploading,      setUploading]      = useState(false);
  const [uploadError,    setUploadError]    = useState(null);
  const [result,         setResult]         = useState(null);
  const [activeTab,      setActiveTab]      = useState("incidents");
  const [fpFilter,       setFpFilter]       = useState("all");
  const [lastCorrelated, setLastCorrelated] = useState(null);

  const fileRef = useRef(null);

  /* API health check */
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/status")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => setApiStatus("ok"))
      .catch(() => setApiStatus("error"));
  }, []);

  function onFileChange(e) {
    setSelectedFile(e.target.files[0] || null);
    setUploadError(null);
    setResult(null);
  }

  async function onUpload() {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please select a .csv file.");
      return;
    }
    const fd = new FormData();
    fd.append("file", selectedFile);
    setUploading(true);
    setUploadError(null);
    setResult(null);
    try {
      const res  = await fetch("http://127.0.0.1:8000/api/alerts/correlate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail));
      } else {
        setResult(data);
        setLastCorrelated(new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC");
        setActiveTab("incidents");
        setFpFilter("all");
      }
    } catch {
      setUploadError("Network error — make sure the backend is running on port 8000.");
    } finally {
      setUploading(false);
    }
  }

  function onClear() {
    setSelectedFile(null);
    setResult(null);
    setUploadError(null);
    setLastCorrelated(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const canUpload = !!selectedFile && !uploading && apiStatus === "ok";

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{
        height: 56,
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Shield icon (inline SVG) */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"
              fill={T.accent + "30"} stroke={T.accent} strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>
              Threat Intelligence
            </div>
            <div style={{ fontSize: "10px", color: T.textDis, letterSpacing: "0.03em" }}>
              Correlation & Alert Prioritisation
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {lastCorrelated && (
            <div style={{ fontSize: "11px", color: T.textDis, textAlign: "right" }}>
              Last run&nbsp;
              <span className="mono" style={{ color: T.textSec }}>{lastCorrelated}</span>
              {selectedFile && <span style={{ color: T.textDis }}>&nbsp;· {selectedFile.name}</span>}
            </div>
          )}
          <StatusDot status={apiStatus} />
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, maxWidth: 1060, width: "100%", margin: "0 auto", padding: "28px 24px" }}>

        {/* Upload panel */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          padding: "20px 22px",
          marginBottom: 24,
        }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: T.text, marginBottom: 14 }}>
            Upload Alerts
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <input ref={fileRef} type="file" accept=".csv" id="csv-input" style={{ display: "none" }} onChange={onFileChange} />

            <label htmlFor="csv-input" className="btn-ghost" style={{
              display: "inline-block",
              padding: "6px 14px", borderRadius: 6,
              border: `1px solid ${T.border}`,
              color: T.textSec, fontSize: "12px", cursor: "pointer",
              background: "transparent",
            }}>
              Choose CSV
            </label>

            {selectedFile ? (
              <span style={{ fontSize: "12px", color: T.text }}>{selectedFile.name}</span>
            ) : (
              <span style={{ fontSize: "12px", color: T.textDis }}>No file selected</span>
            )}

            <button
              onClick={onUpload}
              disabled={!canUpload}
              className={canUpload ? "btn-primary" : ""}
              style={{
                padding: "6px 16px", borderRadius: 6,
                border: "none",
                background: canUpload ? T.accentMut : T.surfaceEl,
                color: canUpload ? "#fff" : T.textDis,
                fontSize: "12px", fontWeight: 600,
              }}
            >
              {uploading ? "Analysing…" : "Analyse & Correlate"}
            </button>

            {result && (
              <button onClick={onClear} className="btn-ghost" style={{
                padding: "6px 12px", borderRadius: 6,
                border: `1px solid ${T.border}`,
                background: "transparent",
                color: T.textSec, fontSize: "12px",
              }}>Clear</button>
            )}
          </div>

          <div style={{ marginTop: 10, fontSize: "11px", color: T.textDis }}>
            Required:&nbsp;
            <code style={{ color: T.textSec }}>id, severity, source, description</code>
            &emsp;Optional:&nbsp;
            <code style={{ color: T.textSec }}>timestamp, src_ip, dst_ip, hostname, username</code>
          </div>
        </div>

        {/* Error */}
        {uploadError && (
          <div style={{
            padding: "10px 14px", borderRadius: 6, marginBottom: 20,
            background: T.CRITICAL + "10", border: `1px solid ${T.CRITICAL}30`,
            color: T.CRITICAL, fontSize: "12px",
          }}>
            {uploadError}
          </div>
        )}

        {/* Results */}
        {result && (() => {
          const { total_alerts, total_incidents, incidents } = result;

          const counts = {};
          incidents.forEach(inc => { counts[inc.priority] = (counts[inc.priority] || 0) + 1; });

          const CLRS = { CRITICAL: T.CRITICAL, HIGH: T.HIGH, MEDIUM: T.MEDIUM, LOW: T.LOW };

          return (
            <div className="fade-in">
              {/* Stat row */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                <StatCard label="Total Alerts"    value={total_alerts}    color={T.accent} />
                <StatCard label="Incidents"       value={total_incidents} color={T.textSec} />
                {PRIORITY_ORDER.filter(p => counts[p]).map(p => (
                  <StatCard key={p} label={p.charAt(0) + p.slice(1).toLowerCase()} value={counts[p]} color={CLRS[p]} />
                ))}
              </div>

              {/* Tabs + filter */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
                <div style={{ display: "flex" }}>
                  {[
                    ["incidents", `Incidents (${total_incidents})`],
                    ["all",       `All Alerts (${total_alerts})`],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      className={`tab-item ${activeTab === id ? "active" : ""}`}
                      onClick={() => setActiveTab(id)}
                      style={{
                        padding: "8px 16px", fontSize: "13px", fontWeight: 500,
                        border: "none", background: "transparent",
                        color: activeTab === id ? T.text : T.textSec,
                        marginBottom: -1,
                      }}
                    >{label}</button>
                  ))}
                </div>

                {activeTab === "incidents" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 6 }}>
                    <span style={{ fontSize: "11px", color: T.textDis }}>Filter:</span>
                    {[["all", "All"], ["fp", "False Positive"], ["confirmed", "Confirmed"]].map(([val, lbl]) => (
                      <button
                        key={val}
                        className={`filter-pill ${fpFilter === val ? "active" : ""}`}
                        onClick={() => setFpFilter(val)}
                        style={{
                          fontSize: "11px", padding: "2px 9px", borderRadius: 20,
                          border: `1px solid ${T.border}`,
                          background: "transparent",
                          color: T.textSec, cursor: "pointer",
                        }}
                      >{lbl}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Incidents */}
              {activeTab === "incidents" && (
                <div>
                  <div style={{ fontSize: "12px", color: T.textDis, marginBottom: 12 }}>
                    Sorted by risk score — highest first
                  </div>
                  {incidents.map(inc => (
                    <IncidentCard key={inc.incident_id} incident={inc} fpFilter={fpFilter} />
                  ))}
                </div>
              )}

              {/* All alerts */}
              {activeTab === "all" && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {["ID", "Severity", "Source", "Description", "Timestamp"].map(h => (
                        <th key={h} style={{
                          textAlign: "left", padding: "6px 12px",
                          borderBottom: `1px solid ${T.border}`,
                          color: T.textDis, fontWeight: 600, fontSize: "11px",
                          letterSpacing: "0.04em", textTransform: "uppercase",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.flatMap(inc =>
                      inc.alerts.map((a, i) => (
                        <tr key={`${inc.incident_id}-${i}`} className="tr-hover">
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${T.borderSub}` }}>
                            <span className="mono" style={{ fontSize: "11px", color: T.textDis }}>{a.id}</span>
                          </td>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${T.borderSub}` }}>
                            <SevBadge sev={a.severity} />
                          </td>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${T.borderSub}`, color: T.textSec }}>
                            {a.source}
                          </td>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${T.borderSub}`, color: T.text }}>
                            {a.description}
                          </td>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${T.borderSub}` }}>
                            <span className="mono" style={{ fontSize: "10px", color: T.textDis }}>{a.timestamp || "—"}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          );
        })()}

        {/* Empty state */}
        {!result && !uploadError && (
          <div style={{ textAlign: "center", padding: "72px 24px", color: T.textDis }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 14px", display: "block", opacity: 0.3 }}>
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"
                stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontSize: "13px", marginBottom: 6, color: T.textSec }}>No data yet</div>
            <div style={{ fontSize: "12px" }}>Upload a CSV file to correlate and prioritise security alerts.</div>
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: `1px solid ${T.border}`,
        padding: "10px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: "11px", color: T.textDis,
        background: T.surface, flexShrink: 0,
      }}>
        <span>Threat Intelligence Correlation — TheOverfitters · IBM Bob AI Hackathon</span>
        <span>MITRE ATT&amp;CK · Gemini AI</span>
      </footer>

    </div>
  );
}
