import React from "react";

export const Container = ({ children, ...props }) => (
  <div
    style={{
      maxWidth: "var(--t-grid-containerMax)",
      marginInline: "auto",
      paddingInline: "var(--t-grid-containerPad)",
      ...props.style,
    }}
    {...props}
  >
    {children}
  </div>
);
