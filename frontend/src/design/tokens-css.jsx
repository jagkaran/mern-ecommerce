import React from "react";
import tokens from "./tokens";

const flat = (obj, prefix = "--t") => {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (typeof v === "object" && !Array.isArray(v) && !/^[a-z]+-[0-9]+$/.test(k)) {
      Object.assign(out, flat(v, `${prefix}-${k}`));
    } else {
      out[`${prefix}-${k}`] = v;
    }
  });
  return out;
};

export const TokenCSS = () => (
  <style>{`
    :root { ${Object.entries(flat(tokens))
      .map(([k, v]) => `${k}: ${v};`)
      .join("\n      ")}
      /* PR3 a11y: AA-compliant body text on #FAFAF9 (>=4.5:1) */
      --t-neutral-700: #3D3D3D;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }

    /* Reveal animation */
    @keyframes hverdagReveal {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes hverdagSettle {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes hverdagUnfurl {
      from { opacity: 0; max-height: 0; }
      to   { opacity: 1; max-height: 1200px; }
    }
    @keyframes hverdagSheen {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes hverdagPulse {
      0%   { transform: scale(0.96); }
      100% { transform: scale(1); }
    }
    /* Checkout step transition — quiet crossfade-through. */
    @keyframes hverdagFadeThrough {
      0%   { opacity: 0; transform: translateY(6px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    /* Cart badge pulse after add-to-cart. */
    @keyframes hverdagBadgePulse {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.35); }
      100% { transform: scale(1); }
    }
    .hverdag-fade-through {
      animation: hverdagFadeThrough var(--t-motion-duration-base) var(--t-motion-easing-out);
    }
    .hverdag-badge-pulse {
      animation: hverdagBadgePulse 320ms var(--t-motion-easing-soft);
    }

    .hverdag-reveal {
      opacity: 0;
      transform: translateY(8px);
      transition: opacity var(--t-motion-duration-base) var(--t-motion-easing-soft),
                  transform var(--t-motion-duration-base) var(--t-motion-easing-soft);
    }
    .hverdag-reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .hverdag-settle {
      transition: opacity var(--t-motion-duration-base) var(--t-motion-easing-soft),
                  transform var(--t-motion-duration-base) var(--t-motion-easing-soft);
    }

    /* Layout grids */
    .prod-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--t-grid-gutter);
    }
    .cat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--t-grid-gutter);
    }
    .pdp-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: var(--t-grid-gutter);
    }
    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: var(--t-grid-gutter);
    }
    .checkout-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: var(--t-grid-gutter);
    }
    .account-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--t-grid-gutter);
      align-items: start;
    }
    .filter-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: var(--t-grid-gutter);
    }
    .order-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--t-grid-gutter);
    }

    @media (max-width: 1280px) {
      .prod-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 1024px) {
      .prod-grid, .cat-grid { grid-template-columns: repeat(3, 1fr); }
      .cart-layout, .checkout-grid, .account-grid, .filter-grid {
        grid-template-columns: 1fr;
      }
      .account-grid > :first-child { max-width: 360px; }
    }
    @media (max-width: 768px) {
      .prod-grid, .cat-grid { grid-template-columns: repeat(2, 1fr); }
      .pdp-grid, .order-details-grid { grid-template-columns: 1fr !important; }
      .filter-grid { grid-template-columns: 1fr; }
      .account-grid > :first-child { max-width: 100%; }
    }
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      .hverdag-reveal, .hverdag-settle { opacity: 1 !important; transform: none !important; }
    }

    /* Typography base */
    h1, h2, h3, h4 {
      font-family: var(--t-fontFamily-display);
      letter-spacing: var(--t-letterSpacing-tight);
    }
    h1 {
      font-size: clamp(2.5rem, 5vw, 3.5rem);
      font-weight: 500;
      line-height: 1.2;
    }
    h2 {
      font-size: clamp(2rem, 3.5vw, 2.5rem);
      font-weight: 500;
      line-height: 1.25;
    }
    h3 {
      font-size: 1.875rem;
      font-weight: 500;
      line-height: 1.3;
    }
    h4 {
      font-size: 1.5rem;
      font-weight: 500;
      line-height: 1.35;
    }

    /* Selection + focus */
    ::selection {
      background-color: rgba(146, 89, 63, 0.15);
      color: #1C1917;
    }
    :focus-visible {
      outline: 2px solid #92593F;
      outline-offset: 2px;
      border-radius: 6px;
    }
  `}</style>
);
