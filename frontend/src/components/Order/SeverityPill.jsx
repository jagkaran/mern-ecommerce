import React from "react";

const COLOR_MAP = {
  success: { bg: "#15803D", fg: "#fff" },
  warning: { bg: "#A16207", fg: "#fff" },
  error: { bg: "#DC2626", fg: "#fff" },
  info: { bg: "#1D4ED8", fg: "#fff" },
  primary: { bg: "var(--t-primary-600)", fg: "#fff" },
};

function SeverityPill({ color = "primary", children, ...rest }) {
  const { bg, fg } = COLOR_MAP[color] || COLOR_MAP.primary;
  return (
    <span
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: "var(--t-fontSize-xs)",
        fontWeight: 600,
        letterSpacing: "0.05em",
        lineHeight: 2,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        cursor: "default",
      }}
    >
      {children}
    </span>
  );
}

export { SeverityPill };
export default SeverityPill;
