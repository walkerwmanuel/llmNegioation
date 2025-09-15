"use client";

import React, { useMemo, useState } from "react";

/* ----------------------- tiny local “ui” components ----------------------- */
const colors = {
  border: "#2b3345",
  panel: "#0b1220",
  panelAlt: "#0e1423",
  text: "#e8ecf1",
  muted: "rgba(232,236,241,0.7)",
  primary: "#6366f1",
  primaryHover: "#7c7ef7",
};

function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.panel,
        color: colors.text,
        borderRadius: 12,
        boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
        ...props.style,
      }}
    />
  );
}

function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        padding: "20px 24px",
        borderBottom: `1px solid ${colors.border}`,
        ...props.style,
      }}
    />
  );
}

function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...props}
      style={{
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        ...props.style,
      }}
    />
  );
}

function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        padding: 24,
        ...props.style,
      }}
    />
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};
function Button({ variant = "default", style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    padding: "0 16px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 120ms ease, border-color 120ms ease, opacity 120ms",
  };
  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: colors.primary,
      color: "#fff",
      border: `1px solid ${colors.primary}`,
    },
    outline: {
      background: "transparent",
      color: colors.text,
      border: `1px solid ${colors.border}`,
    },
  };
  const hover =
    variant === "default"
      ? { background: colors.primaryHover, borderColor: colors.primaryHover }
      : { background: "#111827" };

  return (
    <button
      {...props}
      onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, hover)}
      onMouseLeave={(e) =>
        Object.assign((e.currentTarget as HTMLButtonElement).style, styles[variant])
      }
      style={{ ...base, ...styles[variant], ...style }}
    />
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
function Input({ style, ...props }: InputProps) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        height: 40,
        padding: "0 12px",
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        background: colors.panelAlt,
        color: colors.text,
        outline: "none",
        boxShadow: "none",
        transition: "box-shadow 120ms ease, border-color 120ms ease",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}55`;
        e.currentTarget.style.borderColor = colors.primary;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = colors.border;
      }}
    />
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
function Textarea({ style, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        minHeight: 120,
        padding: "10px 12px",
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        background: colors.panelAlt,
        color: colors.text,
        outline: "none",
        transition: "box-shadow 120ms ease, border-color 120ms ease",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}55`;
        e.currentTarget.style.borderColor = colors.primary;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = colors.border;
      }}
    />
  );
}

/* ----------------------- page-specific logic & UI ------------------------ */

type Agent = { name: string; persona: string; stance: string };
type FormState = {
  model: string;
  topic: string;
  rules: string;
  rounds: number;
  agent1: Agent;
  agent2: Agent;
};

const API_URL = "http://localhost:8025/t2t-negotiate";

