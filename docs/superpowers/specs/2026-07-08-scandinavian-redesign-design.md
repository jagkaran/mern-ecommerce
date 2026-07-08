# Hverdag — Scandinavian Redesign Design Spec

- **Date:** 2026-07-08
- **Status:** Approved (brainstorming complete, awaiting implementation plan)
- **Scope:** Full frontend redesign of the MERN e-commerce app. Frontend-only. No backend API changes.
- **Approach:** Option C — fresh per-page rebuild against a new/extended primitive set, with token cascade reskinning every conformant page.
- **Previous state carried forward:** Modernist design system (tokens.js → tokens-css.js → theme.js → 11 primitives) shipped Phases 0–7 @ commit 825a61d; 21 Jest suites / 189 tests green.

---

## 1. Concept — Hverdag ("the everyday")

**Hverdag** is a Nordic-rooted purveyor of thoughtfully sourced everyday essentials for people who value calm over clutter. The innovative business angle beyond "sells nice things" is the **keeper's model**: every product is a deliberate replacement for a throwaway habit, sold with a **lifetime care covenant** — free mending for ceramics (reglazing), linen (restitching), knives (resharpening), wood (re-oiling). Ownership becomes stewardship; patina is celebrated, not hidden.

The "well-worn wooden spoon passed through generations" from the original brief is the product contract — not just mood. This one idea drives the visuals: **care, longevity, soft wear, the warmth of objects that age well**.

### Emotional arc (animation follows emotion)

Homepage (calm welcome) → Listing (patient discovery) → PDP (confident intimacy) → Cart (reassurance) → Checkout (patient host) → Confirmation (warm close). Motion decelerates and lengthens as the user commits: hover-fast at discovery (200ms), slow-unfurl at PDP and confirmation (400–500ms).

### Voice

Never imperious. "we've got this," "made to last," "looked after." Errors phrase gently: "that email slipped away — try again?" Validation copy is a quiet suggestion, not a red demand.

---

## 2. Palette

Replaces current Tailwind-orange primary (`#EA580C`). Base warm-stone neutrals stay (already Scandi-correct).

### Primary — Terracotta (the action accent)

| Step | Hex | Use |
|---|---|---|
| 500 | `#A86A4D` | hover on primary |
| 600 | `#92593F` | **main CTA, links, focus ring, PDP price anchor** |
| 700 | `#744632` | active/pressed |
| 50–900 | full scale | tints |

Rule: warm accent = emotional detail (CTA, links, focus), **never a marketing flush**. Terracotta occupies <8% of any screen's ink.

### Accent — Sage (availability / success)

| Step | Hex | Use |
|---|---|---|
| 400 | `#8A9A7B` | **in-stock pill, gentle success, order-status "delivered / cared for"** |
| 50–600 | full scale | tints |

### Accent — Mustard (rare badge only)

| Step | Hex | Use |
|---|---|---|
| 400 | `#C9A227` | "New arrival," "restocked" badge |
| 700 | `#7A6215` | mustard text on light |

**Mustard never sits adjacent to terracotta** (one warm accent per region).

### Neutral (base — unchanged)

`50:#FAFAF9 100:#F5F5F4 200:#E7E5E4 300:#D6D3D1 400:#A8A29E 500:#78716C 600:#57534E 700:#44403C 800:#292524 900:#1C1917`. Soft-white base + text.

### Semantic (muted, tempered to the palette)

- error `#B4452F` (terracotta-tempered)
- warning `#AC8A1E` (mustard)
- info `#566649` (sage-deep)
- success = sage 400

---

## 3. Typography — Fraunces (display) + Inter (UI/body)

### Fraunces — soft optical serif

Role: hero + section headlines, H1–H3, PDP title, confirmation thank-you. The "handwritten note" register. Weights 400 / 500, opsz axis 9–144. Line-height **looser 1.45**, letterspacing `−0.01em`.

### Inter — humanist sans (current, kept)

