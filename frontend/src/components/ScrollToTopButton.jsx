import { useState } from "react";
import { Fab, useMediaQuery } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useLenis } from "lenis/react";

const THRESHOLD = 600;

// Floating "back to top" — fades in past 600px of scroll, fades out above.
// Click glides to top (instant under prefers-reduced-motion). Uses Lenis
// scroll event instead of window scroll listener for accurate value during
// inertia decay.
export default function ScrollToTopButton() {
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [visible, setVisible] = useState(false);
  const lenis = useLenis((l) => {
    const next = l.scroll > THRESHOLD;
    setVisible((prev) => (prev === next ? prev : next));
  });

  const handleClick = () => {
    lenis?.scrollTo(0, reduce ? { immediate: true } : { duration: 1.2 });
  };

  return (
    <Fab
      size="small"
      aria-label="Scroll to top"
      onClick={handleClick}
      tabIndex={visible ? 0 : -1}
      sx={{
        position: "fixed",
        bottom: { xs: 80, md: 24 }, // sits above mobile sticky ATC bar
        right: { xs: 16, md: 24 },
        zIndex: 1100, // tokens.zIndex.sticky
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition:
          "opacity var(--t-motion-duration-base) var(--t-motion-easing-out), transform var(--t-motion-duration-base) var(--t-motion-easing-out)",
        backgroundColor: "var(--t-primary-700)",
        color: "var(--t-neutral-50)",
        boxShadow: "var(--t-shadow-md)",
        "&:hover": { backgroundColor: "var(--t-primary-800)" },
        "&:focus-visible": {
          outline: "2px solid var(--t-primary-700)",
          outlineOffset: "2px",
        },
      }}
    >
      <KeyboardArrowUpIcon />
    </Fab>
  );
}
