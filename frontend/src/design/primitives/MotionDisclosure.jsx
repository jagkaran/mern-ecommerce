import { useRef, useState } from "react";
import { Box } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { AnimatePresence, motion } from "motion/react";

let counter = 0;
const nextId = () => `motion-disclosure-${++counter}`;

/**
 * MotionDisclosure — Disclosure with motion-driven height animation.
 * Smoother expand/collapse than CSS max-height (no hard cap, opacity and
 * height ease in tandem). Same public API as `Disclosure` so it's a
 * drop-in replacement on PDP.
 */
export const MotionDisclosure = ({ title, children, defaultOpen = false, id, sx }) => {
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
      <AnimatePresence initial={false}>
        {open && (
          <Box
            key="content"
            id={panelId}
            role="region"
            aria-labelledby={btnId}
            component={motion.div}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.2, ease: "easeOut" },
            }}
            style={{ overflow: "hidden" }}
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
        )}
      </AnimatePresence>
    </Box>
  );
};

export default MotionDisclosure;