Role: all body, PDP expandable body, checkout microcopy, admin tables, UI labels, overline. Current font, already loading. Line-height 1.6.

### Scale (generous, unhurried)

| Token | Size | Font | Weight | LH |
|---|---|---|---|---|
| H1 | `clamp(2.5rem, 5vw, 3.5rem)` | Fraunces | 500 | 1.2 |
| H2 | `clamp(2rem, 3.5vw, 2.5rem)` | Fraunces | 500 | 1.25 |
| H3 | `1.875rem` | Fraunces | 500 | 1.3 |
| H4 | `1.5rem` | Fraunces | 500 | 1.35 |
| H5 | `1.25rem` | Inter | 600 | 1.35 |
| body | `1.0625rem` | Inter | 400 | 1.6 |
| sm | `0.875rem` | Inter | 400 | 1.6 |
| overline | `0.75rem` | Inter | 500 | 1.4, uppercase `0.12em` |

Fluid H1/H2 via `clamp()` — one scale, no media-query jumps for headings.

---

## 4. Motion — gentle and organic

Replaces current fast (150–250ms) register with slow (300–400ms) organic easing. **animation is a gentle exhale, never a performance** — no more than one major motion visible at once.

### Duration tokens

| Token | Value | Use |
|---|---|---|
| `instant` | 80ms | state swap (icon) |
| `fast` | 200ms | hover, focus — "light touch" |
| `base` | 300ms | section fade-in, filter reveal |
| `slow` | 400ms | PDP unfold, confirmation settle |

### Easing tokens

| Token | Value | Use |
|---|---|---|
| `out` | `cubic-bezier(0,0,0.2,1)` | hover / enter |
| `unfurl` (new) | `cubic-bezier(0.22,1,0.36,1)` | soft decel — expandables, confirmations |
| `soft` (new) | `cubic-bezier(0.16,1,0.3,1)` | quint-out — page reveals |

### Reduced motion (a11y boundary, non-negotiable)

`@media (prefers-reduced-motion: reduce)` → all durations → `0.01ms`; `unfurl` → opacity-only. Ambient loops (hero sheen, confirmation illustration) paused when `document.hidden` OR offscreen OR reduced-motion.

---

## 5. Animation inventory (cross-cutting, defined once)

Animation maps to brief sentences, not garnish.

| Motion | Where | Curve | Dur | Trigger |
|---|---|---|---|---|
| **Reveal** fade + 8px lift | page section on scroll-in | `soft` | 400ms | IntersectionObserver |
| **Unfurl** height auto + opacity | PDP Disclosure, filter panel | `unfurl` | 400ms | click |
| **Light-touch hover** −2px lift + soft shadow | Tile, buttons | `out` | 200ms | hover |
| **Settle** slow fade + 4px lift | confirmation ThankYou | `unfurl` | 500ms | mount |
| **Subtle sheen** 1.4s slow translateX | hero image, confirmation illustration ambient | linear | loop | idle, paused offscreen/hidden/reduced |
| **Rating pulse** 0.96→1 snap | review submit, add-to-cart | `out` | 240ms | success |

**Forbidden:** parallax, count-ups, auto-carousels, scroll-jacking, auto-rotating testimonials. Reveal via native IntersectionObserver (perf-safe).

---

## 6. Shape & Shadow

### Radii (soft, 2–8px → 6–28px)

`sm 6 · base 10 · md 14 · lg 20 · xl 28 · pill 9999`. Soft, not bubbly.

### Shadow (diffuse, touchable — replaces crisp 1–2px)

| Token | Value |
|---|---|
| `sm` | `0 1px 2px rgba(28,25,23,0.04)` (resting hair) |
| `base` | `0 2px 8px rgba(28,25,23,0.04), 0 1px 2px rgba(28,25,23,0.03)` |
| `md` | `0 8px 24px -6px rgba(28,25,23,0.08)` (PDP magnet / cart lift) |
| `lg` | `0 20px 48px -12px rgba(28,25,23,0.12)` (modal / confirmation) |

