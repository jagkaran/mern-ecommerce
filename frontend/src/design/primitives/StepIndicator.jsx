import React from "react";
import { Box } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

/**
 * StepIndicator — soft checkout progress.
 * Current = terracotta dot, done = sage check, future = neutral ring.
 */
export const StepIndicator = ({ steps, current = 0, sx, onSelect }) => {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  return (
    <Box
      role="list"
      aria-label="Checkout progress"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 2 },
        flexWrap: "wrap",
        ...sx,
      }}
    >
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = typeof onSelect === "function";
        const Wrapper = clickable ? "button" : "div";
        const wrapperProps = clickable
          ? {
              type: "button",
              onClick: () => onSelect(i),
              "aria-label": `Go to ${label}`,
            }
          : {};
        return (
          <React.Fragment key={label}>
            <Box
              role="listitem"
              aria-current={active ? "step" : undefined}
              component={Wrapper}
              {...wrapperProps}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: clickable ? "pointer" : "default",
                background: "transparent",
                border: "none",
                padding: 0,
                font: "inherit",
                color: active
                  ? "var(--t-neutral-900)"
                  : done
                    ? "var(--t-accent-sage-500)"
                    : "var(--t-neutral-400)",
                transition: "color var(--t-motion-duration-base) var(--t-motion-easing-out)",
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--t-border-radius-pill)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--t-fontSize-sm)",
                  fontWeight: 600,
                  backgroundColor: done
                    ? "var(--t-accent-sage-400)"
                    : active
                      ? "var(--t-primary-600)"
                      : "transparent",
                  color: done || active ? "#FFF" : "var(--t-neutral-400)",
                  border: active || done ? "none" : "1.5px solid var(--t-neutral-300)",
                  transition:
                    "background-color var(--t-motion-duration-base) var(--t-motion-easing-out), color var(--t-motion-duration-base) var(--t-motion-easing-out)",
                }}
              >
                {done ? <CheckIcon sx={{ fontSize: 16 }} /> : i + 1}
              </Box>
              <Box
                component="span"
                sx={{
                  fontSize: "var(--t-fontSize-sm)",
                  fontWeight: active ? 600 : 500,
                  letterSpacing: "0.01em",
                }}
              >
                {label}
              </Box>
            </Box>
            {i < steps.length - 1 && (
              <Box
                aria-hidden
                sx={{
                  flex: 1,
                  height: 1,
                  backgroundColor: done ? "var(--t-accent-sage-200)" : "var(--t-neutral-200)",
                  minWidth: 24,
                  transition:
                    "background-color var(--t-motion-duration-base) var(--t-motion-easing-out)",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default StepIndicator;
