import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {
  return (
    <>
      {/* CTA SECTION — v1 */}
      <section className="container section" style={{ display: "flex", justifyContent: "center", padding: "2.75rem 0 0.75rem"}}>
        <div
          className="cta-card"
          style={{
            textAlign: "center",
            margin: "0 auto",
            maxWidth: "700px",
            width: "100%",
            padding: "1.25rem 1rem",
            borderRadius: "1rem",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            color: "#fff",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>
            Bot-Bot Negotiation
          </h2>
          <p className="muted" style={{ marginBottom: "0.85rem", opacity: 0.9 }}>
            Two agents with distinct cultural profiles negotiate simulated scenarios
          </p>
          <Link
            to="/text-to-text"
            className="btn primary"
            style={{
              fontSize: "1.2rem",
              padding: "0.5rem 0.5rem",
              minWidth: "180px",
              display: "inline-block",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Text-to-Text
          </Link>
        </div>
      </section>

      {/* CTA SECTION — v2 */}
      <section className="container section" style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0" }}>
        <div
          className="cta-card"
          style={{
            textAlign: "center",
            margin: "0 auto",
            maxWidth: "700px",
            width: "100%",
            padding: "1.25rem 1rem",
            borderRadius: "1rem",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            color: "#fff",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>
            Human-Bot Negotiation
          </h2>
          <p className="muted" style={{ marginBottom: "0.85rem", opacity: 0.9 }}>
            Adapt one agent to allow human participation via text with voice input
          </p>
          <Link
            to="/speech-to-text"
            className="btn primary"
            style={{
              fontSize: "1.2rem",
              padding: "0.5rem 0.5rem",
              minWidth: "180px",
              display: "inline-block",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Voice-to-Text
          </Link>
        </div>
      </section>

      {/* CTA SECTION — v3 */}
      <section className="container section" style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0" }}>
        <div
          className="cta-card"
          style={{
            textAlign: "center",
            margin: "0 auto",
            maxWidth: "700px",
            width: "100%",
            padding: "1.25rem 1rem",
            borderRadius: "1rem",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            color: "#fff",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>
            Real-Time Multimodal
          </h2>
          <p className="muted" style={{ marginBottom: "0.85rem", opacity: 0.9 }}>
            Two-way voice conversation with advanced negotiation flow visualization
          </p>
          <Link
            to="/voice-to-voice"
            className="btn primary"
            style={{
              fontSize: "1.2rem",
              padding: "0.5rem 0.5rem",
              minWidth: "180px",
              display: "inline-block",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Voice-to-Voice
          </Link>
        </div>
      </section>
    </>
  );
}