"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ----------------------- tiny local “ui” components ----------------------- */
const colors = {
  border: "#2b3345",
  panel: "#0b1220",
  panelAlt: "#0e1423",
  text: "#e8ecf1",
  muted: "rgba(232,236,241,0.7)",
  primary: "#6366f1",
  primaryHover: "#7c7ef7",
  bubbleA: "#111a33",
  bubbleB: "#1b233a",
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
  variant?: "default" | "outline" | "ghost";
  size?: "md" | "sm";
};
function Button({ variant = "default", size = "md", style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: size === "sm" ? 32 : 40,
    padding: size === "sm" ? "0 12px" : "0 16px",
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
    ghost: {
      background: "transparent",
      color: colors.text,
      border: "1px solid transparent",
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

/* ---------------------------- settings modal ----------------------------- */

function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      aria-modal
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(880px, 96vw)",
          maxHeight: "90vh",
          overflow: "auto",
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}
      >
        <CardHeader style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardTitle>{title}</CardTitle>
          <button
            aria-label="Close"
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: colors.muted, cursor: "pointer" }}
          >
            ×
          </button>
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16, borderTop: `1px solid ${colors.border}` }}>
            {footer}
          </div>
        )}
      </div>
    </div>
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

type ChatItem =
  | { kind: "round"; round: number }
  | { kind: "turn"; speaker: string; content: string; side: "left" | "right" };

const API_URL = "http://localhost:8025/t2t-negotiate";

/* ------------------------------ helpers ---------------------------------- */

// Build POST payload; ensure `transcript` is the FIRST field
function buildPayload({
  transcript,
  form,
}: {
  transcript: string;
  form: FormState;
}) {
  return {
    existing_transcript: transcript,
    model: form.model,
    topic: form.topic,
    rules: form.rules,
    rounds: form.rounds,
    agent1: {
      name: form.agent1.name,
      personality: form.agent1.persona,
      goal: form.agent1.stance,
    },
    agent2: {
      name: form.agent2.name,
      personality: form.agent2.persona,
      goal: form.agent2.stance,
    },
  };
}

// Convert chat items to the backend transcript format
function serializeTranscript(items: ChatItem[]): string {
  let t = "";
  for (const it of items) {
    if (it.kind === "round") {
      if (t.endsWith("\n\n")) {
        t += `=== Round ${it.round} ===\n\n`;
      } else {
        t += `\n=== Round ${it.round} ===\n\n`;
      }
    } else if (it.kind === "turn") {
      t += `${it.speaker}:\n${it.content}\n\n`;
    }
  }
  return t.trim();
}

// NDJSON streaming POST helper (supports AbortController)
async function postStream(
  url: string,
  body: any,
  onMessage: (msg: any) => void,
  signal?: AbortSignal
) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        onMessage(JSON.parse(trimmed));
      } catch {
        /* swallow malformed chunk */
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    try {
      onMessage(JSON.parse(tail));
    } catch {}
  }
}

/* ------------------------------ chat pieces ------------------------------ */

function Avatar({ name, side }: { name: string; side: "left" | "right" }) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: side === "left" ? colors.primary : "#334155",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        flex: "0 0 auto",
      }}
      title={name}
    >
      {initials}
    </div>
  );
}

function ChatBubble({
  name,
  content,
  side,
  isEditing,
  onEdit,
  onChange,
  onSave,
  onCancel,
}: {
  name: string;
  content: string;
  side: "left" | "right";
  isEditing: boolean;
  onEdit: () => void;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        justifyContent: side === "left" ? "flex-start" : "flex-end",
      }}
    >
      {side === "left" && <Avatar name={name} side={side} />}
      <div
        style={{
          maxWidth: "70%",
          padding: "10px 12px",
          borderRadius: 12,
          background: side === "left" ? colors.bubbleA : colors.bubbleB,
          border: `1px solid ${colors.border}`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
            color: colors.muted,
            fontSize: 12,
          }}
        >
          <div style={{ flex: 1 }}>{name}</div>
          {!isEditing ? (
            <button
              title="Edit message"
              onClick={onEdit}
              style={{
                background: "transparent",
                border: "none",
                color: colors.muted,
                cursor: "pointer",
              }}
            >
              ✎
            </button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={onSave}>
                Save
              </Button>
            </>
          )}
        </div>

        {!isEditing ? (
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{content}</div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: "100%",
              minHeight: 100,
              padding: 8,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.panelAlt,
              color: colors.text,
              outline: "none",
              resize: "vertical",
            }}
          />
        )}
      </div>
      {side === "right" && <Avatar name={name} side={side} />}
    </div>
  );
}