export default function TextToText() {
  const defaults: FormState = useMemo(
    () => ({
      model: "gpt-4o-mini",
      topic: "Is senior design for electrical and computer engineers actually useful?",
      rules:
        "DEBATE RULES:\n" +
        "1) Respond in EXACTLY two sentences per turn.\n" +
        "2) Address the topic directly; cite concrete practices, examples, or trade-offs.\n" +
        "3) No markdown, no emojis, no bullet points.\n" +
        "4) Stay civil, concise, and on-topic; avoid generic platitudes.\n" +
        "5) If referencing evidence, summarize briefly rather than citing sources.",
      rounds: 4,
      agent1: {
        name: "Neil Sood",
        persona:
          "You are Neil Sood, a 21-year-old Caucasian male undergraduate at North Carolina State University. " +
          "You are curious, reflective, and enjoy connecting technical coursework to bigger-picture societal impacts. " +
          "You are involved in campus organizations and value teamwork, problem framing, and learning experiences that mirror real-world challenges.",
        stance:
          "Argue that senior design is useful because it teaches collaboration, project planning, and integrating multiple disciplines, " +
          "preparing students for the complexities of professional engineering work.",
      },
      agent2: {
        name: "Kaden Nelson",
        persona:
          "You are Kaden Nelson, a 21-year-old Asian male undergraduate at North Carolina State University. " +
          "You are pragmatic, efficiency-oriented, and focused on building a resume that will impress recruiters. " +
          "You believe practical experience through internships and co-ops provides more valuable preparation than classroom projects.",
        stance:
          "Argue that senior design is overrated compared to internships and co-ops, " +
          "because it often lacks industry tools, realistic scope, and the pressure of true stakeholder expectations.",
      },
    }),
    []
  );

  const [form, setForm] = useState<FormState>(defaults);
  const [submitted, setSubmitted] = useState(false);

  // NEW: request state
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      model: form.model,
      topic: form.topic,
      rules: form.rules,
      rounds: form.rounds,
      agent1: [form.agent1.name, form.agent1.persona, form.agent1.stance],
      agent2: [form.agent2.name, form.agent2.persona, form.agent2.stance],
    }),
    [form]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setErr(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data: { transcript?: string } = await res.json();
      console.log("Backend response:", data); // print to console
      setResult(data.transcript ?? "(No transcript field returned)");
    } catch (e: any) {
      setErr(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setForm(defaults);
    setSubmitted(false);
    setResult(null);
    setErr(null);
  };

  /* ------------------------------- layout -------------------------------- */

  return (
    <div
      style={{
        padding: "32px 24px",
        maxWidth: 980,
        margin: "0 auto",
        color: colors.text,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Configure Bot–Bot Debate</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debate Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            {/* Top row: Model / Rounds */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 16,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                    Model
                  </label>
                  <Input
                    value={form.model}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                    placeholder="e.g., gpt-4o-mini"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                    Rounds
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={form.rounds}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        rounds: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                      }))
                    }
                  />
                </div>
              </div>

              {/* Topic */}
              <div>
                <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                  Topic
                </label>
                <Input
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  placeholder="Debate topic"
                />
              </div>
            </div>

            {/* Agent 1 */}
            <Card style={{ marginTop: 16 }}>
              <CardHeader>
                <CardTitle>Agent 1</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                      Name
                    </label>
                    <Input
                      value={form.agent1.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, agent1: { ...f.agent1, name: e.target.value } }))
                      }
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                      Stance (1–2 sentences)
                    </label>
                    <Input
                      value={form.agent1.stance}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, agent1: { ...f.agent1, stance: e.target.value } }))
                      }
                    />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                    Persona / Background
                  </label>
                  <Textarea
                    rows={4}
                    value={form.agent1.persona}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, agent1: { ...f.agent1, persona: e.target.value } }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Agent 2 */}
            <Card style={{ marginTop: 16 }}>
              <CardHeader>
                <CardTitle>Agent 2</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                      Name
                    </label>
                    <Input
                      value={form.agent2.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, agent2: { ...f.agent2, name: e.target.value } }))
                      }
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                      Stance (1–2 sentences)
                    </label>
                    <Input
                      value={form.agent2.stance}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, agent2: { ...f.agent2, stance: e.target.value } }))
                      }
                    />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                    Persona / Background
                  </label>
                  <Textarea
                    rows={4}
                    value={form.agent2.persona}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, agent2: { ...f.agent2, persona: e.target.value } }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rules */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                Rules
              </label>
              <Textarea
                rows={6}
                value={form.rules}
                onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <Button type="submit">{loading ? "Submitting..." : "Submit"}</Button>
              <Button type="button" variant="outline" onClick={onReset}>
                Reset to Defaults
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Request Preview (kept, but now it really sends) */}
      {submitted && (
        <Card style={{ marginTop: 16 }}>
          <CardHeader>
            <CardTitle>Request Payload</CardTitle>
          </CardHeader>
          <CardContent>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 12,
                background: colors.panelAlt,
                border: `1px solid ${colors.border}`,
                padding: 12,
                borderRadius: 8,
              }}
            >
              {JSON.stringify(payload, null, 2)}
            </pre>
            <p style={{ marginTop: 8, color: colors.muted, fontSize: 13 }}>
              Posting to <code>{API_URL}</code>.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Result / Error */}
      {loading && (
        <Card style={{ marginTop: 16 }}>
          <CardHeader>
            <CardTitle>Running Debate…</CardTitle>
          </CardHeader>
          <CardContent>Contacting backend and generating transcript.</CardContent>
        </Card>
      )}

      {err && (
        <Card style={{ marginTop: 16, borderColor: "#b91c1c" }}>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent style={{ color: "#fecaca" }}>{err}</CardContent>
        </Card>
      )}

      {result && (
        <Card style={{ marginTop: 16 }}>
          <CardHeader>
            <CardTitle>Backend Response (Transcript)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 14,
                background: colors.panelAlt,
                border: `1px solid ${colors.border}`,
                padding: 12,
                borderRadius: 8,
              }}
            >
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
