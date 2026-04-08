"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
import AnimatedBotFace, { faceToneFromText, type FaceTone } from "../components/AnimatedBotFace";

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
  animateWords?: boolean;
  tone?: FaceTone;
};

const spinnerKeyframes = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;


export default function SpeechToText() {
  const defaults: FormState = useMemo(
    () => ({
      model: "gpt-5-mini",
      topic: "Negotiation over the price of Emily's used car.",
      rules:
        "NEGOTIATION RULES:\n1) Respond in EXACTLY two sentences per turn after your introduction.\n2) Address the other speaker’s most recent argument directly.\n3) Introduce a new justification, counterargument, or concession in each turn rather than repeating your previous point.\n4) Focus on concrete details such as price, condition, reliability, and the current supply of used cars.\n5) No markdown, no emojis, no bullet points.\n6) Stay civil, concise, and persuasive while avoiding generic platitudes.\n7) Do not lie about the car’s condition or history, but you may emphasize scarcity, demand, and anchoring in your negotiation.\n8) In the final round, work toward a realistic compromise that closes the deal.",
      rounds: 4,
      agent1: {
        name: "You",
        persona:
          "You are a cautious buyer with a limited budget who has researched similar cars and believes a fair price is closer to $12,000. You value fairness and want to push back against inflated prices while still being open to compromise.",
        stance: "Negotiate to bring the price down to a fair market value, using your research as justification.",
      },
      agent2: {
        name: "Emily",
        persona:
          "You are Emily, the owner of a used car that you are selling. Your initial asking price is $15,000. The car is in good condition with normal wear, and while you know the fair market value may be slightly lower, you intend to negotiate strategically to maximize the final price. Your negotiation style is confident, practical, and persuasive, and you emphasize the limited supply of reliable used cars and the convenience for the buyer compared to continuing to search elsewhere. During the negotiation, respond directly to the buyer’s most recent point and introduce a new justification, counterargument, or small concession instead of repeating the same argument.",
        stance:
          "Aim to keep the final sale price as close to $15,000 as possible by emphasizing the car’s reliability, condition, and the current scarcity of used vehicles, while still making small strategic concessions if they help move the negotiation toward a successful agreement.",
      },
    }),
    []
  );

  async function syncSettingsToBackend() {
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
      const errorText = await res.text();
      throw new Error(`Failed to sync settings (status ${res.status}): ${errorText}`);
    }
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
  const [transcript, setTranscript] = useState("");
  const [hasTranscript, setHasTranscript] = useState(false);
  const [showPromptPanel, setShowPromptPanel] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [lastPromptSent, setLastPromptSent] = useState("");
  const [displayedBotText, setDisplayedBotText] = useState("");
const [botIsTalking, setBotIsTalking] = useState(false);
const [botFaceTone, setBotFaceTone] = useState<FaceTone>("neutral");
  
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const maxTimeoutRef = useRef<number | null>(null);
  const [sendingToBot, setSendingToBot] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const TRANSCRIBE_URL = "http://localhost:8025/speech-to-text/transcribe";
  const RESPOND_URL = "http://localhost:8025/speech-to-text/respond";
  const SETTINGS_URL = "http://localhost:8025/speech-to-text/update-settings";

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

  // Handle selecting a negotiation from sidebar
  const handleSelectNegotiation = async (id: number) => {
    setPendingLoadId(id);
    clearNegotiationError();
    const negotiation = await loadNegotiation(id);
    if (negotiation) {
      // Convert loaded messages to local chat format
      const loadedMessages: ChatItem[] = (negotiation.messages || []).map((m) => ({
        speaker: m.role === "user" ? "You" : form.agent2.name,
        content: m.content,
        side: m.role === "user" ? "left" as const : "right" as const,
        animateWords: false,
        tone: m.role === "user" ? undefined : faceToneFromText(m.content),
      }));
      setMessages(loadedMessages);
      setPendingLoadId(null);
    }
  };

  // Retry loading a negotiation after error
  const handleRetryLoad = async () => {
    if (pendingLoadId !== null) {
      await handleSelectNegotiation(pendingLoadId);
    }
  };

  // Handle new negotiation from sidebar
  const handleNewNegotiation = () => {
    clearSession();
    setMessages([]);
    setError(null);
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.side === "right" ? { ...m, speaker: form.agent2.name } : m
      )
    );
  }, [form.agent2.name]);

  useEffect(() => {
  // Send initial settings to backend on component mount
  const initializeSettings = async () => {
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
        throw new Error(`Failed to initialize settings (status ${res.status})`);
      }

      console.log("Settings initialized successfully:", payload);
    } catch (err) {
      console.error("Error initializing settings:", err);
      setError("Failed to initialize settings");
    }
  };

  initializeSettings();
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
      if ((event.ctrlKey || event.metaKey) && event.code === "Enter" && hasTranscript && transcript.trim() && !sendingToBot) {
        event.preventDefault();
        sendTranscriptToBot();
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
  }, [messages, recording, openSettings, editingIndex, hasTranscript, sendingToBot]);

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

          console.log("Sending audio to transcription API...");

          const res = await fetch(TRANSCRIBE_URL, { method: "POST", body: formData });

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorText}`);
          }

          const data = await res.json();
          console.log("Transcription response:", data);

          if (!data.transcript) {
            throw new Error("No transcript returned from server");
          }

          // Save transcript so user can edit it
          setTranscript(data.transcript);
          setHasTranscript(true);

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
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      maxTimeoutRef.current = window.setTimeout(() => {
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
  
      if (item.speaker === "You") {
        const history = prefix.slice(0, -1).map(msg => ({
          speaker: msg.speaker,
          content: msg.content
        }));

        await syncSettingsToBackend();
  
        const res = await fetch(RESPOND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: draft.trim(), history: history }),
        });
  
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
  
        const data = await res.json();
        console.log("Respond response:", data);
  
        const botTone = faceToneFromText(data.bot);
        setBotFaceTone(botTone);
  
        setMessages((prev) => [
          ...prev,
          {
            speaker: form.agent2.name,
            content: data.bot,
            side: "right",
            animateWords: true,
            tone: botTone,
          },
        ]);
  
        await animateBotReply(data.bot);
      }
    } catch (err: any) {
      console.error("Error saving edit:", err);
      setError(err.message || "Failed to save edit and get response");
    }
  };

  async function animateBotReply(fullText: string) {
    const words = fullText.split(/\s+/).filter(Boolean);
    let current = "";
  
    setDisplayedBotText("");
    setBotIsTalking(true);
  
    for (let i = 0; i < words.length; i++) {
      current = current ? `${current} ${words[i]}` : words[i];
      setDisplayedBotText(current);
      await new Promise((resolve) => setTimeout(resolve, 90));
    }
  
    setBotIsTalking(false);
  }

  async function sendTranscriptToBot() {
    if (sendingToBot) return;
  
    try {
      setError(null);
      setSendingToBot(true);
  
      const cleaned = transcript.trim();
      if (!cleaned) {
        throw new Error("Transcript is empty. Please type something before sending.");
      }
  
      await syncSettingsToBackend();
  
      const currentSystemPrompt = `You are ${form.agent2.name}.
  
  ${form.agent2.persona}
  
  Your goal: ${form.agent2.stance}
  
  Topic of conversation: ${form.topic}
  
  ${form.rules}
  
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
      console.log("Respond response:", data);
  
      if (!data.you || !data.bot) {
        throw new Error("Unexpected response from server");
      }
  
      const botTone = faceToneFromText(data.bot);
      setBotFaceTone(botTone);
  
      setMessages((prev) => [
        ...prev,
        { speaker: "You", content: data.you, side: "left" },
        {
          speaker: form.agent2.name,
          content: data.bot,
          side: "right",
          animateWords: true,
          tone: botTone,
        },
      ]);
  
      await animateBotReply(data.bot);
  
      if (isAuthenticated) {
        let negId = currentNegotiationId;
  
        if (!negId) {
          negId = await startNewNegotiation(form.topic, "user_vs_ai");
        }
  
        if (negId) {
          await saveMessage("user", data.you, negId);
          await saveMessage("ai_1", data.bot, negId);
        }
      }
  
      setTranscript("");
      setHasTranscript(false);
    } catch (err: any) {
      console.error("Error sending transcript:", err);
      setError(err.message || "Failed to send transcript to bot");
    } finally {
      setSendingToBot(false);
    }
  }

  const chatTranscript = useMemo(() => {
  if (messages.length === 0) return "";
  return messages
    .map((m) => `${m.speaker}: ${m.content}`)
    .join("\n\n");
}, [messages]);


  return (
    <NegotiationLayout
      onSelectNegotiation={handleSelectNegotiation}
      selectedId={currentNegotiationId}
      onNewNegotiation={handleNewNegotiation}
      negotiationType="user_vs_ai"
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
            <CardTitle>Negotiation</CardTitle>
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
            <DownloadChatButton transcript={chatTranscript} />

            </div>
          </CardHeader>
          <CardContent
  style={{
    flex: 1,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: 16,
    overflow: "hidden",
    alignItems: "start",
  }}
>
  <div style={{ minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
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
        Press 🎤 to record your voice.
      </div>
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
          content={
            editingIndex === i
              ? draft
              : m.side === "right" &&
                i === messages.length - 1 &&
                m.animateWords
              ? displayedBotText
              : m.content
          }
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
          {sendingToBot ? (
            <span>Sending to Bot...</span>
          ) : (
            <span>Edit your transcript below, then press <b>Send to Bot</b>.</span>
          )}
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

          <Button
            size="sm"
            onClick={sendTranscriptToBot}
            disabled={sendingToBot || !transcript.trim()}
          >
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
  </div>

  <div style={{ position: "sticky", top: 0 }}>
    <AnimatedBotFace
      name={form.agent2.name}
      tone={botFaceTone}
      isTalking={botIsTalking}
    />
  </div>
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
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o mini</option>
              <option value="gpt-5.2">GPT-5.4</option>
              <option value="gpt-5-mini">GPT-5.4 mini</option>
              <option value="gpt-5-nano">GPT-5.4 nano</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
              <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash</option>
              <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</option>
              <option value="grok-4-1-fast-reasoning">Grok 4.1 Fast (Reasoning)</option>
              <option value="grok-4-1-fast-non-reasoning">Grok 4.1 Fast (Non-Reasoning)</option>
              <option value="deepseek-reasoner">DeepSeek-V3.2 (Thinking Mode)</option>
              <option value="deepseek-chat">DeepSeek-V3.2 (Non-thinking Mode)</option>
            </select>
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
                animation: "slideIn 0.3s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Prompt Inspector</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowPromptPanel(false)}>
                  ✕ Close
                </Button>
              </div>

              {/* System Prompt Section */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.muted }}>
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
                <div style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                  This is the system message sent to the AI
                </div>
              </div>

              {/* Last User Message */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.muted }}>
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

              {/* Quick Override Section */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.muted }}>
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

              {/* Apply Button */}
              <Button
                onClick={async () => {
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

                    console.log("Prompt settings updated");
                    alert("Prompt settings applied!");
                  } catch (err) {
                    console.error("Error updating settings:", err);
                    setError("Failed to apply prompt changes");
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