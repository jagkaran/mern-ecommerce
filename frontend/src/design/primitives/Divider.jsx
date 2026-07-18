import React from "react";

export const Divider = ({ style, ...props }) => (
  <hr
    style={{
      border: "none",
      height: "1px",
      background: "var(--t-neutral-200)",
      marginBlock: "var(--t-space-xl)",
      ...style,
    }}
    {...props}
  />
);
