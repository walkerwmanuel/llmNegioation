import React, { useEffect, useMemo, useRef, useState } from "react";
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

export function faceToneFromText(text: string): FaceTone {
  const t = (text || "").toLowerCase();

  if (/(thank|glad|appreciate|happy|great|fair|together|understand|absolutely|of course)/.test(t)) {
    return "friendly";
  }
  if (/(angry|ridiculous|unacceptable|offended|frustrated|irritated|hostile|absurd)/.test(t)) {
    return "angry";
  }
  if (/(sad|sorry|disappointed|hurt|upset|regret|unhappy)/.test(t)) {
    return "sad";
  }
  if (/(wow|unexpected|surprising|surprised|suddenly|really\?|no way)/.test(t)) {
    return "surprised";
  }
  if (/(must|need to|won't|cannot|can't|firm|final|nonnegotiable|confident|definitely)/.test(t)) {
    return "firm";
  }
  if (/(maybe|perhaps|consider|could|might|option|what if|let me think)/.test(t)) {
    return "thinking";
  }
  if (/(concern|risk|worry|issue|problem|difficult|unfortunately|warning|uncertain|careful)/.test(t)) {
    return "concerned";
  }

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

export default function AnimatedBotFace({
  name,
  tone = "neutral",
  isTalking = false,
}: {
  name: string;
  tone?: FaceTone;
  isTalking?: boolean;
}) {
  const [mouthFrame, setMouthFrame] = useState(0);
  const [restingTone, setRestingTone] = useState<FaceTone>(tone);
  const prevTalkingRef = useRef(isTalking);

  useEffect(() => {
    if (isTalking) {
      setRestingTone(tone);
    } else if (prevTalkingRef.current && !isTalking) {
      // just finished talking: lock in the last spoken tone as the resting face
      setRestingTone(tone);
    }

    prevTalkingRef.current = isTalking;
  }, [isTalking, tone]);

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

  const displayedTone: FaceTone = isTalking ? tone : restingTone;

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
    switch (displayedTone) {
      case "friendly":
        return {
          browLeft: "M84 91 Q100 80 116 90",
          browRight: "M140 90 Q156 80 172 91",
          eyeScaleY: 1.12,
          eyeOffsetY: 0,
          pupilOffsetX: 0,
          pupilOffsetY: 0,
          smile: true,
          frown: false,
          mouthLine: false,
          roundMouth: false,
          blush: true,
          lash: true,
        };

      case "firm":
        return {
          browLeft: "M84 96 Q100 86 116 87",
          browRight: "M140 87 Q156 86 172 96",
          eyeScaleY: 0.82,
          eyeOffsetY: 1,
          pupilOffsetX: 0,
          pupilOffsetY: 0.5,
          smile: false,
          frown: false,
          mouthLine: true,
          roundMouth: false,
          blush: false,
          lash: false,
        };

      case "thinking":
        return {
          browLeft: "M84 94 Q100 89 116 97",
          browRight: "M140 89 Q156 80 172 88",
          eyeScaleY: 0.9,
          eyeOffsetY: 0,
          pupilOffsetX: -2,
          pupilOffsetY: -1.5,
          smile: false,
          frown: false,
          mouthLine: false,
          roundMouth: false,
          blush: false,
          lash: false,
        };

      case "concerned":
        return {
          browLeft: "M84 89 Q100 101 116 93",
          browRight: "M140 93 Q156 101 172 89",
          eyeScaleY: 0.76,
          eyeOffsetY: 1.5,
          pupilOffsetX: 0,
          pupilOffsetY: 1.5,
          smile: false,
          frown: true,
          mouthLine: false,
          roundMouth: false,
          blush: false,
          lash: false,
        };

      case "angry":
        return {
          browLeft: "M84 98 Q100 84 116 82",
          browRight: "M140 82 Q156 84 172 98",
          eyeScaleY: 0.62,
          eyeOffsetY: 2,
          pupilOffsetX: 0,
          pupilOffsetY: 1.5,
          smile: false,
          frown: false,
          mouthLine: false,
          roundMouth: false,
          blush: false,
          lash: false,
        };

      case "sad":
        return {
          browLeft: "M84 93 Q100 86 116 99",
          browRight: "M140 99 Q156 86 172 93",
          eyeScaleY: 0.72,
          eyeOffsetY: 2.5,
          pupilOffsetX: 0,
          pupilOffsetY: 2.5,
          smile: false,
          frown: true,
          mouthLine: false,
          roundMouth: false,
          blush: false,
          lash: false,
        };

      case "surprised":
        return {
          browLeft: "M84 86 Q100 74 116 85",
          browRight: "M140 85 Q156 74 172 86",
          eyeScaleY: 1.38,
          eyeOffsetY: -1,
          pupilOffsetX: 0,
          pupilOffsetY: 0,
          smile: false,
          frown: false,
          mouthLine: false,
          roundMouth: true,
          blush: false,
          lash: false,
        };

      default:
        return {
          browLeft: "M84 92 Q100 88 116 92",
          browRight: "M140 92 Q156 88 172 92",
          eyeScaleY: 0.96,
          eyeOffsetY: 0,
          pupilOffsetX: 0,
          pupilOffsetY: 0,
          smile: false,
          frown: false,
          mouthLine: false,
          roundMouth: false,
          blush: false,
          lash: false,
        };
    }
  }, [displayedTone]);

  const mouth = useMemo(() => {
    if (!isTalking) {
      switch (displayedTone) {
        case "friendly":
          return (
            <path
              d="M110 165 Q128 181 146 165"
              stroke={appearance.lips}
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
            />
          );

        case "firm":
          return (
            <path
              d="M110 166 L146 166"
              stroke={appearance.lips}
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
            />
          );

        case "thinking":
          return (
            <path
              d="M114 168 Q127 171 142 164"
              stroke={appearance.lips}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          );

        case "concerned":
          return (
            <path
              d="M108 172 Q128 157 148 172"
              stroke={appearance.lips}
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
            />
          );

        case "angry":
          return (
            <path
              d="M109 169 Q128 161 147 169"
              stroke={appearance.lips}
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
            />
          );

        case "sad":
          return (
            <path
              d="M109 174 Q128 158 147 174"
              stroke={appearance.lips}
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
            />
          );

        case "surprised":
          return <ellipse cx="128" cy="168" rx="7.5" ry="11" fill={appearance.lips} />;

        default:
          return (
            <path
              d="M113 166 Q128 170 143 166"
              stroke={appearance.lips}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          );
      }
    }

    switch (displayedTone) {
      case "surprised":
        if (mouthFrame === 0) return <ellipse cx="128" cy="168" rx="7.5" ry="11" fill={appearance.lips} />;
        if (mouthFrame === 1) return <ellipse cx="128" cy="168" rx="9.5" ry="13.5" fill={appearance.lips} />;
        return <ellipse cx="128" cy="168" rx="10.5" ry="15" fill={appearance.lips} />;

      case "angry":
        if (mouthFrame === 0) return <ellipse cx="128" cy="167" rx="11" ry="5.5" fill={appearance.lips} />;
        if (mouthFrame === 1) return <ellipse cx="128" cy="167" rx="8.5" ry="11" fill={appearance.lips} />;
        return <ellipse cx="128" cy="167" rx="12.5" ry="7" fill={appearance.lips} />;

      case "sad":
        if (mouthFrame === 0) return <ellipse cx="128" cy="169" rx="10" ry="6.5" fill={appearance.lips} />;
        if (mouthFrame === 1) return <ellipse cx="128" cy="169" rx="7.5" ry="11" fill={appearance.lips} />;
        return <ellipse cx="128" cy="169" rx="11.5" ry="8.5" fill={appearance.lips} />;

      default:
        if (mouthFrame === 0) return <ellipse cx="128" cy="166" rx="11" ry="6.5" fill={appearance.lips} />;
        if (mouthFrame === 1) return <ellipse cx="128" cy="166" rx="8.5" ry="11.5" fill={appearance.lips} />;
        return <ellipse cx="128" cy="166" rx="12.5" ry="8.5" fill={appearance.lips} />;
    }
  }, [isTalking, mouthFrame, displayedTone, appearance]);

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

  const eyeRY = 10 * expression.eyeScaleY;
  const eyeY = 116 + expression.eyeOffsetY;
  const leftPupilX = 102 + expression.pupilOffsetX;
  const rightPupilX = 154 + expression.pupilOffsetX;
  const pupilY = 116 + expression.eyeOffsetY + expression.pupilOffsetY;

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
            textTransform: "capitalize",
          }}
        >
          {isTalking ? `${displayedTone} • speaking` : `${displayedTone} • resting`}
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

          <ellipse cx="102" cy={eyeY} rx="8" ry={eyeRY} fill={appearance.eyes} />
          <ellipse cx="154" cy={eyeY} rx="8" ry={eyeRY} fill={appearance.eyes} />

          <circle cx={leftPupilX + 2} cy={pupilY - 4} r="2.5" fill="#fff" />
          <circle cx={rightPupilX + 2} cy={pupilY - 4} r="2.5" fill="#fff" />

          <path
            d={`M92 ${104 + expression.eyeOffsetY} Q102 ${96 + expression.eyeOffsetY} 112 ${104 + expression.eyeOffsetY}`}
            stroke="#2C1E16"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M144 ${104 + expression.eyeOffsetY} Q154 ${96 + expression.eyeOffsetY} 164 ${104 + expression.eyeOffsetY}`}
            stroke="#2C1E16"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />

          {appearance.lash && expression.lash && (
            <>
              <path d={`M95 ${102 + expression.eyeOffsetY} L90 ${98 + expression.eyeOffsetY}`} stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
              <path d={`M102 ${100 + expression.eyeOffsetY} L102 ${95 + expression.eyeOffsetY}`} stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
              <path d={`M109 ${102 + expression.eyeOffsetY} L114 ${98 + expression.eyeOffsetY}`} stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
              <path d={`M147 ${102 + expression.eyeOffsetY} L142 ${98 + expression.eyeOffsetY}`} stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
              <path d={`M154 ${100 + expression.eyeOffsetY} L154 ${95 + expression.eyeOffsetY}`} stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
              <path d={`M161 ${102 + expression.eyeOffsetY} L166 ${98 + expression.eyeOffsetY}`} stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {appearance.glasses && (
            <>
              <circle cx="102" cy={eyeY} r="14" stroke="#222" strokeWidth="3" fill="none" />
              <circle cx="154" cy={eyeY} r="14" stroke="#222" strokeWidth="3" fill="none" />
              <line x1="116" y1={eyeY} x2="140" y2={eyeY} stroke="#222" strokeWidth="3" />
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

          {displayedTone === "sad" && (
            <>
              <path
                d="M96 149 Q99 156 95 162"
                stroke="rgba(180,220,255,0.70)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M160 149 Q163 156 159 162"
                stroke="rgba(180,220,255,0.70)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </>
          )}

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