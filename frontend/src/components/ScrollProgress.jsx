import { useRef } from "react";
import { Box } from "@mui/material";
import { useLenis } from "lenis/react";

// Thin top-of-viewport bar driven by Lenis scroll progress (0..1).
// Updates via direct DOM mutation so we don't trigger a React render
// every frame — `useLenis` callback fires ~60×/sec during scroll.
export default function ScrollProgress() {
  const barRef = useRef(null);
  useLenis((l) => {
    if (barRef.current) {
      barRef.current.style.transform = `scaleX(${l.progress})`;
    }
  });

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 1200, // above header (1100), under dialog/drawer (1300)
        pointerEvents: "none",
        backgroundColor: "transparent",
      }}
    >
      <div
        ref={barRef}
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: "var(--t-primary-600)",
          transformOrigin: "left center",
          transform: "scaleX(0)",
          willChange: "transform",
        }}
      />
    </Box>
  );
}
