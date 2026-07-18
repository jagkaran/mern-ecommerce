import React from "react";
import { Box } from "@mui/material";

/**
 * Badge — role-mapped accent (sage in-stock / mustard new / terracotta price).
 * Variants: success (sage), warning (mustard), primary (terracotta), neutral.
 */
export const Badge = ({ variant = "neutral", children, size = "sm", sx, ...props }) => {
  const palette = {
    success: { bg: "var(--t-accent-sage-100)", color: "var(--t-accent-sage-600)" },
    warning: { bg: "rgba(201, 162, 39, 0.12)", color: "var(--t-accent-mustard-700)" },
    primary: { bg: "var(--t-primary-50)", color: "var(--t-primary-700)" },
    neutral: { bg: "var(--t-neutral-100)", color: "var(--t-neutral-700)" },
    error: { bg: "rgba(180, 69, 47, 0.08)", color: "var(--t-semantic-error)" },
  }[variant] || { bg: "var(--t-neutral-100)", color: "var(--t-neutral-700)" };

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: size === "sm" ? 1 : 1.5,
        py: size === "sm" ? 0.375 : 0.5,
        borderRadius: "var(--t-border-radius-pill)",
        backgroundColor: palette.bg,
        color: palette.color,
        fontSize: size === "sm" ? "var(--t-fontSize-xs)" : "var(--t-fontSize-sm)",
        fontWeight: 500,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        lineHeight: 1.2,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default Badge;
