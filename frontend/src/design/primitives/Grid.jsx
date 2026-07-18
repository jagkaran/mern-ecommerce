import React from "react";

export const Grid = ({ cols, gap, style, ...props }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: cols ? `repeat(${cols}, 1fr)` : "repeat(12, 1fr)",
      gap: gap || "var(--t-grid-gutter)",
      ...style,
    }}
    {...props}
  />
);