function RoundDivider({ round }: { round: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
      <div style={{ height: 1, background: colors.border, flex: 1 }} />
      <div
        style={{
          fontSize: 12,
          color: colors.muted,
          padding: "2px 10px",
          borderRadius: 999,
          border: `1px solid ${colors.border}`,
          background: colors.panelAlt,
        }}
      >
        Round {round}
      </div>
      <div style={{ height: 1, background: colors.border, flex: 1 }} />
    </div>
  );
}

/* --------------------------------- page ---------------------------------- */

export default function TextToText() {
  // defaults for negotiation parameters
  const defaults: FormState = useMemo(
    () => ({
      model: "gpt-4o-mini",
      topic: "Is senior design for electrical and computer engineers actually useful?",
      rules:
        "NEGOTIATION RULES:\n" +
        "1) Respond in EXACTLY two sentences per turn.\n" +
        "2) Address the topic directly; cite concrete practices, examples, or trade-offs.\n" +
        "3) No markdown, no emojis, no bullet points.\n" +
        "4) Stay civil, concise, and on-topic; avoid generic platitudes.\n" +
        "5) If referencing evidence, summarize briefly rather than citing sources.",
      rounds: 4,
      agent1: {
        name: "Agent A",
        persona:
          "You are Neil Sood, a 21-year-old Caucasian male undergraduate at North Carolina State University. " +
          "You are curious, reflective, and enjoy connecting technical coursework to bigger-picture societal impacts. " +
          "You are involved in campus organizations and value teamwork, problem framing, and learning experiences that mirror real-world challenges.",
        stance:
          "Argue that senior design is useful because it teaches collaboration, project planning, and integrating multiple disciplines, " +
          "preparing students for the complexities of professional engineering work.",
      },
      agent2: {
        name: "Agent B",
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

  // editable parameters (shown in settings)
  const [form, setForm] = useState<FormState>(defaults);

  // UI states
  const [openSettings, setOpenSettings] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // pause/resume state
  const [paused, setPaused] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  // editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<string>("");

  // chat scroll state
  const chatRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  useEffect(() => {
    if (!stickToBottom) return;
    const el = chatRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, stickToBottom]);

  // abort any in-flight stream on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const handleChatScroll = () => {
    const el = chatRef.current;
    if (!el) return;
    const threshold = 40;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    setStickToBottom(atBottom);
  };

  const isAgent1 = (speaker: string) =>
    speaker.trim().toLowerCase() === form.agent1.name.trim().toLowerCase();

  // Start negotiation (fresh)
  const onStart = async () => {
    setErr(null);
    setMessages([]);
    setEditingIndex(null);
    setDraft("");
    setStickToBottom(true);
    setPaused(false);
    setLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await postStream(
        API_URL,
        buildPayload({ transcript: "", form }),
        (msg) => {
          if (msg.type === "round") {
            setMessages((prev) => [...prev, { kind: "round", round: msg.round }]);
            return;
          }
          if (msg.type === "turn") {
            const side: "left" | "right" = isAgent1(msg.speaker) ? "left" : "right";
            setMessages((prev) => [
              ...prev,
              { kind: "turn", speaker: msg.speaker, content: msg.content, side },
            ]);
            return;
          }
        },
        controller.signal
      );
    } catch (e: any) {
      if (e?.name === "AbortError") {
        // paused: no error message
      } else {
        setErr(e?.message ?? "Request failed");
      }
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  // Pause streaming in-place
  const onPause = () => {
    if (!loading || paused) return;
    controllerRef.current?.abort();
    setPaused(true);
    setLoading(false);
  };

  // Resume from current transcript
  const onResume = async () => {
    if (!paused) return;
    const transcript = serializeTranscript(messages);

    setErr(null);
    setPaused(false);
    setLoading(true);
    setStickToBottom(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await postStream(
        API_URL,
        buildPayload({ transcript, form }),
        (msg) => {
          if (msg.type === "round") {
            setMessages((prev) => [...prev, { kind: "round", round: msg.round }]);
            return;
          }
          if (msg.type === "turn") {
            const side: "left" | "right" = isAgent1(msg.speaker) ? "left" : "right";
            setMessages((prev) => [
              ...prev,
              { kind: "turn", speaker: msg.speaker, content: msg.content, side },
            ]);
            return;
          }
        },
        controller.signal
      );
    } catch (e: any) {
      if (e?.name === "AbortError") {
        // paused again
      } else {
        setErr(e?.message ?? "Request failed");
      }
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  // Save edit and continue streaming the rest
  const onSaveEdit = async () => {
    if (editingIndex === null) return;

    // apply edit locally
    const updated = [...messages];
    const item = updated[editingIndex];
    if (item && item.kind === "turn") {
      updated[editingIndex] = { ...item, content: draft };
    }
    const prefix = updated.slice(0, editingIndex + 1);
    setMessages(prefix);
    setEditingIndex(null);
    setDraft("");
    setErr(null);
    setStickToBottom(true);
    setPaused(false);
    setLoading(true);

    const transcript = serializeTranscript(prefix);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await postStream(
        API_URL,
        buildPayload({ transcript, form }),
        (msg) => {
          if (msg.type === "round") {
            setMessages((prev) => [...prev, { kind: "round", round: msg.round }]);
            return;
          }
          if (msg.type === "turn") {
            const side: "left" | "right" = isAgent1(msg.speaker) ? "left" : "right";
            setMessages((prev) => [
              ...prev,
              { kind: "turn", speaker: msg.speaker, content: msg.content, side },
            ]);
            return;
          }
        },
        controller.signal
      );
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setErr(e?.message ?? "Request failed");
      }
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  /* ------------------------------- layout -------------------------------- */

  return (
    <div
      style={{
        width: "90vw",
        height: "90vh",
        margin: "5vh auto",
        padding: "2vw",
        boxSizing: "border-box",
        color: colors.text,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Bot–Bot Negotiation</h2>

        {/* Settings gear (SVG) */}
        <Button
          variant="ghost"
          size="sm"
          aria-label="Settings"
          onClick={() => setOpenSettings(true)}
          style={{ display: "inline-flex", gap: 8 }}
          title="Edit negotiation parameters"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.text}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: 6 }}
          >
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82h0A1.65 1.65 0 0 0 20.91 11H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
          Settings
        </Button>
      </div>

      {/* Main: Start button + chat transcript */}
      <Card style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <CardHeader style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardTitle>Negotiation</CardTitle>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={onStart} disabled={loading || paused}>{loading && !paused ? "Running…" : "Start"}</Button>
            <Button variant="outline" onClick={onPause} disabled={!loading || paused}>Pause</Button>
            <Button onClick={onResume} disabled={!paused}>Resume</Button>
          </div>
        </CardHeader>

        <CardContent style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          {err && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                border: "1px solid #7f1d1d",
                background: "#1f1111",
                color: "#fecaca",
                marginBottom: 12,
                flex: "0 0 auto",
              }}
            >
              {err}
            </div>
          )}

          <div
            ref={chatRef}
            onScroll={handleChatScroll}
            style={{
              background: colors.panelAlt,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 12,
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              minHeight: 0,
            }}
          >
            {messages.length === 0 && !loading && (
              <div style={{ color: colors.muted, fontSize: 14 }}>
                Transcript will appear here.
              </div>
            )}

            {messages.map((m, i) =>
              m.kind === "round" ? (
                <RoundDivider key={`r-${i}`} round={m.round} />
              ) : (
                <div
                  key={`t-${i}`}
                  style={{
                    display: "flex",
                    justifyContent: m.side === "left" ? "flex-start" : "flex-end",
                  }}
                >
                  <ChatBubble
                    name={m.speaker}
                    content={editingIndex === i ? draft : m.content}
                    side={m.side}
                    isEditing={editingIndex === i}
                    onEdit={() => {
                      setEditingIndex(i);
                      setDraft(m.content);
                      setStickToBottom(false);
                    }}
                    onChange={(v) => setDraft(v)}
                    onCancel={() => {
                      setEditingIndex(null);
                      setDraft("");
                    }}
                    onSave={onSaveEdit}
                  />
                </div>
              )
            )}
          </div>

          {loading && (
            <div style={{ marginTop: 8, fontSize: 12, color: colors.muted }}>
              {paused ? "Paused." : "Streaming transcript…"}
            </div>
          )}
          {!loading && paused && (
            <div style={{ marginTop: 8, fontSize: 12, color: colors.muted }}>
              Paused. Click Resume to continue.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings modal */}
      <Modal
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        title="Negotiation Settings"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpenSettings(false)}>Save</Button>
          </>
        }
      >
        {/* Basic parameters */}
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

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
            Topic
          </label>
          <Input
            value={form.topic}
            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            placeholder="Negotiation topic"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
            Rules
          </label>
          <Textarea
            rows={6}
            value={form.rules}
            onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
          />
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
      </Modal>
    </div>
  );
}
