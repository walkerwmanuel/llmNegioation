import { Button } from "./ui/Button";
import { colors } from "./ui/colors";
import React, { useEffect, useState } from "react";

function Avatar({
  name,
  isSpeaking,
  badge,
}: {
  name: string;
  isSpeaking: boolean;
  badge: string;
}) {
  const safeName = typeof name === "string" && name.trim() ? name.trim() : "agent";
  const src = `https://api.dicebear.com/6.x/adventurer/svg?seed=${encodeURIComponent(safeName)}`;

  return (
    <div style={{ position: "relative", width: 48, height: 48, flex: "0 0 auto" }}>
      {/* speaking ring */}
      <div
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          border: `2px solid ${colors.border}`,
          opacity: isSpeaking ? 1 : 0,
          transform: isSpeaking ? "scale(1)" : "scale(0.9)",
          transition: "opacity 150ms ease, transform 150ms ease",
          animation: isSpeaking ? "pulse 1.1s ease-in-out infinite" : "none",
        }}
      />

      <img
        src={src}
        alt={`${safeName} avatar`}
        title={safeName}
        width={48}
        height={48}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(safeName)}`;
        }}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: `1px solid ${colors.border}`,
          background: colors.panelAlt,
          display: "block",
        }}
      />

      {/* emotion badge */}
      <div
        title="tone"
        style={{
          position: "absolute",
          right: -3,
          bottom: -3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: `1px solid ${colors.border}`,
          background: colors.panel,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
        }}
      >
        {badge}
      </div>

      {/* keyframes */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.55; }
            50% { transform: scale(1.06); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.55; }
          }
        `}
      </style>
    </div>
  );
}

const toneBadge = (text: string) => {
  const t = (text || "").toLowerCase();
  if (/(agree|aligned|compromise|common ground|fair|mutual)/.test(t)) return "🤝";
  if (/(must|can’t|cannot|won’t|no |not acceptable|refuse|insist)/.test(t)) return "😠";
  if (/(maybe|consider|could|suggest|proposal|option)/.test(t)) return "🙂";
  return "😐";
};

export default function ChatBubble({
  name,
  content,
  side,
  isEditing,
  isSpeaking,
  onEdit,
  onChange,
  onSave,
  onCancel,
}: {
  name: string;
  content: string;
  side: "left" | "right";
  isEditing: boolean;
  isSpeaking: boolean;
  onEdit: () => void;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [showText, setShowText] = useState(false);

  // Show avatar + bubble immediately, but delay the text by 1s
  useEffect(() => {
    if (isEditing) {
      setShowText(true);
      return;
    }
    setShowText(false);
    const t = window.setTimeout(() => setShowText(true), 1000);
    return () => window.clearTimeout(t);
  }, [content, isEditing]);

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        justifyContent: side === "left" ? "flex-start" : "flex-end",
        width: "100%",
      }}
    >
      {side === "left" && <Avatar name={name} isSpeaking={isSpeaking} badge={toneBadge(content)} />}

      <div
        style={{
          maxWidth: isEditing ? "50vw" : "70%",
          width: "100%",
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
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <span>{name}</span>
            {isSpeaking && <span style={{ opacity: 0.75 }}>…</span>}
          </div>

          {!isEditing ? (
            <button
              title="Edit message"
              onClick={onEdit}
              style={{ background: "transparent", border: "none", color: colors.muted, cursor: "pointer" }}
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
          showText ? (
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{content}</div>
          ) : (
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, opacity: 0.65, fontStyle: "italic" }}>
              …
            </div>
          )
        ) : (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: "100%",
              minHeight: "150px",
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

      {side === "right" && <Avatar name={name} isSpeaking={isSpeaking} badge={toneBadge(content)} />}
    </div>
  );
}
