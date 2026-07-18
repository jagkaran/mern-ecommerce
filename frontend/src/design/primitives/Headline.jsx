import React from "react";

const levelStyles = {
  "5xl": `font-size:var(--t-fontSize-5xl);font-weight:var(--t-fontWeight-medium);line-height:var(--t-lineHeight-looser);letter-spacing:var(--t-letterSpacing-tight);font-family:var(--t-fontFamily-display)`,
  "4xl": `font-size:var(--t-fontSize-4xl);font-weight:var(--t-fontWeight-medium);line-height:1.25;letter-spacing:var(--t-letterSpacing-tight);font-family:var(--t-fontFamily-display)`,
  "3xl": `font-size:var(--t-fontSize-3xl);font-weight:var(--t-fontWeight-medium);line-height:var(--t-lineHeight-snug);font-family:var(--t-fontFamily-display)`,
  "2xl": `font-size:var(--t-fontSize-2xl);font-weight:var(--t-fontWeight-medium);line-height:var(--t-lineHeight-snug);font-family:var(--t-fontFamily-display)`,
  xl: `font-size:var(--t-fontSize-xl);font-weight:var(--t-fontWeight-semibold);line-height:var(--t-lineHeight-snug);font-family:var(--t-fontFamily-sans)`,
  lg: `font-size:var(--t-fontSize-lg);font-weight:var(--t-fontWeight-semibold);line-height:var(--t-lineHeight-snug);font-family:var(--t-fontFamily-sans)`,
};

export const Headline = ({ level = "3xl", style, children, ...props }) => (
  <h2
    style={{
      color: "var(--t-neutral-900)",
      ...(levelStyles[level] ? { cssText: levelStyles[level] } : {}),
      ...style,
    }}
    {...props}
  >
    {children}
  </h2>
);
