# Hverdag Scandinavian Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin + rebuild the entire MERN e-commerce frontend as a calm, Scandinavian "Hverdag" experience — terracotta/sage/mustard accents, Fraunces+Inter typography, 300–400ms organic motion, soft radii/shadows, 9 new primitives, per-page rebuild against them, zero console/network errors, fully responsive.

**Architecture:** Token cascade (one `tokens.js` edit reskins every `var(--t-*)` consumer) + fresh primitive set (9 new, `Card` retired → `Tile`/`Surface`) + per-page rebuild consuming primitives. Frontend-only; no backend API changes. Existing infra (Stripe Elements, CSRF, JWT cookie, HIBP, currency route-lock, RTK Query) preserved untouched.

**Tech Stack:** React 17, Redux Toolkit, Material UI, Tailwind CSS (existing, reduced), Jest + React Testing Library, chrome-devtools-mcp for verification.

**Spec:** `docs/superpowers/specs/2026-07-08-scandinavian-redesign-design.md` (commit `27ca94b`).

## Global Constraints

- **No commits** until the user tests the full result end-to-end. Every task's "Commit" step is replaced with: stage changes (`git add`), record readiness in a per-phase status log at `docs/superpowers/plans/hverdag-status.md`, and stop. The user commits after final verification.
- **No backend changes.** API endpoints, models, controllers, middleware untouched.
- **Existing tests must stay green.** Baseline: 21 Jest suites / 189 tests. New tests added per primitive only where a branch/loop/async/data path exists (TDD where it earns a check; YAGNI for trivial one-liners).
- **Per-phase gate (hard):** `npm test` green → `npm run build` green → `npm start` + chrome-devtools `list_console_messages` (0 errors) + `list_network_requests` (0 client 4xx/5xx) → mark phase ready. No phase passes with a console warning or a 4xx.
- **Reduced motion:** all animations honor `@media (prefers-reduced-motion: reduce)` → duration 0.01ms, unfurl → opacity-only. Ambient loops paused when `document.hidden` or offscreen.
- **Accessibility:** focus-visible terracotta outline, 44px hit targets on QtyStepper, semantic headings, Disclosure uses `<button>` + `aria-expanded`/`aria-controls`.
- **Color rule:** terracotta <8% of any screen's ink; mustard never adjacent to terracotta.
- **Fonts:** Fraunces (400, 500; opsz 9..144) + Inter (400, 500, 600, 700) via Google Fonts only. No new font libs.
- **No new CSS framework or component library.** MUI + tokens + primitives only.
- **Forbidden:** parallax, count-ups, auto-carousels, scroll-jacking, urgency timers, upsell modules in cart, Fraunces in admin tables, Reveal-on-scroll in admin.

---

## File Structure

### Create (new files)

- `frontend/src/design/primitives/Disclosure.jsx` — expandable, `unfurl` easing
- `frontend/src/design/primitives/Field.jsx` — input + gentle validation copy
- `frontend/src/design/primitives/FieldRow.jsx` — generous-spaced field wrapper
- `frontend/src/design/primitives/StepIndicator.jsx` — soft checkout progress
- `frontend/src/design/primitives/QuietFilter.jsx` — shelf-side filters
- `frontend/src/design/primitives/QtyStepper.jsx` — tactile ± quantity
- `frontend/src/design/primitives/Tile.jsx` — soft evenly-spaced product/category tile
- `frontend/src/design/primitives/Surface.jsx` — elevated panel (cards)
- `frontend/src/design/primitives/Badge.jsx` — role-mapped accent
- `frontend/src/design/primitives/ThanksBlock.jsx` — calm confirmation
- `frontend/src/design/primitives/Reveal.jsx` — IntersectionObserver scroll-in
- `frontend/src/design/primitives/__tests__/Disclosure.test.js`
- `frontend/src/design/primitives/__tests__/QtyStepper.test.js`
- `frontend/src/design/primitives/__tests__/QuietFilter.test.js`
- `frontend/src/design/primitives/__tests__/Badge.test.js`
- `frontend/src/design/primitives/__tests__/StepIndicator.test.js`
- `frontend/src/design/primitives/__tests__/Reveal.test.js`
- `frontend/src/components/Home/Hero.js` — Hverdag hero (rebuild)
- `frontend/src/components/Home/CategoryGrid.js` — rebuild equal-height tiles
- `frontend/src/components/Home/ProductSection.js` — rebuild
- `frontend/src/components/Home/Manifesto.js` — rebuild ≤65ch
- `frontend/src/assets/hverdag-spoon.svg` — confirmation line drawing
- `docs/superpowers/plans/hverdag-status.md` — per-phase readiness log

