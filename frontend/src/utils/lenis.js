import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "@mui/material";
import { useLenis } from "lenis/react";

/**
 * Lenis options tuned for prefers-reduced-motion.
 * - Default: 1.2s exponential easing, smoothWheel on.
 * - Reduced motion: instant (linear, duration 0) — native jump, no anim.
 *
 * Used by <ReactLenis options={...}> in RootLayout.
 */
export function useLenisOptions() {
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  if (reduce) {
    return { duration: 0, easing: (t) => t };
  }
  return { duration: 1.2, smoothWheel: true };
}

/**
 * Pauses Lenis while an overlay (Dialog/Drawer/Lightbox) is open so the
 * page behind doesn't scroll when the user scrolls the overlay body.
 * Resumes on close AND on unmount (covers StrictMode double-invoke and
 * mid-dialog route changes).
 */
export function useLenisStop(open) {
  const lenis = useLenis();
  useEffect(() => {
    if (!open || !lenis) return undefined;
    lenis.stop();
    return () => lenis.start();
  }, [open, lenis]);
}

/**
 * Scrolls to top on every pathname change (nav clicks, back/forward,
 * <Navigate> redirects, deep-link entry). Uses `immediate: true` to skip
 * animation — animated scroll-to-top on every route change is jarring.
 *
 * Deps use `pathname` only (not `search` / `hash`) so query-param changes
 * don't trigger a reset.
 */
export function useScrollResetOnRouteChange() {
  const { pathname } = useLocation();
  const lenis = useLenis();
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
  }, [pathname, lenis]);
}
