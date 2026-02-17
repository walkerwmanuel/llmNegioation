import { useState } from "react";
import { Button } from "./ui/Button";
import { colors } from "./ui/colors";

function Avatar({ name, side }: { name: string; side: "left" | "right" }) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      title={name}
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
    >
      {initials}
    </div>
  );
}

interface ChatBubbleProps {
  name: string;
  content: string;
  side: "left" | "right";
  isEditing: boolean;
  onEdit: () => void;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  /** ISO timestamp when message was edited (if edited) */
  editedAt?: string | null;
  /** Original content before any edits (for tooltip) */
  originalContent?: string | null;
}

export default function ChatBubble({
  name,
  content,
  side,
  isEditing,
  onEdit,
  onChange,
  onSave,
  onCancel,
  editedAt,
  originalContent,
}: ChatBubbleProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const isEdited = !!editedAt;

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
      {side === "left" && <Avatar name={name} side={side} />}
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
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
            {name}
            {isEdited && (
              <span
                style={{
                  fontSize: 10,
                  color: colors.muted,
                  opacity: 0.7,
                  cursor: originalContent ? "pointer" : "default",
                }}
                title={originalContent ? "Click to see original" : undefined}
                onClick={() => originalContent && setShowOriginal(!showOriginal)}
              >
                (edited)
              </span>
            )}
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

        {/* Show original content tooltip */}
        {showOriginal && originalContent && (
          <div
            style={{
              marginBottom: 8,
              padding: 8,
              borderRadius: 6,
              background: "rgba(0,0,0,0.2)",
              fontSize: 12,
              color: colors.muted,
              borderLeft: `2px solid ${colors.muted}`,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Original:</div>
            <div style={{ whiteSpace: "pre-wrap", opacity: 0.8 }}>{originalContent}</div>
          </div>
        )}

        {!isEditing ? (
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{content}</div>
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
      {side === "right" && <Avatar name={name} side={side} />}
    </div>
  );
}
