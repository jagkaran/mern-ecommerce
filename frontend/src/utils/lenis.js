import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useMediaQuery } from "@mui/material";
import { useLenis } from "lenis/react";
import tokens from "../design/tokens.js";

// Matches <main> padding-top + the sticky header height. Negative because
// lenis.scrollTo offsets the target DOWNWARD when positive; we want the
// section heading to land just below the header, so we shift the target UP.
const HEADER_OFFSET = -parseInt(tokens.headerHeight, 10) || -56;

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

/**
 * Returns a stable callback that smooth-scrolls to a target (CSS selector,
 * HTMLElement, or pixel number) with the app header height subtracted as
 * offset, so the target lands below the sticky header instead of under it.
 *
 * Use: `const scrollToAnchor = useScrollToAnchor()` then
 *      `scrollToAnchor('#pdp-reviews')` on click.
 */
export function useScrollToAnchor() {
  const lenis = useLenis();
  return useCallback(
    (target) => lenis?.scrollTo(target, { offset: HEADER_OFFSET }),
    [lenis]
  );
}
