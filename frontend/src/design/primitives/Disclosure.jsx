import React, { useState, useRef } from "react";
import { Box } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

let disclosureCounter = 0;
const nextId = () => `disclosure-${++disclosureCounter}`;

/**
 * Disclosure — expandable section with unfurl easing.
 * One open at a time is encouraged but not enforced.
 */
export const Disclosure = ({ title, children, defaultOpen = false, id, sx }) => {
  const [open, setOpen] = useState(defaultOpen);
  const generatedRef = useRef(null);
  if (!generatedRef.current) generatedRef.current = nextId();
  const panelId = id || generatedRef.current;
  const btnId = `${panelId}-btn`;

  return (
    <Box
      sx={{
        borderTop: "1px solid var(--t-neutral-200)",
        "&:last-of-type": { borderBottom: "1px solid var(--t-neutral-200)" },
        ...sx,
      }}
    >
      <Box
        component="button"
        id={btnId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 2,
          px: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--t-neutral-900)",
          fontFamily: "inherit",
          fontSize: "var(--t-fontSize-lg)",
          fontWeight: 500,
          letterSpacing: "var(--t-letterSpacing-tight)",
          transition: "color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
          "&:hover": { color: "var(--t-primary-600)" },
          "&:focus-visible": {
            outline: "2px solid var(--t-primary-600)",
            outlineOffset: "4px",
            borderRadius: "var(--t-border-radius-sm)",
          },
        }}
      >
        <span>{title}</span>
        <ExpandMoreIcon
          sx={{
            color: "var(--t-neutral-500)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform var(--t-motion-duration-slow) var(--t-motion-easing-unfurl)",
          }}
        />
      </Box>
      <Box
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        hidden={!open}
        sx={{
          overflow: "hidden",
          maxHeight: open ? "1200px" : 0,
          opacity: open ? 1 : 0,
          transition: open
            ? "max-height var(--t-motion-duration-slow) var(--t-motion-easing-unfurl), opacity var(--t-motion-duration-slow) var(--t-motion-easing-unfurl)"
            : "max-height var(--t-motion-duration-base) var(--t-motion-easing-out), opacity var(--t-motion-duration-base) var(--t-motion-easing-out)",
        }}
      >
        <Box
          sx={{
            pb: 3,
            color: "var(--t-neutral-600)",
            fontSize: "var(--t-fontSize-base)",
            lineHeight: 1.6,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Disclosure;