Soft natural shadows, never hard drop.

---

## 7. Layout — breathe

- **Container** max `84rem` (1344px, from 80rem), pad `2rem` → `1.25rem` <768px.
- **Section vertical rhythm** `6rem` desktop / `4rem` tablet / `2.5rem` mobile (from ~2–3rem — big air).
- **Grid gutter** `1.5rem` desktop → `1rem` mobile. Product/listing generous; **category tiles evenly spaced, equal height**.
- **Measure** (new token): max prose line `65ch` for manifesto / PDP body (unhurried reading).
- **Responsive collapse** defined in `tokens-css.js` (extend `.prod-grid`/`.cat-grid` with `.filter-grid`, `.checkout-grid`, `.account-grid`).

### Breakpoints

| BP | Width | Behavior |
|---|---|---|
| xs | <480 | 1 col; pad 1.25rem; filters top-stack; PDP single-col |
| sm | 480–767 | 2 col; drawer filters; cart 1fr |
| md | 768–1023 | 3 col; filters sidebar \|\| drawer; checkout stacked |
| lg | ≥1024 | 4 col; sidebar 280px; PDP 1fr/1.2fr; cart 1fr/380px |

### Responsive grid layout tokens (in tokens-css.js)

| Class | Desktop | ≤1024 | ≤768 | ≤480 |
|---|---|---|---|---|
| `.prod-grid` | 4 col | 3 | 2 | 1 |
| `.cat-grid` | 4 col | 3 | 2 | 1 |
| `.filter-grid` | `1fr 280px` | `1fr` (top-stack) | `1fr` (drawer) | `1fr` (drawer) |
| `.checkout-grid` | `1fr 380px` | `1fr` | `1fr` | `1fr` |
| `.account-grid` | `1fr 380px` | `1fr` | `1fr` | `1fr` |
| `.pdp-grid` | `1fr 1.2fr` | `1fr` | `1fr` | `1fr` |

CSS-grid + `clamp()` fluid type. **No new CSS framework.**

---

## 8. Primitive set

Option C: keep & extend in place where no conflict; retire where the soft register conflicts; add new for behaviors the brief explicitly demands.

### Keep + re-skin via tokens (9)

`Container`, `Section`, `Grid`, `Overline`, `Headline`, `BodyText`, `Price`, `Divider`, `Button` (Primary/Secondary/Ghost — terracotta + hover lift).

### Retire (1)

| Old | Reason | Replaced by |
|---|---|---|
| `Card` | sharp border/shadow conflicts soft register & one-shape-for-all doesn't fit product vs panel roles | split into `Tile` (product/cat) + `Surface` (elevated panel) |
| `SeverityPill` (in customer-facing design index) | admin-only concern | dropped from design index; supersedes by `Badge` for customer-facing |

### New (9) — each maps to one brief sentence, no speculative inventory

| Primitive | Purpose | Brief driver |
|---|---|---|
| `Disclosure` | expandable with `unfurl` easing | "unfold with gentle organic easing" |
| `Field` / `FieldRow` | generous spacing, gentle validation copy (one family) | "validation phrased gently, not errors" |
| `StepIndicator` | soft checkout progress | "soft progress indicators" |
| `QuietFilter` | shelf-side filters, not a control panel | "filters sit quietly to the side" |
| `QtyStepper` | tactile forgiving quantity | "quantity controls tactile and forgiving" |
| `Tile` | soft, evenly-spaced category/product tile | "soft, evenly-spaced tiles" |
| `Surface` | plain elevated panel (cart/account/summary cards) | "calm, well-lit cards with soft textures" |
| `Badge` | role-mapped accent (sage in-stock / mustard new / terracotta price) | "detail on badges, price tags, availability" |
| `ThanksBlock` | calm confirmation close + illustrative touch | "warm close … soft illustrative touch" |

Total: 9 kept + 9 new (`Field`/`FieldRow` counted as one family) = **18 primitives**. Each tied to a brief sentence; `Surface` is the panel role of the retired `Card`.

