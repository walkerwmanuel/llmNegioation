import { AuthButton } from "../components/auth/AuthButton";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(1200px 800px at 20% -10%, #131b3a 0%, #0b1020 60%) no-repeat, #0b1020",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          padding: "0 20px",
        }}
      >
        {/* Card */}
        <div
          style={{
            background: "#0f1328",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            padding: "40px 36px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            textAlign: "center",
          }}
        >
          {/* Badge */}
          <div style={{ marginBottom: "24px" }}>
            <span
              style={{
                display: "inline-block",
                background: "#CC0000",
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                padding: "4px 12px",
                borderRadius: "6px",
              }}
            >
              NC STATE
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "#e8edf9",
              lineHeight: 1.2,
            }}
          >
            Cross-Cultural
            <br />
            Negotiation System
          </h1>

          {/* Subtitle */}
          <p
            style={{
              margin: "0 0 32px",
              fontSize: "0.9rem",
              color: "#a7b0c6",
              lineHeight: 1.5,
            }}
          >
            Sign in to access the platform
          </p>

          {/* Divider */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              marginBottom: "28px",
            }}
          />

          {/* Google button */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AuthButton />
          </div>
        </div>

        {/* Footer note */}
        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "0.78rem",
            color: "rgba(167,176,198,0.6)",
          }}
        >
          NC State University — Senior Design Project
        </p>
      </div>
    </div>
  );
}
