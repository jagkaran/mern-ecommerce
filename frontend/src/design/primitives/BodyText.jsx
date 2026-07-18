import React from "react";

export const BodyText = ({ lead, small, style, ...props }) => (
  <p
    style={{
      fontSize: lead
        ? "var(--t-fontSize-lg)"
        : small
          ? "var(--t-fontSize-sm)"
          : "var(--t-fontSize-base)",
      lineHeight: lead ? "var(--t-lineHeight-loose)" : "var(--t-lineHeight-base)",
      color: lead
        ? "var(--t-neutral-700)"
        : small
          ? "var(--t-neutral-400)"
          : "var(--t-neutral-600)",
      maxWidth: lead ? "65ch" : undefined,
      ...style,
    }}
    {...props}
  />
);
