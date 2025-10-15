import React from "react";
import { colors } from "./colors";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.panel,
        color: colors.text,
        borderRadius: 12,
        boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
        ...props.style,
      }}
    />
  );
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{ padding: "20px 24px", borderBottom: `1px solid ${colors.border}`, ...props.style }}
    />
  );
}

export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} style={{ margin: 0, fontSize: 18, fontWeight: 700, ...props.style }} />;
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} style={{ padding: 24, ...props.style }} />;
}
