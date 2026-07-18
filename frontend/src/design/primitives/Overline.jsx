import React from "react";

export const Overline = ({ as = "span", style, ...props }) => {
  const Tag = as;
  return (
    <Tag
      style={{
        fontSize: "var(--t-fontSize-xs)",
        fontWeight: 500,
        letterSpacing: "var(--t-letterSpacing-wider)",
        textTransform: "uppercase",
        color: "var(--t-neutral-400)",
        lineHeight: "var(--t-lineHeight-base)",
        display: "block",
        marginBottom: "var(--t-space-sm)",
        ...style,
      }}
      {...props}
    />
  );
};
