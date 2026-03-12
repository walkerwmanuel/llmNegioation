import React, { useEffect, useMemo, useState } from "react";
import { colors } from "./ui/colors";

export type FaceTone = "neutral" | "friendly" | "firm" | "thinking" | "concerned";

export function faceToneFromText(text: string): FaceTone {
  const t = (text || "").toLowerCase();

  if (/(thank|glad|appreciate|happy|great|fair|together|understand)/.test(t)) {
    return "friendly";
  }
  if (/(must|need to|won't|cannot|can't|firm|final|nonnegotiable|confident)/.test(t)) {
    return "firm";
  }
  if (/(maybe|perhaps|consider|could|might|option|what if)/.test(t)) {
    return "thinking";
  }
  if (/(concern|risk|worry|issue|problem|difficult|unfortunately)/.test(t)) {
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
  const [blink, setBlink] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 140);
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

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

  const appearance = useMemo(() => {
    const h = hashString(name || "bot");

    const skinTones = ["#F1C7A4", "#E7B98C", "#D9A074", "#C98B5F", "#B7774E"];
    const hairColors = ["#6B4E3D", "#3A2A20", "#1E1A18", "#8A5A3C", "#B07A50", "#4A2F1F"];
    const eyeColors = ["#2C1E16", "#1E3A5F", "#2E4F2E", "#4B2E5A"];
    const lipColors = ["#7A3E2D", "#8B4A36", "#6B3448", "#9A4E3A"];
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
      lash: h % 2 === 0,
      faceWidth: 72 + (h % 6),
      faceHeight: 82 + (h % 5),
      jawSoftness: 82 + (h % 8),
      noseShift: (h % 5) - 2,
      hairStyle: h % 4,
      accessory: h % 7,
    };
  }, [name]);

  const expression = useMemo(() => {
    switch (tone) {
      case "friendly":
        return {
          browLeft: "M84 88 Q100 80 116 88",
          browRight: "M140 88 Q156 80 172 88",
          eyeScaleY: 1,
          smile: true,
          frown: false,
          mouthLine: false,
          blush: true,
        };
      case "firm":
        return {
          browLeft: "M84 90 Q100 82 116 86",
          browRight: "M140 86 Q156 82 172 90",
          eyeScaleY: 0.95,
          smile: false,
          frown: false,
          mouthLine: true,
          blush: false,
        };
      case "thinking":
        return {
          browLeft: "M84 88 Q100 84 116 90",
          browRight: "M140 86 Q156 80 172 86",
          eyeScaleY: 0.95,
          smile: false,
          frown: false,
          mouthLine: false,
          blush: false,
        };
      case "concerned":
        return {
          browLeft: "M84 86 Q100 94 116 88",
          browRight: "M140 88 Q156 94 172 86",
          eyeScaleY: 0.9,
          smile: false,
          frown: true,
          mouthLine: false,
          blush: false,
        };
      default:
        return {
          browLeft: "M84 88 Q100 84 116 88",
          browRight: "M140 88 Q156 84 172 88",
          eyeScaleY: 1,
          smile: false,
          frown: false,
          mouthLine: false,
          blush: false,
        };
    }
  }, [tone]);

  const mouth = useMemo(() => {
    if (!isTalking) {
      if (expression.smile) {
        return (
          <path
            d="M108 166 Q128 178 148 166"
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
            d="M110 170 Q128 158 146 170"
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
            d="M112 166 L144 166"
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

    if (mouthFrame === 0) {
      return <ellipse cx="128" cy="166" rx="10" ry="6" fill={appearance.lips} />;
    }
    if (mouthFrame === 1) {
      return <ellipse cx="128" cy="166" rx="8" ry="11" fill={appearance.lips} />;
    }
    return <ellipse cx="128" cy="166" rx="12" ry="8" fill={appearance.lips} />;
  }, [isTalking, mouthFrame, expression, appearance]);

  const hair = useMemo(() => {
    switch (appearance.hairStyle) {
      case 0:
        return (
          <>
            <path
              d="M63 103 Q72 36 128 34 Q184 36 193 103 L193 118 Q177 92 152 84 Q138 80 128 80 Q118 80 104 84 Q79 92 63 118 Z"
              fill={appearance.hair}
            />
            <path d="M70 95 Q78 78 90 68" stroke={appearance.hair} strokeWidth="12" strokeLinecap="round" />
            <path d="M186 96 Q178 78 166 68" stroke={appearance.hair} strokeWidth="12" strokeLinecap="round" />
          </>
        );
      case 1:
        return (
          <>
            <path
              d="M58 110 Q64 30 128 28 Q192 30 198 110 Q180 90 154 82 Q138 78 128 78 Q118 78 102 82 Q76 90 58 110 Z"
              fill={appearance.hair}
            />
            <path d="M86 54 Q100 42 120 40" stroke={appearance.hair} strokeWidth="10" strokeLinecap="round" />
          </>
        );
      case 2:
        return (
          <>
            <path
              d="M62 108 Q76 38 128 34 Q180 38 194 108 Q174 86 150 82 Q138 80 128 80 Q118 80 106 82 Q82 86 62 108 Z"
              fill={appearance.hair}
            />
            <path d="M70 108 Q66 145 76 178" stroke={appearance.hair} strokeWidth="10" strokeLinecap="round" />
            <path d="M186 108 Q190 145 180 178" stroke={appearance.hair} strokeWidth="10" strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            <path
              d="M60 102 Q70 34 128 32 Q186 34 196 102 L196 118 Q180 94 154 86 Q140 82 128 82 Q116 82 102 86 Q76 94 60 118 Z"
              fill={appearance.hair}
            />
            <path d="M112 40 Q126 24 144 42" stroke={appearance.hair} strokeWidth="10" strokeLinecap="round" />
          </>
        );
    }
  }, [appearance]);

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
          <ellipse
            cx="128"
            cy="132"
            rx={appearance.faceWidth}
            ry={appearance.faceHeight}
            fill={appearance.skin}
          />

          {hair}

          <ellipse cx="88" cy="143" rx="10" ry="14" fill={appearance.skin} />
          <ellipse cx="168" cy="143" rx="10" ry="14" fill={appearance.skin} />

          {expression.blush && (
            <>
              <ellipse cx="92" cy="160" rx="10" ry="5" fill={appearance.blush} />
              <ellipse cx="164" cy="160" rx="10" ry="5" fill={appearance.blush} />
            </>
          )}

          <path d={expression.browLeft} stroke="#4B3427" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d={expression.browRight} stroke="#4B3427" strokeWidth="4" fill="none" strokeLinecap="round" />

          {!blink ? (
            <>
              <ellipse
                cx="102"
                cy="116"
                rx="8"
                ry={10 * expression.eyeScaleY}
                fill={appearance.eyes}
              />
              <ellipse
                cx="154"
                cy="116"
                rx="8"
                ry={10 * expression.eyeScaleY}
                fill={appearance.eyes}
              />
              <circle cx="104" cy="112" r="2.5" fill="#fff" />
              <circle cx="156" cy="112" r="2.5" fill="#fff" />
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
          ) : (
            <>
              <path d="M94 116 Q102 120 110 116" stroke="#2C1E16" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M146 116 Q154 120 162 116" stroke="#2C1E16" strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          )}

          {appearance.glasses && (
            <>
              <circle cx="102" cy="116" r="14" stroke="#222" strokeWidth="3" fill="none" />
              <circle cx="154" cy="116" r="14" stroke="#222" strokeWidth="3" fill="none" />
              <line x1="116" y1="116" x2="140" y2="116" stroke="#222" strokeWidth="3" />
            </>
          )}

          <path
            d={`M128 122 Q${122 + appearance.noseShift} 145 ${129 + appearance.noseShift} 150`}
            stroke="#C48D6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {appearance.mole && <circle cx="154" cy="154" r="1.8" fill="#7A4E3A" />}

          {mouth}

          {appearance.accessory === 0 && (
            <circle cx="182" cy="148" r="3.5" fill="#D4AF37" opacity={0.9} />
          )}
          {appearance.accessory === 1 && (
            <circle cx="74" cy="148" r="3.5" fill="#D4AF37" opacity={0.9} />
          )}
        </svg>
      </div>
    </div>
  );
}