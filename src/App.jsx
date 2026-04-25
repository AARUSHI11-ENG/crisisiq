import { useState, useEffect, useRef } from "react";
import { generateResponse } from "./ai";
import jsPDF from "jspdf";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function App() {
  const [input, setInput] = useState("");
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [time, setTime] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  const [whyText, setWhyText] = useState("");
  const [risk, setRisk] = useState("");

  const [stats, setStats] = useState({
    floors: 0,
    unaccounted: 0,
    eta: 0,
  });

  const timerRef = useRef(null);

  useEffect(() => {
    clearInterval(timerRef.current);

    if (started && !stopped) {
      timerRef.current = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [started, stopped]);

  const detectRisk = (text) => {
    const t = text.toLowerCase();

    if (
      t.includes("fire") ||
      t.includes("chemical") ||
      t.includes("explosion") ||
      t.includes("trapped")
    ) return "Critical";

    if (
      t.includes("flood") ||
      t.includes("earthquake") ||
      t.includes("smoke")
    ) return "High";

    if (t.includes("injury") || t.includes("leak")) return "Medium";

    return "Low";
  };

  const generateAlerts = (text) => {
    const lower = text.toLowerCase();
    const arr = [];

    if (lower.includes("fire")) {
      arr.push("Fire alarm triggered");
      arr.push("Smoke spreading upward");
      arr.push("Heat sensors exceeded threshold");
    }

    if (lower.includes("flood")) {
      arr.push("Water level rising");
      arr.push("Basement risk detected");
    }

    if (lower.includes("earthquake")) {
      arr.push("Structural vibration detected");
      arr.push("Exit route damage possible");
    }

    if (lower.includes("chemical")) {
      arr.push("Toxic leak detected");
      arr.push("Hazmat response advised");
    }

    arr.push("Emergency services notified");
    arr.push("AI monitoring active");

    return arr;
  };

  const handleStart = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setStarted(true);
    setStopped(false);
    setTime(0);
    setAlerts([]);
    setAiText("");
    setConfirmed([]);
    setWhyText("");

    const currentRisk = detectRisk(input);
    setRisk(currentRisk);

    const lower = input.toLowerCase();

    setStats({
      floors: lower.includes("floor") ? 3 : 2,
      unaccounted: lower.includes("214") ? 214 : 87,
      eta: 4,
    });

    const live = generateAlerts(input);

    live.forEach((item, i) => {
      setTimeout(() => {
        setAlerts((prev) => [...prev, item]);
      }, i * 1200);
    });

    const prompt = `
You are an emergency crisis management AI.

Situation:
${input}

Give top 3 recommendations using this exact format:

TITLE: Recommendation title
DETAILS: Short explanation
CONFIDENCE: 92%

TITLE: Recommendation title
DETAILS: Short explanation
CONFIDENCE: 85%

TITLE: Recommendation title
DETAILS: Short explanation
CONFIDENCE: 78%

Then add:

CONSEQUENCES: What may happen if actions are not taken.
`;

    const result = await generateResponse(prompt);
    setAiText(result);
    setLoading(false);
  };

  const stopAnalysis = () => {
    setStopped(true);
    clearInterval(timerRef.current);
    setAlerts((prev) => [...prev, "Analysis stopped. Situation stabilized."]);
  };

  const askWhy = async (title) => {
    const result = await generateResponse(`
Explain why this action is important:

${title}

Keep answer concise and practical.
`);
    setWhyText(result);
  };

  const confirmAction = (title) => {
    if (!confirmed.includes(title)) {
      setConfirmed((prev) => [...prev, title]);
      setAlerts((prev) => [...prev, `Confirmed: ${title}`]);
    }
  };

  const downloadReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("CrisisIQ Incident Report", 20, 20);

    doc.setFontSize(12);
    doc.text("Situation:", 20, 40);
    doc.text(doc.splitTextToSize(input || "N/A", 170), 20, 48);

    doc.text(`Risk Level: ${risk || "N/A"}`, 20, 75);

    doc.text("AI Recommendations:", 20, 90);
    doc.text(doc.splitTextToSize(aiText || "No data", 170), 20, 98);

    doc.text("Confirmed Actions:", 20, 220);
    const actions =
      confirmed.length > 0
        ? confirmed.join(", ")
        : "No actions confirmed.";

    doc.text(doc.splitTextToSize(actions, 170), 20, 228);

    doc.save("CrisisIQ_Report.pdf");
  };

  const cards = aiText
    .split("TITLE:")
    .filter(Boolean)
    .map((block) => {
      const lines = block.trim().split("\n");

      return {
        title: lines[0] || "Recommendation",
        details: (lines.find((l) => l.includes("DETAILS:")) || "")
          .replace("DETAILS:", "")
          .trim(),
        confidence: (lines.find((l) => l.includes("CONFIDENCE:")) || "90%")
          .replace("CONFIDENCE:", "")
          .trim(),
      };
    });

  const chartData = started
    ? [
        { name: "Rescued", value: confirmed.length * 20 || 10 },
        { name: "At Risk", value: stats.unaccounted || 20 },
        { name: "Safe", value: 100 },
      ]
    : [];

  const COLORS = ["#22c55e", "#ef4444", "#3b82f6"];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>CrisisIQ</h1>
      <p style={styles.sub}>AI Powered Rapid Crisis Response Platform</p>

      <div style={styles.inputBox}>
        <textarea
          rows="4"
          placeholder="Describe any crisis situation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={styles.textarea}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button onClick={handleStart} style={styles.mainBtn}>
            {loading ? "Analyzing..." : "Start Live Incident"}
          </button>

          {started && !stopped && (
            <button onClick={stopAnalysis} style={styles.stopBtn}>
              Stop Analysis
            </button>
          )}
        </div>
      </div>

      {started && (
        <>
          <div style={styles.grid4}>
            <div style={styles.stat}>Floors: {stats.floors}</div>
            <div style={styles.stat}>Unaccounted: {stats.unaccounted}</div>
            <div style={styles.stat}>Time: {time}s</div>
            <div style={styles.stat}>ETA: {stats.eta}m</div>
          </div>

          <div style={styles.badgeWrap}>
            <span style={styles.riskBadge(risk)}>
              Risk Level: {risk}
            </span>
          </div>

          <div style={styles.mainGrid}>
            <div>
              <h2>AI Recommendations</h2>

              {cards.length > 0 ? (
                cards.map((item, i) => (
                  <div key={i} style={styles.card}>
                    <h3>{item.title}</h3>
                    <p>{item.details}</p>
                    <p>Confidence: {item.confidence}</p>

                    <div style={{ marginTop: "10px" }}>
                      <button
                        style={styles.smallBtn}
                        onClick={() => confirmAction(item.title)}
                      >
                        Confirm
                      </button>

                      <button
                        style={styles.smallBtn}
                        onClick={() => askWhy(item.title)}
                      >
                        Why?
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.card}>Generating recommendations...</div>
              )}

              {whyText && (
                <div style={styles.card}>
                  <h3>AI Reasoning</h3>
                  <p>{whyText}</p>
                </div>
              )}
            </div>

            <div>
              <h2>Live Alerts</h2>

              {alerts.map((a, i) => (
                <div key={i} style={styles.alert}>
                  {a}
                </div>
              ))}

              {started && (
                <div style={styles.card}>
                  <h3>Response Analytics</h3>

                  <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          outerRadius={80}
                          label
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div style={styles.card}>
                <h3>Confirmed Steps</h3>

                {confirmed.length > 0 ? (
                  confirmed.map((item, i) => (
                    <p key={i}>• {item}</p>
                  ))
                ) : (
                  <p>No steps confirmed yet.</p>
                )}
              </div>

              <button
                onClick={downloadReport}
                style={styles.reportBtn}
              >
                Generate Report
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    background: "#0b0f19",
    minHeight: "100vh",
    color: "white",
    padding: "30px",
    fontFamily: "Arial",
  },

  title: {
    fontSize: "48px",
    marginBottom: "5px",
  },

  sub: {
    color: "#9ca3af",
    marginBottom: "20px",
  },

  inputBox: {
    background: "#111827",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "20px",
  },

  textarea: {
    width: "100%",
    padding: "15px",
    background: "#0b0f19",
    color: "white",
    border: "1px solid #374151",
    borderRadius: "12px",
    fontSize: "16px",
  },

  mainBtn: {
    flex: 1,
    padding: "14px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
  },

  stopBtn: {
    flex: 1,
    padding: "14px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
  },

  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: "15px",
    marginBottom: "15px",
  },

  stat: {
    background: "#111827",
    padding: "20px",
    borderRadius: "14px",
    fontWeight: "bold",
  },

  badgeWrap: {
    marginBottom: "20px",
  },

  riskBadge: (risk) => ({
    padding: "10px 16px",
    borderRadius: "999px",
    background:
      risk === "Critical"
        ? "#7f1d1d"
        : risk === "High"
        ? "#78350f"
        : risk === "Medium"
        ? "#1e3a8a"
        : "#14532d",
  }),

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  card: {
    background: "#111827",
    padding: "18px",
    borderRadius: "16px",
    marginBottom: "15px",
  },

  alert: {
    background: "#111827",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "12px",
  },

  smallBtn: {
    padding: "8px 12px",
    marginRight: "10px",
    background: "#1f2937",
    color: "white",
    border: "1px solid #374151",
    borderRadius: "8px",
    cursor: "pointer",
  },

  reportBtn: {
    width: "100%",
    padding: "14px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    marginTop: "10px",
  },
};