### Modify (existing files)

- `frontend/src/design/tokens.js` — palette/type/motion/shape/shadow reskin
- `frontend/src/design/tokens-css.js` — responsive grid classes + reduced-motion + measure
- `frontend/src/design/theme.js` — MUI theme cascade
- `frontend/src/design/primitives/index.js` — export new, remove Card/SeverityPill
- `frontend/src/design/primitives/Button.jsx` — terracotta + hover lift
- `frontend/src/design/primitives/Headline.jsx` — Fraunces for display levels
- `frontend/src/design/primitives/Price.jsx` — terracotta-anchored default
- `frontend/public/index.html` — Fraunces + Inter font links
- `frontend/src/index.css` — base serif headlines, terracotta selection/focus, reduced-motion
- `frontend/src/components/Home/Header.js` — "Hverdag" logo, brand copy
- `frontend/src/components/Home/Footer.js` — "looked after by Hverdag"
- `frontend/src/components/Home/Home.js` — compose rebuilt sections
- `frontend/src/components/Product/Products.js` — full rebuild (QuietFilter + grid)
- `frontend/src/components/Search.js` — reuse listing composition
- `frontend/src/components/Product/PDP/ProductDetailsV2.js` — Disclosure stack + grid
- `frontend/src/components/Cart/Basket.js` — QtyStepper + soft dividers + settle
- `frontend/src/components/Checkout/Shipping.js` — StepIndicator + Field
- `frontend/src/components/Checkout/AddressForm.js` — Field/FieldRow
- `frontend/src/components/Checkout/PaymentForm.js` — themed Stripe Elements
- `frontend/src/components/Checkout/ReviewOrder.js` — Surface summary
- `frontend/src/components/Checkout/Success.js` — ThanksBlock + SVG
- `frontend/src/components/Account/Account.js` — Surface cards
- `frontend/src/components/Order/MyOrders.js` — Surface + Badge
- `frontend/src/components/Order/OrderDetails*.js` — Surface cards
- `frontend/src/components/Admin/DashBoard.js` — neutral-led, Card→Surface
- `frontend/src/components/Admin/AllOrders/AllAdminOrders.js` — Surface
- `frontend/src/components/Admin/AllUsers/AllAdminUsers.js` — Surface
- `frontend/src/components/Admin/AllProducts/AllAdminProducts.js` — Surface

### Retire

- `frontend/src/design/primitives/Card.jsx` — replaced by `Tile` + `Surface` (remove from index; keep file until no importers, then delete)
- `frontend/src/components/Order/SeverityPill.js` export path in design index (admin keeps its own import)

---

## Task 0: Setup + baseline

**Files:**

- Create: `docs/superpowers/plans/hverdag-status.md`
- Read: `frontend/src/design/tokens.js`, `frontend/src/design/theme.js`, `frontend/src/App.js`

**Interfaces:** none (baseline only)

- [ ] **Step 1: Capture test baseline**

Run: `npm test -- --silent 2>&1 | tail -5`
Expected: 21 suites / ~189 tests pass (baseline). Record exact number in status log.

- [ ] **Step 2: Capture running-app console/network baseline**

Run: `npm start --prefix frontend` (background). Open `http://localhost:3000` via chrome-devtools `new_page`. Run `list_console_messages` + `list_network_requests`. Record any errors/warnings as baseline noise to fix in Phase 0 or note as pre-existing. Stop the dev server.

- [ ] **Step 3: Init status log**

Write `docs/superpowers/plans/hverdag-status.md`:

```
# Hverdag Redesign — Phase Readiness Log
Baseline: <N> tests green. Pre-existing console noise: <list or none>.
Phases: 0=pending 1=pending 2=pending … 11=pending
```

- [ ] **Step 4: Stage status log (no commit)**

Run: `git add docs/superpowers/plans/hverdag-status.md`

---

## Task 1 (Phase 0): Tokens + fonts — cascade reskin

**Files:**

