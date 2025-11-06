"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/CardBits";
import ChatBubble from "../components/ChatBubble";
import Modal from "../components/Modal";
import { colors } from "../components/ui/colors";
// import DownloadChatButton from "../components/ui/DownloadChatButton";

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

const API_URL = "http://localhost:8025/t2t-negotiate";

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
      topic: "Is senior design for electrical and computer engineers actually useful?",
      rules:
        "NEGOTIATION RULES:\n1) Respond in EXACTLY two sentences per turn.\n2) Address the topic directly; cite concrete practices, examples, or trade-offs.\n3) No markdown, no emojis, no bullet points.\n4) Stay civil, concise, and on-topic; avoid generic platitudes.\n5) If referencing evidence, summarize briefly rather than citing sources.",
      rounds: 4,
      agent1: {
        name: "Agent A",
        persona: "You are Neil Sood, a reflective NC State undergrad.",
        stance: "Senior design is useful for teamwork and integration.",
      },
      agent2: {
        name: "Agent B",
        persona: "You are Kaden Nelson, pragmatic and resume-focused.",
        stance: "Internships provide more value than classroom projects.",
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

  useEffect(() => {     // NEIL CHANGE
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if(target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable){
        if(openSettings || editingIndex !== null){
          if(event.code === "Enter"){
            event.preventDefault();
            if(editingIndex !== null) onSaveEdit();
            else if(openSettings) setOpenSettings(false);
          } else if(event.code === "Escape"){
            event.preventDefault();
            if(editingIndex !== null){
              setEditingIndex(null);
              setDraft("");
            } else if(openSettings) setOpenSettings(false);
          }
        }
        return;
      }
      //Enter = start run
      if((event.ctrlKey || event.metaKey) && event.code === "Enter"){
        event.preventDefault();
        if(!loading && !paused) onStart();
        return;
      }
      //Space (pause/resume)
      if(event.code === "Space"){
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
        if(lastIndex >= 0){
          const lastMessage = messages[lastIndex];
          if(lastMessage.kind === "turn"){
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

    try {
      await postStream(
        API_URL,
        buildPayload({ transcript: "", form }),
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
    <div style={{ width: "90vw", height: "90vh", margin: "5vh auto", color: colors.text, display: "flex", flexDirection: "column" }}>
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
          <span><b>Control + 'S'</b> = Open Settings </span>  
          <span><b>Control + 'E'</b> = Edit Last Response </span>   
        </div>
      )}

      <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <CardHeader style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardTitle>Negotiation</CardTitle>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={onStart} disabled={loading || paused}>{loading && !paused ? "Running…" : "Start"}</Button>
            <Button variant="outline" onClick={onPause} disabled={!loading || paused}>Pause</Button>
            <Button onClick={onResume} disabled={!paused}>Resume</Button>
            {/* <DownloadChatButton targetId="chat-container" filename="negotiation_transcript.pdf" /> */}
          </div>
        </CardHeader>

        <CardContent style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {err && (
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid #7f1d1d", background: "#1f1111", color: "#fecaca", marginBottom: 12 }}>
              {err}
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
            {messages.length === 0 && !loading && (
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
                        opacity: 0.6,
                        color: colors.muted as string,
                        textDecoration: "line-through",
                        whiteSpace: "pre-wrap",
                      }}
                      title="Previous version"
                    >
                      {m.prevContent}
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
            <Button onClick={() => setOpenSettings(false)}>Save</Button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Model" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
          <Input
            label="Rounds"
            type="number"
            min={1}
            max={20}
            value={form.rounds}
            onChange={(e) => setForm((f) => ({ ...f, rounds: Math.max(1, Math.min(20, Number(e.target.value) || 1)) }))}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <Input label="Topic" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} />
        </div>

        <div style={{ marginTop: 12 }}>
          <Textarea label="Rules" rows={6} value={form.rules} onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
