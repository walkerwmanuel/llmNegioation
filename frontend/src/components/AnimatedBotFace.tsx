import React, { useEffect, useMemo, useState } from "react";
import { colors } from "./ui/colors";

  export type FaceTone =
  | "neutral"
  | "friendly"
  | "firm"
  | "thinking"
  | "concerned"
  | "angry"
  | "sad"
  | "surprised";

function countMatches(text: string, pattern: RegExp) {
  return (text.match(pattern) || []).length;
}

export function normalizeEmotion(value?: string): FaceTone {
  const v = (value || "").trim().toLowerCase();

  if (v === "friendly") return "friendly";
  if (v === "firm") return "firm";
  if (v === "thinking") return "thinking";
  if (v === "concerned") return "concerned";
  if (v === "angry") return "angry";
  if (v === "sad") return "sad";
  if (v === "surprised") return "surprised";
  return "neutral";
}

function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getSentences(text: string) {
  return (text || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getLastSentence(text: string) {
  const parts = getSentences(text);
  return parts.length ? parts[parts.length - 1] : (text || "").trim();
}

function toneStrength(text: string, userText = "") {
  const own = scoreTone(text);
  const user = scoreTone(userText);
  return Math.max(
    own.friendly + user.friendly,
    own.firm + user.firm,
    own.thinking + user.thinking,
    own.concerned + user.concerned,
    own.angry + user.angry,
    own.skeptical + user.skeptical
  );
}

export function faceToneFromText(text: string, userText = ""): FaceTone {
  const own = scoreTone(text);
  const user = scoreTone(userText);

  const friendly = own.friendly;
  const firm = own.firm + Math.floor(user.firm * 0.45);
  const thinking = own.thinking;
  const concerned = own.concerned + user.concerned + Math.floor(user.firm * 0.25);
  const angry = own.angry + user.angry + (/\$\s?\d|offer|price|pay|cost|worth/.test(userText.toLowerCase()) && /\b(too much|low|cheap|ridiculous|absurd|joke|ugly)\b/.test(userText.toLowerCase()) ? 1 : 0);
  const skeptical = own.skeptical + Math.floor(user.skeptical * 0.5);

  if (angry >= 1 && angry >= concerned && angry >= firm && angry >= friendly && angry >= thinking) {
    return "angry";
  }

  if (concerned >= 1 && concerned >= firm && concerned >= friendly && concerned >= thinking) {
    return "concerned";
  }

  if (firm >= 1 && firm >= friendly && firm >= thinking) {
    return "firm";
  }

  if (skeptical >= 1 && skeptical >= thinking && skeptical >= friendly) {
    return "skeptical";
  }

  if (thinking >= 2 && thinking > firm && thinking > concerned && thinking > friendly) {
    return "thinking";
  }

  if (friendly >= 3 && friendly > firm + 1 && friendly > concerned + 1 && angry === 0) {
    return "friendly";
  }

  return "neutral";
}

function sentenceVariant(text: string) {
  const h = hashString(text || "default");
  return (h % 3) - 1; // -1, 0, 1
}

export default function AnimatedBotFace({
  name,
  tone = "neutral",
  isTalking = false,
  botText = "",
  liveText = "",
  userText = "",
}: {
  name: string;
  tone?: FaceTone;
  isTalking?: boolean;
  botText?: string;
  liveText?: string;
  userText?: string;
}) {
  const [mouthFrame, setMouthFrame] = useState(0);
  const [eyeOffsetX, setEyeOffsetX] = useState(0);
  const [eyeOffsetY, setEyeOffsetY] = useState(0);
  const [settledTone, setSettledTone] = useState<FaceTone>(tone);

  useEffect(() => {
    if (!isTalking) {
      setMouthFrame(0);
      return;
    }

    const timer = window.setInterval(() => {
      setMouthFrame((m) => (m + 1) % 3);
    }, 110);

    return () => window.clearInterval(timer);
  }, [isTalking]);

  const activeSpeechText = useMemo(() => {
    return isTalking ? (liveText || botText) : botText;
  }, [isTalking, liveText, botText]);

  const activeSentence = useMemo(() => {
    return getLastSentence(activeSpeechText);
  }, [activeSpeechText]);

  const detectedSentenceTone = useMemo(() => {
    const sentence = activeSentence || botText;
    if (!sentence.trim() && tone) return tone;
    return faceToneFromText(sentence, userText);
  }, [activeSentence, botText, userText, tone]);

  const overallTone = useMemo(() => {
    if (!botText.trim()) return tone;
    const inferred = faceToneFromText(botText, userText);
    const strength = toneStrength(botText, userText);
    if (strength === 0) return tone;
    return inferred;
  }, [botText, userText, tone]);

  useEffect(() => {
    if (isTalking) {
      setSettledTone(detectedSentenceTone);
    } else {
      setSettledTone(overallTone);
    }
  }, [isTalking, detectedSentenceTone, overallTone]);

  const displayedTone = isTalking ? detectedSentenceTone : settledTone;
  const sentenceShift = useMemo(() => sentenceVariant(activeSentence || botText || name), [activeSentence, botText, name]);

  useEffect(() => {
    if (!isTalking) {
      let baseX = 0;
      let baseY = 0;

      switch (displayedTone) {
        case "angry":
          baseX = 0;
          baseY = -0.35;
          break;
        case "firm":
          baseX = 0.2;
          baseY = -0.2;
          break;
        case "concerned":
          baseX = -0.25;
          baseY = 0.25;
          break;
        case "thinking":
          baseX = 0.45;
          baseY = -0.45;
          break;
        case "skeptical":
          baseX = 0.5;
          baseY = -0.1;
          break;
        case "friendly":
          baseX = 0.15;
          baseY = 0.1;
          break;
        default:
          baseX = 0;
          baseY = 0;
      }

      setEyeOffsetX(baseX);
      setEyeOffsetY(baseY);
      return;
    }

    const timer = window.setInterval(() => {
      let baseX = 0;
      let baseY = 0;

      switch (displayedTone) {
        case "angry":
          baseX = 0.15;
          baseY = -0.5;
          break;
        case "firm":
          baseX = 0.8;
          baseY = -0.25;
          break;
        case "concerned":
          baseX = -0.8;
          baseY = 0.6;
          break;
        case "thinking":
          baseX = 1.1;
          baseY = -1.0;
          break;
        case "skeptical":
          baseX = 0.95;
          baseY = -0.2;
          break;
        case "friendly":
          baseX = 0.35;
          baseY = 0.15;
          break;
        default:
          baseX = 0;
          baseY = 0.1;
      }

      const randX = (Math.random() - 0.5) * 1.5;
      const randY = (Math.random() - 0.5) * 1.1;

      setEyeOffsetX(baseX + randX);
      setEyeOffsetY(baseY + randY);
    }, 140);

    return () => window.clearInterval(timer);
  }, [isTalking, displayedTone]);

  const appearance = useMemo(() => {
    const h = hashString(name || "bot");

    const skinTones = ["#F1C7A4", "#E7B98C", "#D9A074", "#C98B5F", "#B7774E"];
    const hairColors = ["#6B4E3D", "#3A2A20", "#1E1A18", "#8A5A3C", "#B07A50", "#4A2F1F"];
    const eyeColors = ["#2C1E16", "#1E3A5F", "#2E4F2E", "#4B2E5A"];
    const lipColors = ["#A14F5F", "#B45A6A", "#8E4458", "#C06A7A"];
    const blushColors = [
      "rgba(255,120,140,0.20)",
      "rgba(255,140,160,0.16)",
      "rgba(240,110,130,0.18)",
    ];

    return {
      skin: skinTones[h % skinTones.length],
      hair: hairColors[h % hairColors.length],
      eyes: eyeColors[h % eyeColors.length],
      lips: lipColors[h % lipColors.length],
      blush: blushColors[h % blushColors.length],
      glasses: h % 5 === 0,
      mole: h % 6 === 0,
      lash: true,
      noseShift: (h % 5) - 2,
      accessory: h % 7,
    };
  }, [name]);

  const expression = useMemo(() => {
    const v = sentenceShift;

    switch (displayedTone) {
      case "friendly":
        return {
          browLeft: `M84 93 Q100 ${84 + v} 116 93`,
          browRight: `M140 93 Q156 ${84 - v} 172 93`,
          eyeScaleY: 1.03,
          smile: true,
          frown: false,
          mouthLine: false,
          blush: true,
          pupilsNarrow: false,
        };
      case "firm":
        return {
          browLeft: `M84 96 Q100 ${84 + v} 116 88`,
          browRight: `M140 88 Q156 ${84 - v} 172 96`,
          eyeScaleY: 0.86,
          smile: false,
          frown: false,
          mouthLine: true,
          blush: false,
          pupilsNarrow: true,
        };
      case "thinking":
        return {
          browLeft: `M84 93 Q100 ${86 + v} 116 97`,
          browRight: `M140 91 Q156 ${80 - v} 172 88`,
          eyeScaleY: 0.9,
          smile: false,
          frown: false,
          mouthLine: false,
          blush: false,
          pupilsNarrow: false,
        };
      case "concerned":
        return {
          browLeft: `M84 88 Q100 ${101 + v} 116 95`,
          browRight: `M140 95 Q156 ${101 - v} 172 88`,
          eyeScaleY: 0.8,
          smile: false,
          frown: true,
          mouthLine: false,
          blush: false,
          pupilsNarrow: true,
        };
      case "skeptical":
        return {
          browLeft: `M84 92 Q100 ${87 + v} 116 96`,
          browRight: `M140 91 Q156 ${90 - v} 172 91`,
          eyeScaleY: 0.88,
          smile: false,
          frown: false,
          mouthLine: false,
          blush: false,
          pupilsNarrow: true,
        };
      case "angry":
        return {
          browLeft: `M84 98 Q100 ${78 + v} 116 88`,
          browRight: `M140 88 Q156 ${78 - v} 172 98`,
          eyeScaleY: 0.72,
          smile: false,
          frown: true,
          mouthLine: false,
          blush: false,
          pupilsNarrow: true,
        };
      default:
        return {
          browLeft: `M84 92 Q100 ${88 + v} 116 92`,
          browRight: `M140 92 Q156 ${88 - v} 172 92`,
          eyeScaleY: 0.95,
          smile: false,
          frown: false,
          mouthLine: false,
          blush: false,
          pupilsNarrow: false,
        };
    }
  }, [displayedTone, sentenceShift]);

  const mouth = useMemo(() => {
    if (!isTalking) {
      if (displayedTone === "angry") {
        return (
          <path
            d="M110 171 Q128 159 146 171"
            stroke={appearance.lips}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        );
      }
      if (displayedTone === "skeptical") {
        return (
          <path
            d="M112 168 Q126 169 141 165"
            stroke={appearance.lips}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        );
      }
      if (expression.smile) {
        return (
          <path
            d="M111 166 Q128 177 145 166"
            stroke={appearance.lips}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        );
      }
      if (expression.frown) {
        return (
          <path
            d="M108 171 Q128 157 148 171"
            stroke={appearance.lips}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        );
      }
      if (expression.mouthLine) {
        return (
          <path
            d="M111 166 L145 166"
            stroke={appearance.lips}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        );
      }
      return (
        <path
          d="M112 166 Q128 171 144 166"
          stroke={appearance.lips}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      );
    }

    if (displayedTone === "angry") {
      if (mouthFrame === 0) return <ellipse cx="128" cy="167" rx="9.5" ry="5.5" fill={appearance.lips} />;
      if (mouthFrame === 1) return <ellipse cx="128" cy="167" rx="7.2" ry="10.8" fill={appearance.lips} />;
      return <ellipse cx="128" cy="167" rx="10.5" ry="7.0" fill={appearance.lips} />;
    }

    if (displayedTone === "firm") {
      if (mouthFrame === 0) return <ellipse cx="128" cy="166" rx="10" ry="5.5" fill={appearance.lips} />;
      if (mouthFrame === 1) return <ellipse cx="128" cy="166" rx="7.5" ry="10.5" fill={appearance.lips} />;
      return <ellipse cx="128" cy="166" rx="11" ry="7" fill={appearance.lips} />;
    }

    if (displayedTone === "concerned") {
      if (mouthFrame === 0) return <ellipse cx="128" cy="167" rx="10" ry="6.5" fill={appearance.lips} />;
      if (mouthFrame === 1) return <ellipse cx="128" cy="167" rx="8" ry="11.5" fill={appearance.lips} />;
      return <ellipse cx="128" cy="167" rx="11" ry="8" fill={appearance.lips} />;
    }

    if (displayedTone === "skeptical") {
      if (mouthFrame === 0) return <ellipse cx="128" cy="166" rx="10.2" ry="5.8" fill={appearance.lips} />;
      if (mouthFrame === 1) return <ellipse cx="128" cy="166" rx="8.1" ry="10.3" fill={appearance.lips} />;
      return <ellipse cx="128" cy="166" rx="11.2" ry="7.4" fill={appearance.lips} />;
    }

    if (displayedTone === "friendly") {
      if (mouthFrame === 0) return <ellipse cx="128" cy="166" rx="11.5" ry="6.5" fill={appearance.lips} />;
      if (mouthFrame === 1) return <ellipse cx="128" cy="166" rx="9" ry="11" fill={appearance.lips} />;
      return <ellipse cx="128" cy="166" rx="12.5" ry="8.5" fill={appearance.lips} />;
    }

    if (mouthFrame === 0) return <ellipse cx="128" cy="166" rx="10.5" ry="6" fill={appearance.lips} />;
    if (mouthFrame === 1) return <ellipse cx="128" cy="166" rx="8" ry="11" fill={appearance.lips} />;
    return <ellipse cx="128" cy="166" rx="11.5" ry="8" fill={appearance.lips} />;
  }, [isTalking, mouthFrame, expression, appearance, displayedTone]);

  const hairShape = useMemo(() => {
    return (
      <>
        <path
          d="
            M70 90
            Q82 50 128 42
            Q174 50 186 90
            Q194 122 192 170
            Q190 198 176 214
            Q168 220 160 214
            Q154 208 154 196
            Q154 156 154 126
            Q154 102 168 86
            Q150 76 128 74
            Q106 76 88 86
            Q102 102 102 126
            Q102 156 102 196
            Q102 208 96 214
            Q88 220 80 214
            Q66 198 64 170
            Q62 122 70 90
            Z
          "
          fill={appearance.hair}
        />

        <path
          d="
            M128 54
            Q112 58 98 72
            Q88 82 82 94
            Q94 96 106 94
            Q118 88 128 76
            Z
          "
          fill={appearance.hair}
        />

        <path
          d="
            M128 54
            Q144 58 158 72
            Q168 82 174 94
            Q162 96 150 94
            Q138 88 128 76
            Z
          "
          fill={appearance.hair}
        />

        <path
          d="M128 54 Q128 64 128 74"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }, [appearance]);

  const pupilRx = expression.pupilsNarrow ? 7.2 : 8;
  const pupilRy = expression.pupilsNarrow ? 9.2 * expression.eyeScaleY : 10 * expression.eyeScaleY;

  return (
    <div
      style={{
        width: "100%",
        minWidth: 260,
        background: colors.bubbleB,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: colors.muted,
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{name}</span>
        <span
          style={{
            fontSize: 11,
            padding: "4px 8px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            color: colors.text,
          }}
        >
          {isTalking ? "Speaking" : "Listening"}
        </span>
      </div>

      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 16,
          background: "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <svg viewBox="0 0 256 256" style={{ width: "92%", height: "92%" }}>
          {hairShape}

          <path
            d="
              M128 58
              C158 58 182 84 182 120
              C182 148 174 173 160 190
              C150 202 139 210 128 212
              C117 210 106 202 96 190
              C82 173 74 148 74 120
              C74 84 98 58 128 58
              Z
            "
            fill={appearance.skin}
          />

          <ellipse cx="88" cy="144" rx="9" ry="13" fill={appearance.skin} />
          <ellipse cx="168" cy="144" rx="9" ry="13" fill={appearance.skin} />

          {expression.blush && (
            <>
              <ellipse cx="92" cy="152" rx="10" ry="5" fill={appearance.blush} />
              <ellipse cx="164" cy="152" rx="10" ry="5" fill={appearance.blush} />
            </>
          )}

          <path d={expression.browLeft} stroke="#4B3427" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d={expression.browRight} stroke="#4B3427" strokeWidth="4.5" fill="none" strokeLinecap="round" />

          <>
            <ellipse
              cx={102 + eyeOffsetX}
              cy={116 + eyeOffsetY}
              rx={pupilRx}
              ry={pupilRy}
              fill={appearance.eyes}
            />
            <ellipse
              cx={154 + eyeOffsetX}
              cy={116 + eyeOffsetY}
              rx={pupilRx}
              ry={pupilRy}
              fill={appearance.eyes}
            />
            <circle cx={104 + eyeOffsetX} cy={112 + eyeOffsetY} r="2.5" fill="#fff" />
            <circle cx={156 + eyeOffsetX} cy={112 + eyeOffsetY} r="2.5" fill="#fff" />
            <path d="M92 104 Q102 96 112 104" stroke="#2C1E16" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M144 104 Q154 96 164 104" stroke="#2C1E16" strokeWidth="2" fill="none" strokeLinecap="round" />
            {appearance.lash && (
              <>
                <path d="M95 102 L90 98" stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
                <path d="M102 100 L102 95" stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
                <path d="M109 102 L114 98" stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
                <path d="M147 102 L142 98" stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
                <path d="M154 100 L154 95" stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
                <path d="M161 102 L166 98" stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </>

          {appearance.glasses && (
            <>
              <circle cx="102" cy="116" r="14" stroke="#222" strokeWidth="3" fill="none" />
              <circle cx="154" cy="116" r="14" stroke="#222" strokeWidth="3" fill="none" />
              <line x1="116" y1="116" x2="140" y2="116" stroke="#222" strokeWidth="3" />
            </>
          )}

          <path
            d={`M128 122 Q${122 + appearance.noseShift} 145 ${129 + appearance.noseShift} 151`}
            stroke="#C48D6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {appearance.mole && <circle cx="154" cy="154" r="1.8" fill="#7A4E3A" />}

          {mouth}

          {appearance.accessory === 1 && (
            <>
              <path d="M70 150 Q74 156 78 150" stroke="#D4AF37" strokeWidth="2" fill="none" />
              <path d="M178 150 Q182 156 186 150" stroke="#D4AF37" strokeWidth="2" fill="none" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}