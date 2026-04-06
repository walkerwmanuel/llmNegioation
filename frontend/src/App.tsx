import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/home";
import TextToText from "./pages/TextToText";
import SpeechToText from "./pages/SpeechToText";
import VoiceToVoice from "./pages/VoiceToVoice";

import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";

import { AuthButton } from "./components/auth/AuthButton";


export default function App() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Router>
      {/* GLOBAL HERO HEADER (dark) */}
      <header
        style={{
          position: "relative",
          zIndex: 9999,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
          color: "#fff",
          padding: "1rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(4px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        {/* Row with Overview link + title */}
        <div
          style={{
            width: "100%",
            maxWidth: "1000px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Bold Overview link on left */}
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
            <Link
              to="/"
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Home
            </Link>
          </div>

          {/* Title centered */}
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, textAlign: "center", flexShrink: 0 }}>
            Cross-Cultural Negotiation System
          </h1>

          {/* Auth button in top-right */}
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <AuthButton />
          </div>
        </div>

        <p style={{ margin: 0, fontSize: "1rem", opacity: 0.9 }}>
          Watch AI agents practice and analyze negotiations in real time.
        </p>
      </header>

      {/* ROUTES */}
      <Routes>
        {/* LOGIN PAGE */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />

        {/* PROTECTED ROUTES */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/text-to-text"
          element={
            <ProtectedRoute>
              <TextToText />
            </ProtectedRoute>
          }
        />

        <Route
          path="/speech-to-text"
          element={
            <ProtectedRoute>
              <SpeechToText />
            </ProtectedRoute>
          }
        />

        <Route
          path="/voice-to-voice"
          element={
            <ProtectedRoute>
              <VoiceToVoice />
            </ProtectedRoute>
          }
        />
      </Routes>

    </Router>
  );
}
