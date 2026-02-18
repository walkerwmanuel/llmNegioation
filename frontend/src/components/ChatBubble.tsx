import { Button } from "./ui/Button";
import { colors } from "./ui/colors";
import React, { useEffect, useState } from "react";

type Tone =
  | "cooperate"
  | "assert"
  | "explore"
  | "concern"
  | "evidence"
  | "unsure"
  | "neutral";


// ---------------- Avatar ----------------

function Avatar({
  name,
  isSpeaking,
  tone,
}: {
  name: string;
  isSpeaking: boolean;
  tone: Tone;
}) {

  const safeName =
    typeof name === "string" && name.trim()
      ? name.trim()
      : "agent";

  const src =
    `https://api.dicebear.com/6.x/avataaars/svg?seed=${encodeURIComponent(safeName)}`;

  return (
    <div style={{ position: "relative", width: 48, height: 48 }}>

      <div
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          border: `2px solid ${colors.border}`,
          opacity: isSpeaking ? 1 : 0,
          animation:
            isSpeaking
              ? "pulse 1.1s ease-in-out infinite"
              : "none",
        }}
      />

      <img
        src={src}
        alt={`${safeName} avatar`}
        width={48}
        height={48}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(safeName)}`;
        }}
        style={{
          borderRadius: "50%",
          border: `1px solid ${colors.border}`,
          background: colors.panelAlt,
        }}
      />

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


// ---------------- Emoji Mapping ----------------

const toneEmojiMap: Record<string, string[]> = {
  cooperate: ["🤝","😊","🙂","😄","😁","👍","🙌"],
  assert: ["👍","👊","🤨","😐"],
  explore: ["🤔","🧐","😯","👀","🤨"],
  concern: ["⚠️","🚨","❗","😟","😕","😬"],
  evidence: ["🤓","🧐","😐","👍"],
  unsure: ["😅","🤷","🫤","😬"],
  neutral: ["🙂","😐"],
  friendly: ["😊","😁","😄","🙌"],
  firm: ["👊","👍","😐"],
  disagree: ["🤨","😐","🫤","⚠️","❗"],
};

// safe emoji detection (no \p{...})
function alreadyHasEmoji(text: string) {
  return /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/u.test(text);
}

// deterministic hash -> stable "random"
function hash32(s: string) {
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

// inserts emojis inside the text at deterministic positions
function injectToneEmojis(text: string, tone: string | undefined, seedKey: string) {

  if (!text) return text;

  if (alreadyHasEmoji(text)) return text;

  const list = toneEmojiMap[tone || "neutral"] || toneEmojiMap.neutral;

  const seed = hash32(seedKey);

  const len = text.length;

  const targetCount =
    len < 80 ? 2 :
    len < 180 ? 3 :
    4;

  const parts = text.split(/(?<=[.!?])\s+/);

  const chunks =
    parts.length > 1
      ? parts
      : text.split(/(?<=,|;)\s+/);

  const used = new Set<string>();

  const chosenIdxs = new Set<number>();

  const maxIdx = Math.max(1, chunks.length);

  for (let k = 0; k < targetCount; k++) {

    const idx = (seed + k * 131) % maxIdx;

    chosenIdxs.add(idx);

  }

  const out: string[] = [];

  for (let i = 0; i < chunks.length; i++) {

    let chunk = chunks[i];

    if (chosenIdxs.has(i) && chunk.trim()) {

      const e = pick(list, seed + i * 17);

      const emoji =
        used.has(e)
          ? pick(list, seed + i * 97)
          : e;

      used.add(emoji);

      // ⭐ INSERT BEFORE PERIOD / QUESTION / EXCLAMATION

      if (/[.!?]$/.test(chunk)) {

        chunk =
          chunk.replace(
            /([.!?])$/,
            ` ${emoji}$1`
          );

      }

      else {

        chunk =
          `${chunk} ${emoji}`;

      }

    }

    out.push(chunk);

  }

  return out.join(" ");

}


// ---------------- Tone Detection ----------------

const toneFromText = (
  text: string
): Tone => {

  const t =
    (text || "").toLowerCase();

  if (/(agree|aligned|compromise|fair|mutual)/.test(t))
    return "cooperate";

  if (/(must|cannot|won’t|refuse|nonnegotiable)/.test(t))
    return "assert";

  if (/(maybe|consider|option|perhaps)/.test(t))
    return "explore";

  if (/(risk|concern|problem|danger)/.test(t))
    return "concern";

  if (/(evidence|data|research)/.test(t))
    return "evidence";

  if (/(unsure|uncertain|depends)/.test(t))
    return "unsure";

  return "neutral";

};


// ---------------- ChatBubble ----------------

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

  const [showText, setShowText] =
    useState(false);

  const tone =
    toneFromText(content);


  useEffect(() => {

    if (isEditing) {

      setShowText(true);

      return;

    }

    setShowText(false);

    const t =
      setTimeout(
        () => setShowText(true),
        1000
      );

    return () =>
      clearTimeout(t);

  }, [content, isEditing]);


  return (

    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent:
          side === "left"
            ? "flex-start"
            : "flex-end",
      }}
    >


      {side === "left" &&
        <Avatar
          name={name}
          isSpeaking={isSpeaking}
          tone={tone}
        />
      }


      <div
        style={{
          maxWidth: "70%",
          padding: 12,
          borderRadius: 12,
          background:
            side === "left"
              ? colors.bubbleA
              : colors.bubbleB,
          border:
            `1px solid ${colors.border}`,
        }}
      >


        <div
          style={{
            fontSize: 12,
            color: colors.muted,
            marginBottom: 6,
          }}
        >

          {name}

        </div>


        {!isEditing ? (

          showText ? (

            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.5,
              }}
            >

{injectToneEmojis(content, tone, `${name}::${tone}::${content}`)}

            </div>

          ) : (

            <div
              style={{
                opacity: 0.65,
                fontStyle: "italic",
              }}
            >

              …

            </div>

          )

        ) : (

          <textarea

            value={content}

            onChange={
              (e) =>
                onChange(
                  e.target.value
                )
            }

            style={{
              width: "100%",
              minHeight: 120,
              borderRadius: 8,
            }}

          />

        )}

      </div>


      {side === "right" &&
        <Avatar
          name={name}
          isSpeaking={isSpeaking}
          tone={tone}
        />
      }


    </div>

  );

}
export { injectToneEmojis, toneFromText };
