import React from "react";

export const Section = ({ flush, tight, loose, style, ...props }) => {
  const pad = loose ? "var(--t-space-3xl)" : tight ? "var(--t-space-xl)" : "var(--t-space-2xl)";
  return <section style={{ width: "100%", paddingBlock: flush ? 0 : pad, ...style }} {...props} />;
};
