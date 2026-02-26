"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { diffWords } from "diff";
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
  agent2: Agent; // BOT
};

type ChatItem = {
  speaker: string;
  content: string;
  side: "left" | "right";
  prevContent?: string;
};

const spinnerKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

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
          return (
            <span key={i} style={{ background: "rgba(16,185,129,.15)" }}>
              {p.value}
            </span>
          );
        }
        return <span key={i}>{p.value}</span>;
      })}
    </span>
  );
}

export default function VoiceToVoice() {
  const defaults: FormState = useMemo(
    () => ({
      model: "gpt-4o-mini",
      topic: "Negotiation over the price of Emily's used car.",
      rules:
        "NEGOTIATION RULES:\n1) Respond in EXACTLY two sentences per turn after your introduction.\n2) Focus on concrete details like price, car condition, and the current limited supply of cars.\n3) No markdown, no emojis, no bullet points.\n4) Stay civil, concise, and on-topic; avoid generic platitudes.\n5) Do not lie about the car’s condition or history, but you may use scarcity and anchoring in your negotiation.",
      agent2: {
        name: "Emily",
        persona:
          "You are Emily, a car owner trying to sell your used car for $15,000. You know the car is probably worth less, but you want to take advantage of the current limited supply of cars by anchoring high and emphasizing scarcity, while still remaining honest about its condition.",
        stance:
          "Aim to keep the final price as close to $15,000 as possible by stressing the limited market and the car’s positives, but be prepared to compromise enough to close the deal.",
      },
    }),
    []
  );

  const [form, setForm] = useState<FormState>(defaults);
  const [openSettings, setOpenSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const MAX_RECORDING_TIME = 30;

  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [err, setError] = useState<string | null>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const [stickToBottom, setStickToBottom] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [hasTranscript, setHasTranscript] = useState(false);

  // Prompt inspector panel
  const [showPromptPanel, setShowPromptPanel] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [lastPromptSent, setLastPromptSent] = useState("");

  // Voice playback (TTS) for bot response
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const maxTimeoutRef = useRef<number | null>(null);
  const [sendingToBot, setSendingToBot] = useState(false);

  // Keep latest form for callbacks without dependency churn
  const formRef = useRef<FormState>(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

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

  // Track pending load ID for retry
  const [pendingLoadId, setPendingLoadId] = useState<number | null>(null);

  // API endpoints
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const TRANSCRIBE_URL = `${API_BASE}/speech-to-text/transcribe`;
  const RESPOND_URL = `${API_BASE}/speech-to-text/respond`;
  const SETTINGS_URL = `${API_BASE}/speech-to-text/update-settings`;

  const speakText = (text: string) => {
    try {
      if (!ttsEnabled) return;
      if (!("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utter);
    } catch {
      // ignore
    }
  };

  const stopSpeaking = () => {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    } finally {
      setSpeaking(false);
    }
  };

  const postSettings = async () => {
    const f = formRef.current;
    const payload = {
      model: f.model,
      topic: f.topic,
      rules: f.rules,
      bot: {
        name: f.agent2.name,
        personality: f.agent2.persona,
        goal: f.agent2.stance,
      },
    };

    const res = await fetch(SETTINGS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Failed to update settings (status ${res.status}): ${t}`);
    }
  };

  // Handle selecting a negotiation from sidebar
  const handleSelectNegotiation = async (id: number) => {
    setPendingLoadId(id);
    clearNegotiationError();

    const negotiation = await loadNegotiation(id);
    if (negotiation) {
      const botName = formRef.current.agent2.name;

      const loadedMessages: ChatItem[] = (negotiation.messages || []).map((m) => ({
        speaker: m.role === "user" ? "You" : botName,
        content: m.content,
        side: m.role === "user" ? ("left" as const) : ("right" as const),
      }));

      setMessages(loadedMessages);
      setPendingLoadId(null);
    }
  };

  const handleRetryLoad = async () => {
    if (pendingLoadId !== null) await handleSelectNegotiation(pendingLoadId);
  };

  const handleNewNegotiation = () => {
    clearSession();
    setMessages([]);
    setError(null);
    setTranscript("");
    setHasTranscript(false);
    stopSpeaking();
  };

  // Auto-scroll chat
  useEffect(() => {
    if (!stickToBottom) return;
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, stickToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      } catch {
        // ignore
      }
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize settings on mount
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        await postSettings();
      } catch (e: any) {
        setError(e.message || "Failed to initialize settings");
      }
    };
    initializeSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // If typing in an input/textarea, only handle modal/edit save/cancel
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        if (openSettings || editingIndex !== null) {
          if ((event.ctrlKey || event.metaKey) && event.code === "Enter") {
            event.preventDefault();
            if (editingIndex !== null) void onSaveEdit();
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

      // Ctrl/Cmd+Enter send transcript
      if ((event.ctrlKey || event.metaKey) && event.code === "Enter" && hasTranscript && transcript.trim() && !sendingToBot) {
        event.preventDefault();
        void sendTranscriptToBot();
        return;
      }

      // Space: start/stop recording
      if (event.code === "Space") {
        event.preventDefault();
        if (!recording) void startRecording();
        else stopRecording();
        return;
      }

      // Ctrl/Cmd+S: settings
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setOpenSettings(true);
        return;
      }

      // Ctrl/Cmd+E: edit last message
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "e") {
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
  }, [messages, recording, openSettings, editingIndex, hasTranscript, transcript, sendingToBot]);

  async function startRecording() {
    setError(null);
    setRecording(true);
    setRecordingTime(0);

    const chunks: BlobPart[] = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        if (maxTimeoutRef.current) window.clearTimeout(maxTimeoutRef.current);

        try {
          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size === 0) throw new Error("Recording failed: no audio data captured");

          const extension = mimeType.includes("webm") ? "webm" : "ogg";
          const file = new File([blob], `speech.${extension}`, { type: mimeType });

          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch(TRANSCRIBE_URL, { method: "POST", body: formData });

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorText}`);
          }

          const data = await res.json();
          if (!data.transcript) throw new Error("No transcript returned from server");

          setTranscript(data.transcript);
          setHasTranscript(true);
        } catch (e: any) {
          setError(e.message || "Failed to transcribe audio");
        } finally {
          try {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
          } catch {
            // ignore
          }
          setRecording(false);
          setRecordingTime(0);
        }
      };

      mediaRecorder.start();

      timerRef.current = window.setInterval(() => setRecordingTime((prev) => prev + 1), 1000);

      maxTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          stopRecording();
        }
      }, MAX_RECORDING_TIME * 1000);
    } catch (e: any) {
      setError(e.message || "Failed to start recording");
      setRecording(false);
      setRecordingTime(0);

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      } catch {
        // ignore
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  const onSaveEdit = async () => {
    if (editingIndex === null) return;

    try {
      setError(null);

      const updated = [...messages];
      const item = updated[editingIndex];

      const old = item.content;
      updated[editingIndex] = { ...item, prevContent: old, content: draft };

      const prefix = updated.slice(0, editingIndex + 1);
      setMessages(prefix);

      setEditingIndex(null);
      setDraft("");

      // Only re-call bot if user edited their own message
      if (item.speaker === "You") {
        const res = await fetch(RESPOND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: draft.trim() }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        if (data?.error) throw new Error(data.error);
        if (!data?.bot) throw new Error("Unexpected response from server");

        setMessages((prev) => [
          ...prev,
          { speaker: formRef.current.agent2.name, content: String(data.bot), side: "right" },
        ]);

        speakText(String(data.bot));
      }
    } catch (e: any) {
      setError(e.message || "Failed to save edit and get response");
    }
  };

  async function sendTranscriptToBot() {
    if (sendingToBot) return;

    try {
      setError(null);
      setSendingToBot(true);

      const cleaned = transcript.trim();
      if (!cleaned) throw new Error("Transcript is empty. Please type something before sending.");

      const f = formRef.current;

      const currentSystemPrompt = `You are ${f.agent2.name}.

${f.agent2.persona}

Your goal: ${f.agent2.stance}

Topic of conversation: ${f.topic}

${f.rules}

Respond to the users message following these guidelines.`;

      setSystemPrompt(currentSystemPrompt);
      setLastPromptSent(`User message: ${cleaned}`);

      const res = await fetch(RESPOND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleaned }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      if (!data?.you || !data?.bot) throw new Error("Unexpected response from server");

      // Add to chat history
      setMessages((prev) => [
        ...prev,
        { speaker: "You", content: String(data.you), side: "left" },
        { speaker: f.agent2.name, content: String(data.bot), side: "right" },
      ]);

      // Speak bot response (voice-to-voice behavior)
      speakText(String(data.bot));

      // Save messages if authenticated
      if (isAuthenticated) {
        let negId = currentNegotiationId;

        if (!negId) {
          // keep your backend type naming consistent — if you use 'voice_to_voice' in DB, use it here
          negId = await startNewNegotiation(f.topic, "voice_to_voice");
        }

        if (negId) {
          await saveMessage("user", String(data.you), negId);
          await saveMessage("ai_1", String(data.bot), negId);
        }
      }

      setTranscript("");
      setHasTranscript(false);
    } catch (e: any) {
      setError(e.message || "Failed to send transcript to bot");
    } finally {
      setSendingToBot(false);
    }
  }

  const chatTranscript = useMemo(() => {
    if (messages.length === 0) return "";
    return messages.map((m) => `${m.speaker}: ${m.content}`).join("\n\n");
  }, [messages]);

  return (
    <NegotiationLayout
      onSelectNegotiation={handleSelectNegotiation}
      selectedId={currentNegotiationId}
      onNewNegotiation={handleNewNegotiation}
      negotiationType="voice_to_voice"
    >
      <style>{spinnerKeyframes}</style>

      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          color: colors.text,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Voice ↔ Voice Negotiation</h2>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setTtsEnabled((v) => !v)}
              title="Toggle bot voice playback"
            >
              {ttsEnabled ? "AI Voice: ON" : "AI Voice: OFF"}
            </Button>

            <Button variant="outline" size="sm" onClick={stopSpeaking} disabled={!speaking}>
              Stop Voice
            </Button>

            <DownloadChatButton transcript={chatTranscript} />
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
              <b>Space</b> = Start/Stop Recording Audio
            </span>
            <span>
              <b>Control / Command + Enter / Return</b> = Send Audio Transcript to Bot
            </span>
            <span>
              <b>Control / Command + S</b> = Open Settings
            </span>
            <span>
              <b>Control / Command + E</b> = Edit Last Response
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
                <Button onClick={startRecording} disabled={sendingToBot || isLoadingNegotiation}>
                  🎤 Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="outline">
                  ⏹ Stop ({Math.max(0, MAX_RECORDING_TIME - recordingTime)}s)
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent
            ref={chatRef}
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
              setStickToBottom(nearBottom);
            }}
          >
            {err && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #7f1d1d",
                  background: "#1f1111",
                  color: "#fecaca",
                  marginBottom: 12,
                }}
              >
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
                  style={{ borderColor: "#fecaca", color: "#fecaca", marginLeft: 12 }}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Loading skeleton */}
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

            {messages.length === 0 && !recording && !hasTranscript && !isLoadingNegotiation && (
              <div style={{ color: colors.muted, fontSize: 14 }}>
                Press 🎤 to record. After transcription, send it — the bot will respond and speak back.
              </div>
            )}

            {/* Chat messages */}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.side === "left" ? "flex-start" : "flex-end",
                }}
              >
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
                  editedAt={undefined}
                  originalContent={undefined}
                />
              </div>
            ))}

            {hasTranscript && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.panelAlt,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  opacity: sendingToBot ? 0.6 : 1,
                  pointerEvents: sendingToBot ? "none" : "auto",
                }}
              >
                <div style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>
                  {sendingToBot ? <span>Sending to Bot...</span> : <span>Edit your transcript, then send.</span>}
                </div>

                <Textarea
                  label="Transcript"
                  rows={4}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  disabled={sendingToBot}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasTranscript(false);
                      setTranscript("");
                    }}
                    disabled={sendingToBot}
                  >
                    Discard
                  </Button>

                  <Button size="sm" onClick={sendTranscriptToBot} disabled={sendingToBot || !transcript.trim()}>
                    {sendingToBot ? "Sending..." : "Send to Bot"}
                  </Button>
                </div>

                {sendingToBot && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 12,
                      color: colors.muted,
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: `2px solid ${colors.border}`,
                        borderTopColor: colors.text,
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <span>Processing your message...</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SETTINGS MODAL */}
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
                  try {
                    await postSettings();
                    setOpenSettings(false);
                  } catch (e: any) {
                    setError(e.message || "Failed to save settings");
                  }
                }}
              >
                Save
              </Button>
            </>
          }
        >
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: colors.muted }}>Model</label>
            <select
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
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
              <option value="deepseek-chat">deepseek-chat</option>
              <option value="grok-4-1-fast-non-reasoning">grok-4-1-fast-non-reasoning</option>
              <option value="grok-4-1-fast-reasoning">grok-4-1-fast-reasoning</option>
              <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro</option>
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Input
              label="Topic"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <Textarea
              label="Rules"
              rows={6}
              value={form.rules}
              onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
            />
          </div>

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

        {/* Prompt Inspector Side Panel with Tab */}
        <>
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
            <div style={{ width: "2px", height: "40px", background: colors.text, borderRadius: "2px" }} />
            <div style={{ width: "2px", height: "40px", background: colors.text, borderRadius: "2px" }} />
            <div style={{ width: "2px", height: "40px", background: colors.text, borderRadius: "2px" }} />
          </div>

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
                animation: "slideIn 0.3s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Prompt Inspector</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowPromptPanel(false)}>
                  ✕ Close
                </Button>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: colors.muted,
                  }}
                >
                  System Prompt
                </label>
                <Textarea
                  rows={12}
                  value={systemPrompt || "No prompt sent yet..."}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    background: colors.panelAlt,
                  }}
                />
                <div style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>This is the system message sent to the AI</div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: colors.muted,
                  }}
                >
                  Last User Message
                </label>
                <Textarea
                  rows={4}
                  value={lastPromptSent || "No message sent yet..."}
                  readOnly
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    background: colors.panelAlt,
                    opacity: 0.8,
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: colors.muted,
                  }}
                >
                  Quick Override
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Input
                    label="Bot Name"
                    value={form.agent2.name}
                    onChange={(e) => setForm((f) => ({ ...f, agent2: { ...f.agent2, name: e.target.value } }))}
                  />
                  <Textarea
                    label="Personality Override"
                    rows={6}
                    value={form.agent2.persona}
                    onChange={(e) => setForm((f) => ({ ...f, agent2: { ...f.agent2, persona: e.target.value } }))}
                  />
                </div>
              </div>

              <Button
                onClick={async () => {
                  try {
                    await postSettings();
                    alert("Prompt settings applied!");
                  } catch (e: any) {
                    setError(e.message || "Failed to apply prompt changes");
                  }
                }}
                style={{ width: "100%" }}
              >
                Apply Prompt Changes
              </Button>

              <div style={{ fontSize: 11, color: colors.muted, marginTop: 8, textAlign: "center" }}>
                Changes will apply to the next message
              </div>
            </div>
          )}
        </>
      </div>
    </NegotiationLayout>
  );
}
