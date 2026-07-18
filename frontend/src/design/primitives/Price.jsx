import React from "react";

export const Price = ({ large, primary = true, muted, style, ...props }) => (
  <span
    style={{
      fontFamily: "var(--t-fontFamily-sans)",
      fontSize: large ? "var(--t-fontSize-2xl)" : "var(--t-fontSize-xl)",
      fontWeight: 500,
      color: primary
        ? "var(--t-primary-600)"
        : muted
          ? "var(--t-neutral-400)"
          : "var(--t-neutral-900)",
      letterSpacing: "var(--t-letterSpacing-tight)",
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
      ...style,
    }}
    {...props}
  />
);