- Modify: `frontend/src/design/tokens.js` (full rewrite)
- Modify: `frontend/src/design/theme.js:11-27` (add accent palette + display font)
- Modify: `frontend/src/design/tokens-css.js` (responsive grids + reduced-motion + measure)
- Modify: `frontend/public/index.html:8-11` (Fraunces + Inter font link)
- Modify: `frontend/src/index.css:1-2,16,24-32` (serif headlines, terracotta selection/focus, reduced-motion)

**Interfaces:**

- Produces: CSS custom properties `--t-primary-*` (terracotta), `--t-accent-sage-*`, `--t-accent-mustard-*`, `--t-fontFamily-display`, `--t-motion-easing-unfurl`, `--t-motion-easing-soft`, `--t-border-radius-xl`, `--t-measure-base`; MUI `theme.palette.accent.sage` / `.mustard`.

- [ ] **Step 1: Rewrite `frontend/src/design/tokens.js`**

```js
export const tokens = {
  neutral: {
    50: "#FAFAF9",
    100: "#F5F5F4",
    200: "#E7E5E4",
    300: "#D6D3D1",
    400: "#A8A29E",
    500: "#78716C",
    600: "#57534E",
    700: "#44403C",
    800: "#292524",
    900: "#1C1917",
  },
  primary: {
    // terracotta
    50: "#FBF1EC",
    100: "#F5DFD3",
    200: "#E9BFAE",
    300: "#DC9F89",
    400: "#C67F63",
    500: "#A86A4D",
    600: "#92593F",
    700: "#744632",
    800: "#5A3626",
    900: "#3F2619",
  },
  accent: {
    sage: {
      // availability / success
      50: "#F1F4EE",
      100: "#E2E9DB",
      200: "#C7D3BA",
      300: "#A9BC97",
      400: "#8A9A7B",
      500: "#6F8060",
      600: "#586A4C",
    },
    mustard: {
      // rare badge only
      400: "#C9A227",
      700: "#7A6215",
    },
  },
  semantic: {
    success: "#8A9A7B",
    warning: "#AC8A1E",
    error: "#B4452F",
    info: "#566649",
  },
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    display: '"Fraunces", Georgia, "Times New Roman", serif',
    mono: '"SF Mono", "Fira Code", monospace',
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1.0625rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.5rem",
    "5xl": "3.5rem",
    "6xl": "4rem",
  },
  fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700, heavy: 800 },
  lineHeight: { tight: 1.15, snug: 1.35, base: 1.6, loose: 1.75, looser: 1.45 },
  letterSpacing: {
    tighter: "-0.03em",
    tight: "-0.01em",
    normal: "0",
    wide: "0.05em",
    wider: "0.1em",
  },
  space: {
    xs: "0.5rem",
    sm: "0.75rem",
    base: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "3rem",
    "2xl": "4rem",
    "3xl": "6rem",
    "4xl": "8rem",
  },
  motion: {
    duration: { instant: "80ms", fast: "200ms", base: "300ms", slow: "400ms" },
    easing: {
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      unfurl: "cubic-bezier(0.22, 1, 0.36, 1)",
      soft: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
  },
  grid: { columns: 12, gutter: "1.5rem", containerMax: "84rem", containerPad: "2rem" },
  measure: { base: "65ch" },
  border: {
    radius: {
      none: "0",
      sm: "6px",
      base: "10px",
      md: "14px",
      lg: "20px",
      xl: "28px",
      full: "9999px",
    },
    width: { thin: "1px", base: "2px" },
  },
  shadow: {
    none: "none",
    sm: "0 1px 2px rgba(28,25,23,0.04)",
    base: "0 2px 8px rgba(28,25,23,0.04), 0 1px 2px rgba(28,25,23,0.03)",
    md: "0 8px 24px -6px rgba(28,25,23,0.08)",
    lg: "0 20px 48px -12px rgba(28,25,23,0.12)",
  },
  zIndex: { dropdown: 1000, sticky: 1100, overlay: 1200, modal: 1300, toast: 1400 },
};

export default tokens;
```

- [ ] **Step 2: Add accent palette + display font to `frontend/src/design/theme.js`**

In the `palette:` block, after the `primary:` block (lines 11–13), add:

```js
    accent: {
      sage: { main: tokens.accent.sage[400], light: tokens.accent.sage[300], dark: tokens.accent.sage[600] },
      mustard: { main: tokens.accent.mustard[400], dark: tokens.accent.mustard[700] },
    },
```

