# Hverdag Redesign — Phase Readiness Log

Baseline: 202 tests green (21 backend suites/189 + 3 frontend suites/13).
Phases: 0=ready 1=ready 2=ready 3=ready 4=ready 5=ready 6=ready 7=ready 8=ready 9=ready 10=pending 11=pending
Pre-existing noise: react-router v6 deprecation warnings (not Hverdag), useMemo deps in currencyContext.js (pre-existing), 401 /me + 404 csrf-token expected for anon user in dev.

## Phase 0–11: complete except admin touch-up + final sweep

### Pages verified (chrome-devtools + playwright walkthrough, all sizes)

| Page                                | Status         | Notes                                                                                                                                                                                                                               |
| ----------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` (Home)                          | ✅ ready       | v7: centered text hero + stats + 4 value props TrustBar + CategoryGrid auto-fit + ProductSection w/ "New" badges + 2× EditorialSplit + Manifesto + 3 Testimonials + multi-col Footer w/ payment badges                              |
| `/products`                         | ✅ ready       | Breadcrumb (Home › Shop) + QuietFilter + 4-col grid w/ hover image swap + "New" badge on first 3 + Out of Stock pill                                                                                                                |
| `/product/:id`                      | ✅ ready       | Breadcrumb (Home › Shop › category › name) + image gallery + Fraunces title + Status sage pill + Add to Cart terracotta + Disclosure stack + "You might also keep" related products + Reviews (small avatar + sage shield) + Footer |
| `/cart` (empty)                     | ✅ ready       | Fraunces "Your bag is empty" + italic "Find something to look after."                                                                                                                                                               |
| `/cart` (with items)                | ⚠️ partial     | needs login to verify in-flow                                                                                                                                                                                                       |
| `/shipping`                         | ⚠️ partial     | StepIndicator in place; needs login + Stripe                                                                                                                                                                                        |
| `/signin`, `/signup`                | ✅ ready       | Fraunces + italic Fraunces subtitle; gentle validation                                                                                                                                                                              |
| `/search`                           | ✅ ready       | "Look through the shelves" Fraunces                                                                                                                                                                                                 |
| `/account`, `/myorders`, `/admin/*` | ⚠️ needs login | cascade reskin auto-applies; explicit admin pass pending                                                                                                                                                                            |

### Adidas-inspired patterns applied (keeping Hverdag theme)

1. **Breadcrumb primitive** — quiet, narrow, above headings, current page in terracotta
2. **Product card hover image swap** — second image reveals on hover (300ms soft fade)
3. **"New" badge** — first 3 products in any list (mustard variant) top-left overlay
4. **Multi-column footer** — 4 columns (Hverdag manifesto + Shop + Care + Account) + © + Privacy/Terms/Cookies/Accessibility + payment badges (VISA/MC/AMEX/PayPal/Stripe)
5. **PDP "You might also keep"** — related products from same category below Disclosure stack
6. **Review cards** — small avatar (44px) + sage star-shield badge + date right-aligned

### Bugs fixed during this pass

1. ✅ ProductGrid missing `i` param in map → added index for `isNew={i < 3}` flag
2. ✅ Reviewcard.js — Tailwind classes weren't loaded; SVG overlay rendered huge. Rewrote with inline styles + 44px avatar
3. ✅ Header nested hamburger inside hidden nav (mobile). Already fixed in prior pass.
4. ✅ "Product ID : ..." debug literal. Already removed.
5. ✅ "GENERAL" category fallback. Already fixed.

### Verification artifacts

- `home-v3-full.png`, `home-v3-mobile.png` (v3 — before 4-tile removal)
- `home-v4.png` (NewsletterSignup + Copyright removed)
- `v5-home.png` (text-led centered hero, no image)
- `v5-products.png`, `v5-pdp.png` (pre-Adidas-pattern pass)
- `v6-pdp.png` (breadcrumb + related + multi-col footer)
- `v7-pdp-final.png` (everything together)
- `v7-listing-new2.png` (with New badges + breadcrumb)
- `v7-cart.png` (empty cart + new footer)
- `v7-home-mobile.png` (390px viewport)

### Console / network (dev mode)

- 0 uncaught exceptions
- 0 client-side React errors
- Persistent expected errors (NOT Hverdag regressions):
  - `GET /api/v1/csrf-token 404` — CSRF middleware disabled in dev per CLAUDE.md
  - `GET /api/v1/me 401` — anonymous user, expected
- Backend MongoDB connection was transiently flaky (`bufferCommands = false` race on first request); backend restart fixed.

### Security boundaries preserved

- JWT httpOnly cookie, CSRF middleware, Stripe webhook HMAC, HIBP password-breach, currency route-lock, Stripe Elements wiring — untouched
- No backend API changes

### Build / tests

- Build: clean
- Tests: 202/202 (189 backend + 13 frontend)

## Phase 10: pending — admin explicit pass

- Admin pages still use Card + SeverityPill (now softened via cascade)
- No Fraunces in dense tables (admin = scan, not browse)
- No Reveal-on-scroll on admin
- Per-spec lower-touch

## Phase 11: pending — final sweep + Lighthouse + commit prep

- Chrome-devtools console/network sweep across routes × 2 sizes
- Lighthouse on homepage + PDP
- performance_start_trace on listing (Reveal/IO no long tasks >50ms)
- Manual visual review + commit when user verifies end-to-end

**No commits** — staged per plan, user commits when satisfied.
