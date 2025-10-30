import React from "react";
import { colors } from "./colors";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "md" | "sm";
};

export function Button({ variant = "default", size = "md", style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: size === "sm" ? 32 : 40,
    padding: size === "sm" ? "0 12px" : "0 16px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 120ms ease, border-color 120ms ease, opacity 120ms",
  };
  const styles: Record<string, React.CSSProperties> = {
    default: { background: colors.primary, color: "#fff", border: `1px solid ${colors.primary}` },
    outline: { background: "transparent", color: colors.text, border: `1px solid ${colors.border}` },
    ghost: { background: "transparent", color: colors.text, border: "1px solid transparent" },
  };
  const hover =
    variant === "default"
      ? { background: colors.primaryHover, borderColor: colors.primaryHover }
      : { background: "#111827" };

  return (
    <button
      {...props}
      onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, hover)}
      onMouseLeave={(e) =>
        Object.assign((e.currentTarget as HTMLButtonElement).style, styles[variant])
      }
      style={{ ...base, ...styles[variant], ...style }}
    />
  );
}