In `typography:`, update h1/h2/h3 to use display font + looser line-height:

```js
    h1: { fontFamily: tokens.fontFamily.display, fontSize: tokens.fontSize['5xl'], fontWeight: tokens.fontWeight.medium, lineHeight: tokens.lineHeight.looser, letterSpacing: tokens.letterSpacing.tight, color: tokens.neutral[900] },
    h2: { fontFamily: tokens.fontFamily.display, fontSize: tokens.fontSize['4xl'], fontWeight: tokens.fontWeight.medium, lineHeight: 1.25, color: tokens.neutral[900] },
    h3: { fontFamily: tokens.fontFamily.display, fontSize: tokens.fontSize['3xl'], fontWeight: tokens.fontWeight.medium, lineHeight: tokens.lineHeight.snug, color: tokens.neutral[900] },
    h4: { fontFamily: tokens.fontFamily.display, fontSize: tokens.fontSize['2xl'], fontWeight: tokens.fontWeight.medium, lineHeight: tokens.lineHeight.snug, color: tokens.neutral[900] },
```

Update the `MuiRating` icon color (line 64): `icon: { color: tokens.accent.mustard[700] }`.

- [ ] **Step 3: Update `frontend/src/design/tokens-css.js`** — replace the `<style>` template body with:

```js
export const TokenCSS = () => (
  <style>{`
    :root { ${Object.entries(flat(tokens))
      .map(([k, v]) => `${k}: ${v};`)
      .join("\n      ")} }
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    .prod-grid { grid-template-columns: repeat(4, 1fr); }
    .cat-grid  { grid-template-columns: repeat(4, 1fr); }
    .pdp-grid  { grid-template-columns: 1fr 1.2fr; }
    .cart-layout { grid-template-columns: 1fr 380px; }
    .order-details-grid { grid-template-columns: 1fr 1fr; }
    .filter-grid { grid-template-columns: 280px 1fr; }
    .checkout-grid { grid-template-columns: 1fr 380px; }
    .account-grid { grid-template-columns: 1fr 380px; }
    @media (max-width: 1024px) {
      .prod-grid, .cat-grid { grid-template-columns: repeat(3, 1fr); }
      .cart-layout, .checkout-grid, .account-grid, .filter-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .prod-grid, .cat-grid { grid-template-columns: repeat(2, 1fr); }
      .pdp-grid, .order-details-grid { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 480px) {
      .prod-grid, .cat-grid { grid-template-columns: 1fr; }
    }
    :root { --t-measure-base: 65ch; }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `}</style>
);
```

Keep the `flat()` helper and the `import` lines unchanged.

- [ ] **Step 4: Swap font links in `frontend/public/index.html`** (lines 8–11)

Replace the single Inter `<link>` with:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
```

- [ ] **Step 5: Update `frontend/src/index.css`**

Replace lines 1–2 (the `@import` for Inter — now loaded via `<link>`) with nothing (delete the `@import`). Update `body` color to `#57534E` (unchanged) and keep background `#FAFAF9`. Update `::selection` background to `rgba(146, 89, 63, 0.15)` (terracotta-15%) and `:focus-visible` outline to `2px solid #92593F`. Add after `body`:

```css
h1,
h2,
h3,
h4.hero {
  font-family: "Fraunces", Georgia, serif;
}
```

Keep `.fade-in` and `.app-loader`.

- [ ] **Step 6: Run tests (regression)**

Run: `npm test -- --silent 2>&1 | tail -5`
Expected: baseline green (21 suites). Login/ProductCard tests may need avatar/color snapshot tolerance — if a test asserts a specific hex, fix the test assertion to match new tokens, do NOT revert tokens.

- [ ] **Step 7: Build**

Run: `npm run build --prefix frontend 2>&1 | tail -10`
Expected: build succeeds, no warnings.

- [ ] **Step 8: Visual console/network sweep**

Run `npm start --prefix frontend` (background). Open `http://localhost:3000` via chrome-devtools `new_page`. Run `list_console_messages` (expect 0 errors) + `list_network_requests` (expect 0 client 4xx). Navigate `/products`. Stop server.

- [ ] **Step 9: Stage + log (no commit)**

Run: `git add -A`. Append to `docs/superpowers/plans/hverdag-status.md`: `Phase 0: ready (tokens+fonts reskinned, <N> tests green, console clean).`

---
