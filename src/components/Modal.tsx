import React from "react";
import { CardHeader, CardContent, CardTitle } from "./ui/CardBits";
import { colors } from "./ui/colors";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      aria-modal
      role="dialog"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(880px, 96vw)",
          maxHeight: "90vh",
          overflow: "auto",
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}
      >
        <CardHeader style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardTitle>{title}</CardTitle>
          <button
            aria-label="Close"
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: colors.muted, cursor: "pointer" }}
          >
            ×
          </button>
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16, borderTop: `1px solid ${colors.border}` }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