---

## 9. Page-by-page composition

### 9.1 Homepage — calm welcome (continuous scroll, one route)

`Hero` → `CategoryGrid` (soft evenly-spaced tiles) → `ProductSection: "Curated"` → `Manifesto` (≤65ch measure) → `ProductSection: "New Arrivals"` → `Copyright`.

- **Hero:** Fraunces headline, one quiet sub, one terracotta CTA. Single soft hero image (no carousel). Ambient **subtle sheen** on image — slow, barely-there, paused offscreen/hidden/reduced.
- **Hero word reveal:** opacity word-by-word on first paint only (200ms each). Reviewed as added/optional at implementation budget — keep simple, skip if it reads performative.
- **CategoryGrid:** equal-height `Tile`s, 4→3→2→1. **Reveal** stagger per row (40ms offset, capped at 3).
- **Tiles:** light-touch hover (−2px, shadow md). Nothing competes with the hero.

### 9.2 Listing / category — patient discovery

`QuietFilter` sidebar left (desktop 280px), collapses to top-stack (≤1024), mobile Drawer (slide-from-end, 300ms `unfurl`). Grid breathes 1.5rem gutters. Sort = quiet inline label + select, not a toolbar.

- Filter chips expand with **Unfurl** on mobile. Active filter = terracotta dot, not filled chip.
- Tiles **Reveal** on scroll-in. Hover = **light-touch lift**. No zoom.
- Sort change = grid cross-fade (200ms opacity) — no layout jolt.

### 9.3 Product detail — confident intimacy

`pdp-grid` image `1fr` / details `1.2fr` (image breathes more). Fraunces title (H2), calm price hierarchy (Price primitive, terracotta-anchored). `Disclosure` stack: **Materials · Care · Shipping & mending covenant** — **Unfurl** 400ms, one open at a time encouraged.

- Image: **light-touch** soft shadow on hover (md → lg). Multiple images = gentle cross-fade thumbnails (200ms), no carousel arrows.
- Add-to-cart = **rating-pulse** on button (0.96→1, 240ms) + a soft toast "looked after" (200ms fade).
- Slowest-motion page; motion says "unhurried."

### 9.4 Cart — reassurance

`cart-layout` items `1fr` / summary `380px` (→1fr ≤1024). Line items: soft dividers (1px stone-200), warm thumbnail, `QtyStepper` (± buttons 44px, **no hold-to-repeat** — forgiving, not fiddly). Subtotal calm clarity — **no countdown, no urgency timers, no upsell modules** (brief explicit).

- Qty change = number **Settle-fades** in place (200ms), cart total **Settle-fades** (300ms). No spinners.
- Empty cart = `ThanksBlock`-style gentle empty state with a "find something to look after" link.

### 9.5 Checkout — patient host

Multi-step: **Shipping → Payment → Review**, `StepIndicator` (soft: current = terracotta dot, done = sage check, not filled bars). `Field`/`FieldRow` generous spacing (1.5rem rows). **Gentle validation**: inline helper on blur ("a postcode usually has 5–6 digits"), not a red error flash. Terracotta on field only when truly invalid on submit.

- Step transition = **Reveal** (400ms) next step; previous **fades** (200ms). No slide jolt.
- Payment = same surface, card fields spaced generously. Stripe Elements themed to Fraunces/Inter + terracotta focus. Existing Stripe Elements + csrf + route-protect wiring **preserved untouched**.

### 9.6 Account / order history — recognized, cared for

`Surface` cards (soft shadow base), well-lit. Profile + past orders in calm cards. Order status = `Badge` (sage "cared for" / mustard "on its way"). Returning-user header "welcome back" Fraunces.

- Cards **Reveal** on scroll. Order expand = **Unfurl**. No animation on personal-data fields (keep still/readable).

### 9.7 Order confirmation — warm close

