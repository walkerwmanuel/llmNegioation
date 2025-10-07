import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {
  return (
    <>
      {/* NAV */}
      <div className="nav">
        <div className="container nav-inner">
          <div className="brand">
            <span className="badge">NC STATE</span>
            <span>University — Senior Design</span>
          </div>
          <div className="links">
            <a href="#features">How It Works</a>
          </div>
        </div>
      </div>

      {/* CTA SECTION */}
      <section className="container section">
        <div
          className="cta-card"
          style={{
            textAlign: "center",
            margin: "2rem 0",
            padding: "1.5rem",
            borderRadius: "1rem",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            color: "#fff",
          }}
        >
          <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            🔥 Check Out the Text-to-Text Bot v1 🔥
          </h2>
          <p className="muted" style={{ marginBottom: "1rem", opacity: 0.9 }}>
            Watch two AI agents debate a topic in real-time!
          </p>
          <Link
            to="/text-to-text"
            className="btn primary"
            style={{
              fontSize: "1.2rem",
              padding: "0.75rem 1.5rem",
              display: "inline-block",
              textDecoration: "none",
            }}
          >
            Try It Now
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="features" className="container section">
        <h2 className="title">How It Works</h2>
        <p className="muted">Step-by-step view aligned with milestones.</p>

        <div className="steps">
          <div className="step-box">
            <div className="badge-num">1</div>
            <div className="step-title">Bot-Bot Negotiation (Text vs. Text)</div>
            <p className="muted">
              Two LLM agents with distinct cultural profiles negotiate simulated scenarios
              (e.g., salary/benefits, school cellphone policy). The GUI visualizes rounds,
              outcomes, winners, offer types, and deadlocks.
            </p>
          </div>

          <div className="step-box">
            <div className="badge-num">2</div>
            <div className="step-title">Human–Bot (Voice vs. Text)</div>
            <p className="muted">
              Adapt one agent to allow human participation via text with optional voice input
              (speech-to-text). Compare outcomes vs. bot–bot and iterate for research goals.
            </p>
          </div>

          <div className="step-box">
            <div className="badge-num">3</div>
            <div className="step-title">Real-Time Multimodal (Voice vs. Voice)</div>
            <p className="muted">
              Enable two-way synchronous voice conversation. Provide advanced visualization
              of negotiation/deliberation flow and ensure scalability for classroom and external deployments.
            </p>
          </div>

          <div className="step-box">
            <div className="badge-num">4</div>
            <div className="step-title">Logging, Stats &amp; Archival</div>
            <p className="muted">
              Archive runtime results and output statistics: number of rounds, success rate,
              deadlocks, offer types, and winners—enabling benchmarking and reproducible studies.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
