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
    switch (tone) {
      case "friendly":
        return {
          browLeft: "M84 92 Q100 84 116 92",
          browRight: "M140 92 Q156 84 172 92",
          eyeScaleY: 1,
          smile: true,
          frown: false,
          mouthLine: false,
          blush: true,
        };
      case "firm":
        return {
          browLeft: "M84 94 Q100 86 116 90",
          browRight: "M140 90 Q156 86 172 94",
          eyeScaleY: 0.95,
          smile: false,
          frown: false,
          mouthLine: true,
          blush: false,
        };
      case "thinking":
        return {
          browLeft: "M84 92 Q100 88 116 94",
          browRight: "M140 90 Q156 84 172 90",
          eyeScaleY: 0.95,
          smile: false,
          frown: false,
          mouthLine: false,
          blush: false,
        };
      case "concerned":
        return {
          browLeft: "M84 90 Q100 98 116 92",
          browRight: "M140 92 Q156 98 172 90",
          eyeScaleY: 0.9,
          smile: false,
          frown: true,
          mouthLine: false,
          blush: false,
        };
      default:
        return {
          browLeft: "M84 92 Q100 88 116 92",
          browRight: "M140 92 Q156 88 172 92",
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

    if (mouthFrame === 0) {
      return <ellipse cx="128" cy="166" rx="11" ry="6.5" fill={appearance.lips} />;
    }
    if (mouthFrame === 1) {
      return <ellipse cx="128" cy="166" rx="8.5" ry="11.5" fill={appearance.lips} />;
    }
    return <ellipse cx="128" cy="166" rx="12.5" ry="8.5" fill={appearance.lips} />;
  }, [isTalking, mouthFrame, expression, appearance]);

  const hairShape = useMemo(() => {
    return (
      <>
        {/* Back/top hair mass - sits behind head, open around face */}
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

        {/* Left front section */}
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

        {/* Right front section */}
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

        {/* Center part seam */}
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

          {/* Head */}
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

          {/* Ears */}
          <ellipse cx="88" cy="144" rx="9" ry="13" fill={appearance.skin} />
          <ellipse cx="168" cy="144" rx="9" ry="13" fill={appearance.skin} />

          {expression.blush && (
            <>
              <ellipse cx="92" cy="152" rx="10" ry="5" fill={appearance.blush} />
              <ellipse cx="164" cy="152" rx="10" ry="5" fill={appearance.blush} />
            </>
          )}

          {/* Brows */}
          <path d={expression.browLeft} stroke="#4B3427" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d={expression.browRight} stroke="#4B3427" strokeWidth="4" fill="none" strokeLinecap="round" />

          {/* Eyes */}
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

          {/* Nose */}
          <path
            d={`M128 122 Q${122 + appearance.noseShift} 145 ${129 + appearance.noseShift} 151`}
            stroke="#C48D6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {appearance.mole && <circle cx="154" cy="154" r="1.8" fill="#7A4E3A" />}

          {/* Mouth */}
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