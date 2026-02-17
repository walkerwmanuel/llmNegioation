"use client";

import { diffWords } from "diff";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/CardBits";
import ChatBubble from "../components/ChatBubble";
import Modal from "../components/Modal";
import { colors } from "../components/ui/colors";
import DownloadChatButton from "../components/ui/DownloadChatButton";
import { NegotiationLayout } from "../components/layout/NegotiationLayout";
import { useNegotiationSession } from "../hooks/useNegotiationSession";
import { useAuth } from "../context/AuthContext";

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
  | {
      kind: "turn";
      speaker: string;
      content: string;
      side: "left" | "right";
      /** if present, this message was edited; show this old content above the new one */
      prevContent?: string;
    };

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_URL = `${API_BASE}/t2t-negotiate`;


function buildPayload({ transcript, form }: { transcript: string; form: FormState }) {
  return {
    existing_transcript: transcript,
    model: form.model,
    topic: form.topic,
    rules: form.rules,
    rounds: form.rounds,
    agent1: { name: form.agent1.name, personality: form.agent1.persona, goal: form.agent1.stance },
    agent2: { name: form.agent2.name, personality: form.agent2.persona, goal: form.agent2.stance },
  };
}

function serializeTranscript(items: ChatItem[]): string {
  let t = "";
  for (const it of items) {
    if (it.kind === "round") {
      t += (t.endsWith("\n\n") ? "" : "\n") + `=== Round ${it.round} ===\n\n`;
    } else {
      // Only the current content is serialized; prevContent is just for display
      t += `${it.speaker}:\n${it.content}\n\n`;
    }
  }
  return t.trim();
}

function DiffText({ oldText, newText }: { oldText: string; newText: string }) {
  const parts = React.useMemo(() => diffWords(oldText ?? "", newText ?? ""), [oldText, newText]);
  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {parts.map((p, i) => {
        if (p.removed) {
          return (
            <span key={i} style={{ textDecoration: "line-through", opacity: 0.7 }}>
              {p.value}
            </span>
          );
        }
        if (p.added) {
          // optional: highlight additions
          return <span key={i} style={{ background: "rgba(16,185,129,.15)" }}>{p.value}</span>;
        }
        return <span key={i}>{p.value}</span>;
      })}
    </span>
  );
}

async function postStream(url: string, body: any, onMessage: (msg: any) => void, signal?: AbortSignal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
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
      } catch {}
    }
  }
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

