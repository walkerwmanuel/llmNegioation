"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/CardBits";
import ChatBubble from "../components/ChatBubble";
import Modal from "../components/Modal";
import { colors } from "../components/ui/colors";

type Agent = { name: string; persona: string; stance: string };
type FormState = {
  model: string;
  topic: string;
  rules: string;
  rounds: number;
  agent1: Agent;
  agent2: Agent;
};

type ChatItem = {
  speaker: string;
  content: string;
  side: "left" | "right";
  prevContent?: string;
};


export default function SpeechToText() {
  const defaults: FormState = useMemo(
    () => ({
      model: "gpt-4o-mini",
      topic: "Is senior design for electrical and computer engineers actually useful?",
      rules:
        "NEGOTIATION RULES:\n1) Begin the negotiation by introducing yourself before you begin your dialogue. \n2) Respond in EXACTLY two sentences per turn after your introduction.\n3) Address the topic directly; cite concrete practices, examples, or trade-offs.\n4) No markdown, no emojis, no bullet points.\n5) Stay civil, concise, and on-topic; avoid generic platitudes.\n6) If referencing evidence, summarize briefly rather than citing sources. \n7) Both agents must reach an agreement by the final round. As such it may be necessary for some level of compromise in each exchange.",
      rounds: 4,
      agent1: {
        name: "You",
        persona: "You are speaking your own thoughts.",
        stance: "Express your genuine opinion.",
      },
      agent2: {
        name: "Dr. Emily Carter",
        persona: "You are Dr. Emily Carter, a 45-year-old Caucasian female social scientist with a Ph.D. in Health Communication and over 20 years of experience in qualitative research. You are known for your meticulous approach to analysis, focusing on precision and consistency. As you analyze the data, ensure that each element is carefully examined and categorized. Pay close attention to the details, and make decisions based on thorough reasoning. Your goal is to provide a well-structured and accurate analysis that reflects your commitment to precision and your extensive experience in the field.",
        stance: "Engage constructively with the human's perspective.",
      },
    }),
    []
  );

  const [form, setForm] = useState<FormState>(defaults);
  const [openSettings, setOpenSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const MAX_RECORDING_TIME = 30; // Max of 30 seconds recording
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [err, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [stickToBottom, setStickToBottom] = useState(true);
  
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const maxTimeoutRef = useRef<number | null>(null);

  const API_URL = "http://localhost:8025/speech-to-text";
  const SETTINGS_URL = "http://localhost:8025/speech-to-text/update-settings";

  // Auto-scroll chat
  useEffect(() => {
    if (!stickToBottom) return;
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, stickToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

    // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        if (openSettings || editingIndex !== null) {
          if ((event.ctrlKey || event.metaKey) &&event.code === "Enter") {
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
      // Space = record
      if (event.code === "Space") {
        event.preventDefault();
        if (!recording) startRecording();
        else stopRecording();
      }
      // 's' = open settings
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setOpenSettings(true);
      }
      // 'e' = edit last response
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "e") {
        event.preventDefault();
        const lastIndex = messages.length - 1;
        if (lastIndex >= 0) {
          setEditingIndex(lastIndex);
          setDraft(messages[lastIndex].content);
          setStickToBottom(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [messages, recording, openSettings, editingIndex]);

  async function startRecording() {   // Start recording audio
    setError(null);
    setRecording(true);
    setRecordingTime(0);

    const chunks: BlobPart[] = [];

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Try to use audio/webm if supported, otherwise fallback to audio/ogg
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/ogg';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      console.log("Using MIME type:", mimeType);

      // Collect audio chunks
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log("Chunk received:", e.data.size, "bytes");
        }
      };

      // When recording stops
      mediaRecorder.onstop = async () => {
        console.log("Recording stopped, processing...");
        
        // Clear timers
        if (timerRef.current) clearInterval(timerRef.current);
        if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);

        try {
          const blob = new Blob(chunks, { type: mimeType });
          console.log("Total blob size:", blob.size, "bytes");
          
          if (blob.size === 0) {
            throw new Error("Recording failed: no audio data captured");
          }

          // Use the appropriate file extension
          const extension = mimeType.includes('webm') ? 'webm' : 'ogg';
          const file = new File([blob], `speech.${extension}`, { type: mimeType });

          const formData = new FormData();
          formData.append("file", file);

          console.log("Sending to API...");
          const res = await fetch(API_URL, { method: "POST", body: formData });
          
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorText}`);
          }
          
          const data = await res.json();
          console.log("Response:", data);

          setMessages((prev) => [
            ...prev,
            { speaker: "You", content: data.you, side: "left" },
            { speaker: form.agent2.name, content: data.bot, side: "right" },
          ]);
        } catch (err: any) {
          console.error("Error processing recording:", err);
          setError(err.message);
        } finally {
          // Clean up stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          setRecording(false);
          setRecordingTime(0);
        }
      };

      // Start recording
      mediaRecorder.start();
      console.log("Recording started...");

      // Update recording time every second
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      maxTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          console.log("Max recording time reached, stopping...");
          stopRecording();
        }
      }, MAX_RECORDING_TIME * 1000);
    } catch (err: any) {
      console.error("Error starting recording:", err);
      setError(err.message);
      setRecording(false);
      setRecordingTime(0);
      
      // Ensure microphone tracks are stopped if error occurs
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("Stopping recording...");
      mediaRecorderRef.current.stop();
    }
  }

  const onSaveEdit = async () => {
    if (editingIndex === null) return;

    const updated = [...messages];
    const item = updated[editingIndex];

    // Preserve the old content to display with strikethrough
    const old = item.content;
    updated[editingIndex] = { ...item, prevContent: old, content: draft };

    setMessages(updated);
    setEditingIndex(null);
    setDraft("");
  };


  return (
    <div
      style={{
        width: "90vw",
        height: "90vh",
        margin: "5vh auto",
        display: "flex",
        flexDirection: "column",
        color: colors.text,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Human-Bot Negotiation</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowShortcuts(false);
              setOpenSettings(true);
            }}
          >
            ⚙ Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowShortcuts((v) => !v)}>
            ? Keyboard Shortcuts
          </Button>
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
          <span>
            <b>Space</b> = Record Audio
          </span>
          <span>
            <b>Control + S</b> = Open Settings
          </span>
          <span>
            <b>Control + E</b> = Edit Last Response
          </span>
        </div>
      )}

      <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <CardHeader style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardTitle>Conversation</CardTitle>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {recording && (
              <span style={{ fontSize: 14, color: colors.muted }}>
                {recordingTime}s / {MAX_RECORDING_TIME}s
              </span>
            )}
            {!recording ? (
              <Button onClick={startRecording}>🎤 Start Recording</Button>
            ) : (
              <Button onClick={stopRecording} variant="outline">
                ⏹ Stop ({MAX_RECORDING_TIME - recordingTime}s)
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {err && (
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid #7f1d1d", background: "#1f1111", color: "#fecaca", marginBottom: 12 }}>
              {err}
            </div>
          )}

          {messages.length === 0 && !recording && (
            <div style={{ color: colors.muted, fontSize: 14 }}>Press 🎤 to record your voice.</div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.side === "left" ? "flex-start" : "flex-end",
              }}
            >
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
          ))}
        </CardContent>
      </Card>

      <Modal
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        title="Conversation Settings"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenSettings(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setOpenSettings(false);
                try {
                  const payload = {
                    model: form.model,
                    topic: form.topic,
                    rules: form.rules,
                    bot: {
                      name: form.agent2.name,
                      personality: form.agent2.persona,
                      goal: form.agent2.stance,
                    },
                  };

                  const res = await fetch(SETTINGS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });

                  if (!res.ok) {
                    throw new Error(`Failed to update settings (status ${res.status})`);
                  }

                  console.log("Settings updated successfully:", payload);
                } catch (err) {
                  console.error("Error updating settings:", err);
                  setError("Failed to save settings");
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        {/* Model */}
        <div style={{ marginBottom: 12 }}>
          <Input
            label="Model"
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          />
        </div>

        {/* Topic */}
        <div style={{ marginBottom: 12 }}>
          <Input
            label="Topic"
            value={form.topic}
            onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
          />
        </div>

        {/* Rules */}
        <div style={{ marginBottom: 12 }}>
          <Textarea
            label="Rules"
            rows={6}
            value={form.rules}
            onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
          />
        </div>

        {/* Bot Settings */}
        <div style={{ marginTop: 20 }}>
          <h4 style={{ marginBottom: 8 }}>Bot Configuration</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input
              label="Bot Name"
              value={form.agent2.name}
              onChange={(e) => setForm((f) => ({ ...f, agent2: { ...f.agent2, name: e.target.value } }))}
            />
            <Textarea
              label="Bot Persona"
              rows={5}
              value={form.agent2.persona}
              onChange={(e) => setForm((f) => ({ ...f, agent2: { ...f.agent2, persona: e.target.value } }))}
            />
            <Textarea
              label="Bot Goal / Stance"
              rows={2}
              value={form.agent2.stance}
              onChange={(e) => setForm((f) => ({ ...f, agent2: { ...f.agent2, stance: e.target.value } }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}