`ThanksBlock`: Fraunces "thank you — we've got this," order ref, a **soft illustrative touch** — a single SVG line drawing (wooden-spoon / ceramic-bowl motif) draw-on via `stroke-dashoffset`, easing `unfurl` 800ms, once, only when scrolled into view. Order summary settled below, calm.

- Longest animation in the journey (illustration draw + title **Settle** 500ms) — earned as the emotional payoff. Then stillness.

### 9.8 Search — quiet listing variant

Reuses listing grid + `QuietFilter`. Empty/no-results = gentle `ThanksBlock` "nothing here yet — a calmer search?" (gentle-error voice).

### 9.9 Auth (login/register/forgot/reset) — calm

Centered `Surface` card, Fraunces "come in," gentle `Field` validation. **Light-touch** on submit. No animation noise. `passwordBreach` / HIBP wiring **preserved as-is** (security boundary — untouched).

### 9.10 Admin — quiet but functional

Lower-touch: keeps tables, **neutral-led**, terracotta only on primary actions, **no Fraunces in dense tables** (legibility over warmth). Cards → `Surface`. Badges reused (sage/mustard). Motion = hover/focus only; **no Reveal-on-scroll** (admin = scan, not browse).

### 9.11 Header / Footer — frame

- **Header:** sticky, soft shadow **on scroll only** (shadow reveal 200ms), transparent at top.
- **Footer:** calm, "looked after by Hverdag," ragged-right manifesto. Currency selector stays (existing route-lock logic preserved).

---

## 10. Technical integration

### 10.1 Token API changes (`design/tokens.js`)

Single source of truth. The flat→CSS-var flattener already emits `--t-*`; every `var(--t-…)` consumer updates via cascade.

```
primary.600 = #92593F         (was #EA580C)
primary.500 = #A86A4D
primary.700 = #744632
primary.* = full 50–900 scale
accent.sage.50–600            (NEW, base #8A9A7B)
accent.mustard.400 = #C9A227, 700 = #7A6215  (NEW)
fontFamily.display = '"Fraunces", Georgia, serif'   (NEW)
fontFamily.sans   = unchanged (Inter)
fontSize.* HD scale bumps (Section 3)
lineHeight.looser = 1.45      (NEW, serif headlines)
motion.duration.slow = 400ms
motion.easing.unfurl = cubic-bezier(0.22,1,0.36,1)   (NEW)
motion.easing.soft  = cubic-bezier(0.16,1,0.3,1)     (NEW)
border.radius: sm 6 · base 10 · md 14 · lg 20 · xl 28  (soft)
shadow: sm/base/md/lg diffuse rewrites
measure.base = 65ch          (NEW)
```

### 10.2 Theme (`design/theme.js`)

`primary.main` → terracotta 600; add `theme.palette.accent` (sage/mustard); `typography.h1–h3.fontFamily = display`; `Rating.icon` mustard → terracotta; `shape.borderRadius = 10`; `InputBase` focus border → terracotta; **component `styleOverrides` cascade** so unstyled-MUI components (admin tables, Selects) soften automatically.

### 10.3 Fonts (`public/index.html`, `index.css`)

Replace single-Inter `<link>` with **Fraunces** (`wght 400,500; opsz 9..144`) + **Inter** (`wght 400,500,600,700`). Both preconnect (already present). `index.css` `body` stays Inter; add `h1,h2,h3,h4.hero { font-family: Fraunces }`. `::selection` bg terracotta-15%; `:focus-visible` outline terracotta. **No new font libs.** One `<link>` swap.

### 10.4 Primitive migration (Option C — retire where conflict)

| Old | Action | New |
|---|---|---|
| `Card` | retire (sharp shadow/border conflict) | `Tile` (product/cat) + `Surface` (panel) |
| `Price`, `Overline`, `Headline`, `BodyText`, `Divider`, `Container`, `Section`, `Grid`, `Button` | keep, re-skin via tokens | — |
| `SeverityPill` | drop from design index (admin-only) | `Badge` supersedes customer-facing |
| — | new | `Disclosure`, `Field`, `FieldRow`, `StepIndicator`, `QuietFilter`, `QtyStepper`, `Tile`, `Surface`, `Badge`, `ThanksBlock` |

