import { useState } from "react";
import "./home.css"; // Reuse theme

type Message = {
  sender: "user" | "bot";
  text: string;
};

export default function TextToText() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // 👇 call your backend instead of OpenAI directly
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a negotiation bot." },
            ...messages.map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text,
            })),
            { role: "user", content: input },
          ],
        }),
      });

      const data = await response.json();
      const botReply = data.reply || "[No response]";

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error: Could not reach backend." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* NAV */}
      <div className="nav">
        <div className="container nav-inner">
          <div className="brand">
            <span className="badge">NC STATE</span>
            <span>Text-to-Text Demo</span>
          </div>
          <div className="links">
            <a href="/">Home</a>
          </div>
        </div>
      </div>

      {/* CHAT */}
      <section className="container section">
        <h2 className="title">Bot–Bot Negotiation (Text vs. Text)</h2>
        <p className="muted">Try out the negotiation system with a simple text chat.</p>

        <div className="card" style={{ height: "60vh", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem", borderBottom: "1px solid #eee" }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: "0.75rem", textAlign: msg.sender === "user" ? "right" : "left" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "1rem",
                    background: msg.sender === "user" ? "#007bff" : "#f1f1f1",
                    color: msg.sender === "user" ? "white" : "black",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {loading && <div className="muted">Bot is typing...</div>}
          </div>

          <div style={{ display: "flex", padding: "0.5rem" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{ flex: 1, marginRight: "0.5rem" }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="btn primary" onClick={handleSend} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
