import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

/**
 * Reveal — IntersectionObserver scroll-in fade + 8px lift.
 * Honors prefers-reduced-motion. Falls back to visible after 800ms if
 * observer never fires (SSR, headless screenshots, fast scrolls past).
 */
export const Reveal = ({ children, delay = 0, threshold = 0.1, sx, ...props }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: skip animation entirely
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    // No IntersectionObserver: show immediately
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    // If element is already in viewport on mount, reveal on next frame
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold }
    );
    obs.observe(el);

    // Fallback: always reveal within 1200ms even if observer doesn't fire
    const fallback = setTimeout(() => setVisible(true), 1200);

    return () => {
      obs.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold]);

  return (
    <Box
      ref={ref}
      className={visible ? "hverdag-reveal is-visible" : "hverdag-reveal"}
      sx={{
        transitionDelay: `${delay}ms`,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default Reveal;
