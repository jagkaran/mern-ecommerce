// components/Home/Header/useHeaderScroll.js
// Tracks whether the page has scrolled past a small threshold. Used to add a
// subtle bottom-border + shadow to the header on scroll. Passive scroll
// listener — no re-renders other than the boolean flip.

import { useEffect, useState } from "react";

export default function useHeaderScroll(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