Each page's `Card` import migrated to `Tile` or `Surface` by role (product/cat = Tile; cart/account/summary = Surface).

---

## 11. Console / network / zero-error hygiene (hard gates)

Explicit per your ask. Gates, not aspirations.

1. **Baseline now:** `npm test` (21 Jest suites / 189 tests) captured green as baseline. `npm start` frontend, sweep console (dev warnings) + network (4xx/5xx) so redesign starts from clean.
2. **Per-phase gates:** `npm test` green → `npm run build` green → `npm start` + chrome-devtools `list_console_messages` + `list_network_requests` clean → commit. **No phase passes with a console warning or a 4xx.**
3. **TDD where it earns a check:** per primitive/data-flow where there is a branch/loop/async/data path (Disclosure state, QtyStepper boundary, filter, sort cross-fade). Trivial one-liners need no test (YAGNI applies to tests too).
4. **`performance_start_trace` once** on a representative heavy page (listing) to confirm Reveal/IntersectionObserver adds no long task >50ms; INP budget <200ms.
5. **Final sweep:** every route × 2 sizes (desktop/mobile via `resize_page`), `list_console_messages` + `list_network_requests`, **error count === 0** or phase fails. Lighthouse audit on homepage + PDP.

**Security boundaries untouched:** JWT cookie, CSRF, Stripe webhook HMAC, HIBP password-breach, currency route-lock. No backend API changes.

---

## 12. Build order (phased, each self-sufficient, test-before-commit)

| Phase | Deliverable | Gate |
|---|---|---|
| 0 | Tokens + fonts (cascade reskins whole site) | build + test green, console/network clean |
| 1 | Primitive set (8 new, Card → Tile/Surface split) | primitives render; test green |
| 2 | Header / Footer frame | console/network clean |
| 3 | Homepage (hero, category, sections, manifesto) | console/network clean |
| 4 | Listing + Search (filters, sort, grid) | console/network clean |
| 5 | PDP (disclosure, magnet, add-to-cart pulse) | console/network clean |
| 6 | Cart (qty, dividers, summary) | console/network clean |
| 7 | Checkout (steps, gentle validation, payment) | console/network clean; Stripe wiring preserved |
| 8 | Account + order history | console/network clean |
| 9 | Confirmation (ThanksBlock + illustration) | console/network clean |
| 10 | Admin (low-touch surface) | console/network clean |
| 11 | Final sweep + perf trace + Lighthouse + commit prep | error count === 0; LCP/INP in budget |

Each phase: implement → `npm test` → `npm run build` → `npm start` + console/network sweep → commit. User verifies manually at the end.

---

## 13. Out of scope / deliberately skipped

- No backend API changes.
- No new CSS framework or component library (MUI + tokens + primitives only).
- No new font libs (Fraunces + Inter via Google Fonts).
- Cookie rename `token → Ordinary` (previously floated) — skipped, invalidates all sessions.
- E2E Playwright: existing suite must stay green; new E2E not authored unless a phase demands it.
- Auto-carousels, parallax, count-ups, scroll-jacking — forbidden by motion principles, not added.

---

## 14. Spec self-review (inline)

- **Placeholders/TBD:** none. All palette hex, tokens, durations, breakpoints specified.
- **Internal consistency:** palette (§2) → tokens (§10.1) → theme (§10.2) line up. Primitive count (§8) = 9 kept + 9 new (Field/FieldRow as one family) = 18, matches §10.4 table (Field/FieldRow counted as family = 9 new families). Animation inventory (§5) maps to page composition (§9).
- **Scope:** one implementation plan (frontend reskin + rebuild, 12 phases). Backend untouched. Single spec-appropriate.
- **Ambiguity:** resolved — scroll model = "calm continuous per-page" (not literal infinite), terracotta role pinned, mustard adjacency rule stated, admin = no Fraunces/no Reveal-on-scroll.
