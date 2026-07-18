import React from "react";

export const Card = ({ noBorder, interactive, style, ...props }) => (
  <article
    style={{
      background: "#fff",
      border: noBorder ? "1px solid transparent" : "1px solid var(--t-neutral-200)",
      borderRadius: "var(--t-border-radius-md)",
      overflow: "hidden",
      cursor: interactive ? "pointer" : "default",
      transition:
        "border-color 200ms cubic-bezier(0,0,0.2,1), box-shadow 200ms cubic-bezier(0,0,0.2,1)",
      ...style,
    }}
    {...props}
  />
);

export const CardBody = ({ children, ...props }) => (
  <div style={{ padding: "var(--t-space-lg)", ...props.style }} {...props}>
    {children}
  </div>
);
