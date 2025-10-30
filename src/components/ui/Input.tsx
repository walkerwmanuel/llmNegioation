import React from "react";
import { colors } from "./colors";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Input({ label, style, ...props }: Props) {
  return (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: "100%",
          height: 40,
          padding: "0 12px",
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          background: colors.panelAlt,
          color: colors.text,
          outline: "none",
          boxShadow: "none",
          transition: "box-shadow 120ms ease, border-color 120ms ease",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}55`;
          e.currentTarget.style.borderColor = colors.primary;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = colors.border;
        }}
      />
    </div>
  );
}