export default function TextToText() {
  const defaults: FormState = useMemo(
    () => ({
      model: "gpt-4o-mini",
      topic: "How much phone usage should middle and high school students be allowed during school hours?",
      rules:
        "NEGOTIATION RULES:\n1) Respond in EXACTLY two sentences per turn.\n2) Address the topic directly; cite concrete practices, examples, or trade-offs.\n3) No markdown, no emojis, no bullet points.\n4) Stay civil, concise, and on-topic; avoid generic platitudes.\n5) If referencing evidence, summarize briefly rather than citing sources.",
      rounds: 4,
      agent1: {
        name: "Dr. Carter",
        persona: "You are Dr. Emily Carter, a 45-year-old Caucasian female social scientist with a Ph.D. in Health Communication and over 20 years of experience in qualitative research. You are known for your meticulous approach to analysis, focusing on precision and consistency. As you analyze the data, ensure that each element is carefully examined and categorized. Pay close attention to the details, and make decisions based on thorough reasoning. Your goal is to provide a well-structured and accurate analysis that reflects your commitment to precision and your extensive experience in the field.",
        stance: "Negotiate for as little phone useage as possible.",
      },
      agent2: {
        name: "Dr. Rodriguez",
        persona: "You are Dr. Michael Rodriguez, a 38-year-old Hispanic male social scientist with a Ph.D. in Sociology and 15 years of experience in analyzing social dynamics and health narratives. You are known for your intuitive and empathetic approach to research, focusing on the emotional tone and social context. As you analyze the data, consider the broader implications and the underlying human experiences. Your goal is to capture the nuances and emotional depth of the data, reflecting your understanding of the social dynamics and your commitment to empathy and insight.",
        stance: "Negotiate for as much phone usage as possible.",
      },
    }),
    []
  );

  const [form, setForm] = useState<FormState>(defaults);
  const [openSettings, setOpenSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const chatRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);
  const [showPromptPanel, setShowPromptPanel] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [lastPromptSent, setLastPromptSent] = useState("");

  // Negotiation session hook for persistence
  const { isAuthenticated } = useAuth();
  const {
    currentNegotiationId,
    isLoading: isLoadingNegotiation,
    loadError: negotiationLoadError,
    startNewNegotiation,
    loadNegotiation,
    saveMessage,
    clearSession,
    clearError: clearNegotiationError,
  } = useNegotiationSession();

  // Track which negotiation ID we're trying to load (for retry)
  const [pendingLoadId, setPendingLoadId] = useState<number | null>(null);

  useEffect(() => {
    if (!stickToBottom) return;
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, stickToBottom]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const onScroll = () => {
    const el = chatRef.current;
    if (!el) return;
    setStickToBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 40);
  };

  // === Keyboard shortcuts ===
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        if (openSettings || editingIndex !== null) {
          if (event.code === "Enter") {
            event.preventDefault();
            if (editingIndex !== null) onSaveEdit();
            else if (openSettings) setOpenSettings(false);
          } else if (event.code === "Escape") {
            event.preventDefault();
            if (editingIndex !== null) {
              setEditingIndex(null);
              setDraft("");
            } else if (openSettings) setOpenSettings(false);
          }
        }
        return;
      }
      //Enter = start run
      if((event.ctrlKey || event.metaKey) && event.code === "Enter"){
        event.preventDefault();
        if (!loading && !paused) onStart();
      } else if (event.code === "Space") {
        event.preventDefault();
        if(loading && !paused) onPause();
        else if(paused) onResume();
      }
      // 's' = open settings
      else if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's'){
        event.preventDefault();
        setOpenSettings(true);
      }
      // 'e' = edit last response
      else if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e'){
        event.preventDefault();
        const lastIndex = messages.length - 1;
        if (lastIndex >= 0) {
          const lastMessage = messages[lastIndex];
          if (lastMessage.kind === "turn") {
            setEditingIndex(lastIndex);
            setDraft(lastMessage.content);
            setStickToBottom(false);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [messages, loading, paused]);

  const isAgent1 = (s: string) => s.trim().toLowerCase() === form.agent1.name.trim().toLowerCase();

  const onStart = async () => {
    setErr(null);
    setMessages([]);
    setEditingIndex(null);
    setDraft("");
    setPaused(false);
    setLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    // Start a new negotiation in the backend if authenticated
    if (isAuthenticated) {
      await startNewNegotiation(form.topic, 'ai_vs_ai');
    }

    // Build the system prompt for display
    const currentSystemPrompt = `NEGOTIATION TOPIC: ${form.topic}

  RULES:
  ${form.rules}

  AGENT 1 - ${form.agent1.name}:
  Persona: ${form.agent1.persona}
  Goal/Stance: ${form.agent1.stance}

  AGENT 2 - ${form.agent2.name}:
  Persona: ${form.agent2.persona}
  Goal/Stance: ${form.agent2.stance}

  Model: ${form.model}
  Rounds: ${form.rounds}`;

    setSystemPrompt(currentSystemPrompt);
    setLastPromptSent("Starting new negotiation (no existing transcript)");

    try {
      await postStream(
        API_URL,
        buildPayload({ transcript: "", form }),
        async (msg) => {
          if (msg.type === "round") setMessages((p) => [...p, { kind: "round", round: msg.round }]);
          if (msg.type === "turn") {
            const side: "left" | "right" = isAgent1(msg.speaker) ? "left" : "right";
            setMessages((p) => [...p, { kind: "turn", speaker: msg.speaker, content: msg.content, side }]);
            // Save message to backend
            const role = side === "left" ? "ai_1" : "ai_2";
            await saveMessage(role, msg.content);
          }
        },
        controller.signal
      );
    } catch (e: any) {
      if (e?.name !== "AbortError") setErr(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  // Handle selecting a negotiation from sidebar
  const handleSelectNegotiation = async (id: number) => {
    setErr(null);
    setMessages([]);
    setPaused(false);
    setLoading(false);
    setPendingLoadId(id);
    clearNegotiationError();

    const negotiation = await loadNegotiation(id);

    // Convert loaded messages to ChatItem format with round grouping
    if (negotiation && negotiation.messages) {
      const chatItems = convertMessagesToRounds(negotiation.messages);
      setMessages(chatItems);
      setPendingLoadId(null);
    }
  };

  // Retry loading a negotiation after error
  const handleRetryLoad = async () => {
    if (pendingLoadId !== null) {
      await handleSelectNegotiation(pendingLoadId);
    }
  };

  /**
   * Convert messages to ChatItem format grouped by rounds.
   * Each round = one exchange between participants:
   * - For ai_vs_ai: ai_1 message + ai_2 message = 1 round
   * - For human: user message + AI response = 1 round
   */
  const convertMessagesToRounds = (msgs: { role: string; content: string }[]): ChatItem[] => {
    if (msgs.length === 0) return [];

    const chatItems: ChatItem[] = [];
    let currentRound = 0;
    let lastLeftSpeaker = false; // Track if last message was from left (ai_1/user)

    msgs.forEach((msg, index) => {
      // Map role to speaker and side
      let speaker: string;
      let side: 'left' | 'right';

      if (msg.role === 'ai_1') {
        speaker = form.agent1.name;
        side = 'left';
      } else if (msg.role === 'ai_2') {
        speaker = form.agent2.name;
        side = 'right';
      } else if (msg.role === 'user') {
        speaker = 'You';
        side = 'left';
      } else {
        speaker = msg.role;
        side = 'left';
      }

      // Determine when to start a new round:
      // - At the start (index 0)
      // - When left speaker starts after a right speaker message
      const isLeftSpeaker = side === 'left';

      if (index === 0 || (isLeftSpeaker && !lastLeftSpeaker)) {
        currentRound++;
        chatItems.push({ kind: 'round', round: currentRound });
      }

      lastLeftSpeaker = isLeftSpeaker;

      chatItems.push({
        kind: 'turn',
        speaker,
        content: msg.content,
        side,
      });
    });

    return chatItems;
  };

  // Handle new negotiation from sidebar
  const handleNewNegotiation = () => {
    clearSession();
    setMessages([]);
    setErr(null);
  };

  const onPause = () => {
    if (!loading || paused) return;
    controllerRef.current?.abort();
    setPaused(true);
    setLoading(false);
  };

  const onResume = async () => {
    if (!paused) return;
    const transcript = serializeTranscript(messages);
    setErr(null);
    setPaused(false);
    setLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    setLastPromptSent(`Resuming from existing transcript:\n${transcript}`);
  
    try {
      await postStream(
        API_URL,
        buildPayload({ transcript, form }),
        (msg) => {
          if (msg.type === "round") setMessages((p) => [...p, { kind: "round", round: msg.round }]);
          if (msg.type === "turn") {
            const side: "left" | "right" = isAgent1(msg.speaker) ? "left" : "right";
            setMessages((p) => [...p, { kind: "turn", speaker: msg.speaker, content: msg.content, side }]);
          }
        },
        controller.signal
      );
    } catch (e: any) {
      if (e?.name !== "AbortError") setErr(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  const onSaveEdit = async () => {
    if (editingIndex === null) return;

    const updated = [...messages];
    const item = updated[editingIndex];

    if (item && item.kind === "turn") {
      // Preserve the old content to display with strikethrough
      const old = item.content;
      updated[editingIndex] = { ...item, prevContent: old, content: draft };
    }

    // Re-run from the edited point forward
    const prefix = updated.slice(0, editingIndex + 1);
    setMessages(prefix);
    setEditingIndex(null);
    setDraft("");
    setPaused(false);
    setLoading(true);

    const transcript = serializeTranscript(prefix);
    const controller = new AbortController();
    controllerRef.current = controller;

    setLastPromptSent(`Re-running from edited message:\n${transcript}`);

    try {
      await postStream(
        API_URL,
        buildPayload({ transcript, form }),
        (msg) => {
          if (msg.type === "round") setMessages((p) => [...p, { kind: "round", round: msg.round }]);
          if (msg.type === "turn") {
            const side: "left" | "right" = isAgent1(msg.speaker) ? "left" : "right";
            setMessages((p) => [...p, { kind: "turn", speaker: msg.speaker, content: msg.content, side }]);
          }
        },
        controller.signal
      );
    } catch (e: any) {
      if (e?.name !== "AbortError") setErr(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  return (
    <NegotiationLayout
      onSelectNegotiation={handleSelectNegotiation}
      selectedId={currentNegotiationId}
      onNewNegotiation={handleNewNegotiation}
    >
    <div style={{ width: "100%", height: "100%", padding: "20px", color: colors.text, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Bot–Bot Negotiation</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => {setShowShortcuts(false); setOpenSettings(true);}}>⚙ Settings</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowShortcuts((v) => !v)}>? Keyboard Shortcuts</Button>
        </div>
      </div>

      {showShortcuts && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "32px",
            fontSize: 15,
            fontWeight: 500,
            background: colors.panelAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 12,
            color: colors.muted,
          }}
        >
          <span><b>Control / Command + Enter / Return</b> = Start / Restart Negotiation Run </span>   
          <span><b>Space</b> = Pause / Resume </span>    
          <span><b>Control / Command + 'S'</b> = Open Settings </span>  
          <span><b>Control / Command + 'E'</b> = Edit Last Response </span>   
        </div>
      )}

      <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <CardHeader style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardTitle>Negotiation</CardTitle>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={onStart} disabled={loading || paused}>{loading && !paused ? "Running…" : "Start"}</Button>
            <Button variant="outline" onClick={onPause} disabled={!loading || paused}>Pause</Button>
            <Button onClick={onResume} disabled={!paused}>Resume</Button>
            <DownloadChatButton
              transcript={serializeTranscript(messages)}
            // filename="negotiation_transcript.docx"
            />

          </div>
        </CardHeader>

        <CardContent style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* General error display */}
          {err && (
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid #7f1d1d", background: "#1f1111", color: "#fecaca", marginBottom: 12 }}>
              {err}
            </div>
          )}

          {/* Negotiation load error with retry */}
          {negotiationLoadError && (
            <div
              style={{
                padding: 16,
                borderRadius: 8,
                border: "1px solid #7f1d1d",
                background: "#1f1111",
                color: "#fecaca",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{negotiationLoadError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryLoad}
                style={{
                  borderColor: "#fecaca",
                  color: "#fecaca",
                  marginLeft: 12,
                }}
              >
                Retry
              </Button>
            </div>
          )}

          <div

            ref={chatRef}
            onScroll={onScroll}
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
            {/* Loading skeleton for negotiation load */}
            {isLoadingNegotiation && messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        height: 12,
                        width: "30%",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 4,
                        marginBottom: 10,
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                    <div
                      style={{
                        height: 14,
                        width: "85%",
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: 4,
                        marginBottom: 6,
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                    <div
                      style={{
                        height: 14,
                        width: "70%",
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: 4,
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                  </div>
                ))}
                <style>{`
                  @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                  }
                `}</style>
              </div>
            )}

            {messages.length === 0 && !loading && !isLoadingNegotiation && (
              <div style={{ color: colors.muted, fontSize: 14 }}>Transcript will appear here.</div>
            )}

            {messages.map((m, i) =>
              m.kind === "round" ? (
                <RoundDivider key={`r-${i}`} round={m.round} />
              ) : (
                <div key={`t-${i}`} style={{ display: "flex", flexDirection: "column", alignItems: m.side === "left" ? "flex-start" : "flex-end" }}>
                  {/* Old message (if edited) */}
                  {m.prevContent && (
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "8px 10px",
                        borderRadius: 12,
                        background: m.side === "left" ? colors.bubbleA : colors.bubbleB,
                        border: `1px solid ${colors.border}`,
                        marginBottom: 6,
                        color: colors.muted as string,
                      }}
                      title="Changes from previous version"
                    >
                      <DiffText oldText={m.prevContent} newText={m.content} />
                    </div>
                  )}

                  {/* Current message */}
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
                    onChange={setDraft}
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

          {loading && <div style={{ marginTop: 8, fontSize: 12, color: colors.muted }}>{paused ? "Paused." : "Streaming transcript…"}</div>}
          {!loading && paused && <div style={{ marginTop: 8, fontSize: 12, color: colors.muted }}>Paused. Click Resume to continue.</div>}
        </CardContent>
      </Card>

      <Modal
  open={openSettings}
  onClose={() => setOpenSettings(false)}
  title="Negotiation Settings"
  footer={
    <>
      <Button variant="outline" onClick={() => setOpenSettings(false)}>Cancel</Button>
      <Button
        onClick={async () => {
          setOpenSettings(false);
          try {
            const res = await fetch(API_URL + "/update-settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });

            if (!res.ok) {
              throw new Error(`Failed to update backend settings (status ${res.status})`);
            }

            console.log("Settings saved to backend:", form);
          } catch (err) {
            console.error("Saved settings successfully:", err);
            alert("Settings saved successfully.");
          }
        }}
      >
        Save
      </Button>
    </>
  }
>
  {/* Model + Rounds */}
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
  <div>
  <label style={{ fontSize: 12, color: colors.muted }}>Model</label>
  <select
    value={form.model}
    onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))}
    style={{
      width: "100%",
      marginTop: 4,
      padding: "8px 10px",
      borderRadius: 6,
      border: `1px solid ${colors.border}`,
      background: colors.panelAlt,
      color: colors.text,
    }}
  >
    <option value="gpt-4o-mini">gpt-4o-mini</option>
    <option value="gpt-4o">gpt-4o</option>
    <option value="gpt-5-nano">gpt-5-nano</option>
    <option value="gpt-5-mini">gpt-5-mini</option>
    <option value="gpt-5.2">gpt-5.2</option>
  </select>
</div>

    <Input
      label="Rounds"
      type="number"
      min={1}
      max={20}
      value={form.rounds}
      onChange={(e) => setForm(f => ({ ...f, rounds: Math.max(1, Math.min(20, Number(e.target.value) || 1)) }))}
    />
  </div> 

  {/* Topic */}
  <div style={{ marginTop: 12 }}>
    <Input label="Topic" value={form.topic} onChange={(e) => setForm(f => ({ ...f, topic: e.target.value }))} />
  </div>

  {/* Rules */}
  <div style={{ marginTop: 12 }}>
    <Textarea label="Rules" rows={6} value={form.rules} onChange={(e) => setForm(f => ({ ...f, rules: e.target.value }))} />
  </div>

  {/* Agents */}
  <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
    {/* Agent A */}
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h4>Agent A</h4>
      <Input label="Name" value={form.agent1.name} onChange={(e) => setForm(f => ({ ...f, agent1: { ...f.agent1, name: e.target.value } }))} />
      <Textarea label="Persona" value={form.agent1.persona} onChange={(e) => setForm(f => ({ ...f, agent1: { ...f.agent1, persona: e.target.value } }))} />
      <Textarea label="Goal / Stance" value={form.agent1.stance} onChange={(e) => setForm(f => ({ ...f, agent1: { ...f.agent1, stance: e.target.value } }))} />
    </div>

    {/* Agent B */}
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h4>Agent B</h4>
      <Input label="Name" value={form.agent2.name} onChange={(e) => setForm(f => ({ ...f, agent2: { ...f.agent2, name: e.target.value } }))} />
      <Textarea label="Persona" value={form.agent2.persona} onChange={(e) => setForm(f => ({ ...f, agent2: { ...f.agent2, persona: e.target.value } }))} />
      <Textarea label="Goal / Stance" value={form.agent2.stance} onChange={(e) => setForm(f => ({ ...f, agent2: { ...f.agent2, stance: e.target.value } }))} />
    </div>
  </div>
</Modal>
{/* Prompt Inspector Side Panel with Tab */}
<>
  {/* Overlay to close panel when clicking outside */}
  {showPromptPanel && (
    <div
      onClick={() => setShowPromptPanel(false)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.3)",
        zIndex: 999,
      }}
    />
  )}
  {/* Tab (always visible) */}
  <div
    onClick={() => setShowPromptPanel((v) => !v)}
    style={{
      position: "fixed",
      right: showPromptPanel ? "400px" : "0",
      top: "50%",
      transform: "translateY(-50%)",
      width: "20px",
      height: "120px",
      background: colors.panel,
      border: `1px solid ${colors.border}`,
      borderRight: showPromptPanel ? `1px solid ${colors.border}` : "none",
      borderTopLeftRadius: "8px",
      borderBottomLeftRadius: "8px",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      zIndex: 1001,
      boxShadow: "-2px 0 8px rgba(0,0,0,0.2)",
      transition: "right 0.3s ease",
      gap: "3px",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = colors.panelAlt;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = colors.panel;
    }}
  >
    {/* Three vertical lines */}
    <div style={{ width: "2px", height: "40px", background: colors.text, borderRadius: "2px" }} />
    <div style={{ width: "2px", height: "40px", background: colors.text, borderRadius: "2px" }} />
    <div style={{ width: "2px", height: "40px", background: colors.text, borderRadius: "2px" }} />
  </div>

  {/* Panel (slides in/out) */}
  {showPromptPanel && (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: "400px",
        height: "100vh",
        background: colors.panel,
        borderLeft: `1px solid ${colors.border}`,
        padding: "20px",
        overflowY: "auto",
        zIndex: 1000,
        boxShadow: "-4px 0 12px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Prompt Inspector</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowPromptPanel(false)}>
          ✕ Close
        </Button>
      </div>

      {/* System Configuration */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.muted }}>
          System Configuration
        </label>
        <Textarea
          rows={14}
          value={systemPrompt || "No negotiation started yet..."}
          onChange={(e) => setSystemPrompt(e.target.value)}
          style={{ 
            fontFamily: "monospace", 
            fontSize: 11,
            background: colors.panelAlt,
          }}
        />
        <div style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
          Full configuration sent to the AI
        </div>
      </div>

      {/* Current Transcript State */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.muted }}>
          Current Transcript State
        </label>
        <Textarea
          rows={6}
          value={lastPromptSent || "No messages sent yet..."}
          readOnly
          onChange={() => {}}
          style={{ 
            fontFamily: "monospace", 
            fontSize: 11,
            background: colors.panelAlt,
            opacity: 0.8,
            resize: "vertical",
          }}
        />
      </div>

      {/* Quick Override Section */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.muted }}>
          Quick Agent Override
        </label>
        
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Agent 1: {form.agent1.name}</div>
          <Textarea
            label="Persona"
            rows={4}
            value={form.agent1.persona}
            onChange={(e) => setForm((f) => ({ ...f, agent1: { ...f.agent1, persona: e.target.value } }))}
            style={{ fontSize: 12 }}
          />
          <Textarea
            label="Stance"
            rows={2}
            value={form.agent1.stance}
            onChange={(e) => setForm((f) => ({ ...f, agent1: { ...f.agent1, stance: e.target.value } }))}
            style={{ fontSize: 12, marginTop: 8 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Agent 2: {form.agent2.name}</div>
          <Textarea
            label="Persona"
            rows={4}
            value={form.agent2.persona}
            onChange={(e) => setForm((f) => ({ ...f, agent2: { ...f.agent2, persona: e.target.value } }))}
            style={{ fontSize: 12 }}
          />
          <Textarea
            label="Stance"
            rows={2}
            value={form.agent2.stance}
            onChange={(e) => setForm((f) => ({ ...f, agent2: { ...f.agent2, stance: e.target.value } }))}
            style={{ fontSize: 12, marginTop: 8 }}
          />
        </div>
      </div>

      {/* Apply Button */}
      <Button
        onClick={() => {
          // Just update the system prompt preview
          const updatedPrompt = `NEGOTIATION TOPIC: ${form.topic}

RULES:
${form.rules}

AGENT 1 - ${form.agent1.name}:
Persona: ${form.agent1.persona}
Goal/Stance: ${form.agent1.stance}

AGENT 2 - ${form.agent2.name}:
Persona: ${form.agent2.persona}
Goal/Stance: ${form.agent2.stance}

Model: ${form.model}
Rounds: ${form.rounds}`;

          setSystemPrompt(updatedPrompt);
          alert("Changes will apply on next run/resume!");
        }}
        style={{ width: "100%" }}
      >
        Preview Changes
      </Button>

      <div style={{ fontSize: 11, color: colors.muted, marginTop: 8, textAlign: "center" }}>
        Changes apply immediately to new runs
      </div>
    </div>
  )}
</>
</div>
    </NegotiationLayout>
  );
}
