import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {
  const blocks = [
    {
      title: "Text-to-Text (Bot-to-Bot)",
      description: "Watch two AI agents negotiate a topic in real-time!",
      href: "/text-to-text",
    },
    {
      title: "Speech-to-Text (Human-to-Bot)",
      description: "Practice real spoken negotiations",
      href: "/speech-to-text",
    },
    {
      title: "Speech-to-Speech (Human-to-Bot Multimodal)",
      description: "Join the conversation, share ideas, and get inspired by others.",
      href: "/speech-to-speech",
    },
  ];
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

      {/* CTA SECTION — v1 */}
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
            Check Out the Negotiation Bot v1 - Text-to-Text
          </h2>
          <p className="muted" style={{ marginBottom: "1rem", opacity: 0.9 }}>
            Watch two AI agents negotiate a topic in real-time!
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

    {/* CTA SECTION — v2 (closer to v1) */}
    <section
      className="container section"
      style={{
        marginTop: "-1rem",   // pulls v2 upward closer to v1
        marginBottom: "0.5rem",
      }}
    >
      <div
        className="cta-card"
        style={{
          textAlign: "center",
          margin: "1rem 0",
          padding: "1.25rem",
          borderRadius: "1rem",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          color: "#fff",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          Try Negotiation Bot v2 — Speech-to-Text
        </h2>
        <p className="muted" style={{ marginBottom: "0.75rem", opacity: 0.9 }}>
          Practice real spoken negotiations — structured like an actual negotiation.
        </p>
        <Link
          to="/speech-to-text"
          className="btn primary"
          style={{
            fontSize: "1.1rem",
            padding: "0.5rem 1.25rem",
            display: "inline-block",
            textDecoration: "none",
          }}
        >
          Practice Live Negotiations
        </Link>
      </div>
    </section>
      {/* NEGOTIATION MODES */}
      <section className="container section" style={{ textAlign: "center", marginTop: "2rem", marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "2.5rem", marginBottom: "2.5rem", fontWeight: "700" }}>Negotiation Modes</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
          }}
        >
          {blocks.map((block) => (
            <Link
              key={block.title}
              to={block.href}
              className="mode-card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                aspectRatio: "1",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                textDecoration: "none",
                color: "#fff",
                transition: "all 0.3s ease",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}></div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem", minHeight: "2.5rem" }}>
                  {block.title}
                </h3>
                <p style={{ fontSize: "0.875rem", opacity: 0.8, lineHeight: "1.5" }}>
                  {block.description}
                </p>
              </div>
              <div style={{ textAlign: "right", marginTop: "1rem" }}>
                <span style={{ fontSize: "1.25rem" }}>↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="features" className="container section">
        <h2 className="title">How It Works</h2>
        <p className="muted">Step-by-step view aligned with milestones.</p>

        <div className="steps">
          <div className="step-box">
            <div className="badge-num">1</div>
            <Link to="/text-to-text" className="step-title">
              Bot-Bot Negotiation (Text vs. Text)
            </Link>
            <p className="muted">
              Two LLM agents with distinct cultural profiles negotiate simulated
              scenarios (e.g., salary/benefits, school cellphone policy). The GUI
              visualizes rounds, outcomes, winners, offer types, and deadlocks.
            </p>
          </div>

          <div className="step-box">
            <div className="badge-num">2</div>
            <Link to="/speech-to-text" className="step-title">
              Human–Bot (Voice vs. Text)
            </Link>
            <p className="muted">
              Adapt one agent to allow human participation via text with optional
              voice input (speech-to-text). Compare outcomes vs. bot–bot and
              iterate for research goals.
            </p>
          </div>

          <div className="step-box">
            <div className="badge-num">3</div>
            <div className="step-title">Real-Time Multimodal (Voice vs. Voice)</div>
            <p className="muted">
              Enable two-way synchronous voice conversation. Provide advanced
              visualization of negotiation/deliberation flow and ensure scalability
              for classroom and external deployments.
            </p>
          </div>

          <div className="step-box">
            <div className="badge-num">4</div>
            <div className="step-title">Logging, Stats &amp; Archival</div>
            <p className="muted">
              Archive runtime results and output statistics: number of rounds, success
              rate, deadlocks, offer types, and winners—enabling benchmarking and
              reproducible studies.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
