# Conversion Uplift — Phase A Design

**Date**: 2026-07-13
**Status**: Approved (brainstorming complete)
**Parent idea**: Audit MERN storefront against 10 conversion tips from Medium article "10 E-commerce UI/UX Design Tips That Boost Conversion Rates in 2026" (Dolly Borade Solanki).

## Context

Article lists 10 tips. User flagged #8 (AI recommendations) and #10 (A/B infrastructure) as future work. The remaining 8 tips were decomposed into 4 sub-projects:

- **A. CRO-Perf + A11y** ← this spec
- B. Guest Checkout (architecture approved separately, spec exists 2026-07-13)
- C. Hierarchy + Trust Polish
- D. Test Infrastructure (axe, Lighthouse)

This spec covers **Phase A only**. Phases B/C/D follow in their own spec → plan cycles.

## Goals

Phase A targets conversion uplift via three measurable vectors:

1. **Speed** (tip #3) — 1-second delay costs ~7% conversion. Reduce LCP via image perf.
2. **Social proof visibility** (tip #4) — surface structured review data for SERP rich snippets via JSON-LD.
3. **Accessibility** (tip #9) — WCAG 2.1 AA: skip-link, contrast, touch targets, alt text.

Out of scope: A/B infra (tip #10), AI recs (tip #8), checkout simplification (tip #6 → sub-project B), micro-interactions new (tip #5 → already strong in Hverdag redesign).

## Phasing

Three atomic PRs, baseline-first:

- **PR1 — Baseline measurement**: add `npm run perf` Lighthouse local runner, capture before-state.
- **PR2 — Image perf + JSON-LD**: Cloudinary transforms, srcset, structured data.
- **PR3 — A11y fixes**: skip-link, contrast tokens, 44px touch targets, hero alt text.

Each PR independently revertable. No DB migrations, no env changes, no API breakage.

---

## PR1 — Baseline Measurement

**Why first**: measure before changing. Re-running `npm run perf` after PR2/PR3 quantifies wins.

**Changes**:
- `package.json`: add devDeps `lighthouse@^12`, `chrome-launcher@^1`. Add script `"perf": "node scripts/lhci/local-lighthouse.mjs"`.
- `scripts/lhci/local-lighthouse.mjs` (new, ~80 lines): launches Chrome via `chrome-launcher`, runs `lighthouse` programmatically on:
  - URLs: `/` and `/product/<id>` (uses seeded product slug).
  - Viewports: mobile (default Lighthouse) + desktop.
  - Categories: a11y, perf, best-practices, SEO.
- Output: `console.table()` summary. Write `docs/perf/baseline-YYYY-MM-DD.json` with `{ date, scores: { url: { mobile: {...}, desktop: {...} } } }`.
- Exit code: always 0 (smoke, not gate).
- `.gitignore`: baseline JSON committed for diff tracking.

**Files**: 1 new script, 1 package.json edit, 1 baseline JSON.

---

## PR2 — Image Perf + JSON-LD

### Image performance

**New utility**: `frontend/src/utils/cloudinary.js`

```js
export function cld(url, { w, h } = {}) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  const transforms = ['f_auto', 'q_auto'];
  if (w) transforms.push(`w_${w}`);
  if (h) transforms.push(`h_${h}`);
  const sep = url.includes('?') ? '&' : '?';
  return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
}

export function srcset(url, widths = [320, 480, 768, 1200]) {
  return widths.map(w => `${cld(url, { w })} ${w}w`).join(', ');
}
```

- Pure functions. Pass-through for non-Cloudinary URLs (handles dev seed images from Unsplash).
- `f_auto` → serves WebP/AVIF to capable browsers. `q_auto` → Cloudinary's perceptual quality.
- `srcset` builds width descriptor strings.

**Consumer changes**:

| File | Change |
|---|---|
| `frontend/src/components/Product/ProductCard.jsx` | `<img src={url}>` → `<img src={cld(url, { w: 480 })} srcSet={srcset(url)} sizes="(max-width:600px) 50vw, 25vw" loading="lazy" decoding="async" />` |
| `frontend/src/components/Product/PDP/MainImage.js` | Same swap, `loading="eager"` + `fetchpriority="high"` (LCP image). |
| `frontend/src/components/Product/QuickView/QuickViewDialog.jsx` | Same swap as card. |

### JSON-LD structured data

**New component**: `frontend/src/components/JsonLd.jsx`

```jsx
export default function JsonLd({ data }) {
  try {
    return (
      <script
        type="application/ld+json"
        // dangerouslySetInnerHTML is safe here: data is JSON.stringify of an object
        // we just built from typed props. No user-supplied raw HTML reaches this path.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
    );
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('JsonLd: stringify failed', err);
    return null;
  }
}
```

**New helpers** (in `frontend/src/utils/jsonLd.js`):

```js
export function productJsonLd(product) {
  if (!product) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: Array.isArray(product.images) ? product.images : [product.images].filter(Boolean),
    description: product.description,
    sku: product._id,
    aggregateRating: product.avgRating
      ? { '@type': 'AggregateRating', ratingValue: product.avgRating, reviewCount: product.numOfReviews ?? 0 }
      : undefined,
    review: (product.reviews || []).slice(0, 3).map(r => ({
      '@type': 'Review',
      author: r.name,
      datePublished: r.createdAt,
      reviewBody: r.comment,
      reviewRating: { '@type': 'Rating', ratingValue: r.rating },
    })),
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Hverdag',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    logo: siteConfig.logoUrl, // single source of truth in frontend/src/config/site.js (or existing theme/config module)
  };
}
```

**Consumer changes**:

| File | Change |
|---|---|
| `frontend/src/components/Product/PDP/ProductDetailsV2.js` | Render `<JsonLd data={productJsonLd(product)} />` near top. |
| `frontend/src/components/Home/Home.js` | Render `<JsonLd data={organizationJsonLd()} />`. |

**Data source**: Product object already carries `avgRating`, `numOfReviews`, `reviews[]` from existing `getProduct` API response. No backend change.

### Tests

- `frontend/src/__tests__/cloudinary.test.js` (new, 6 tests):
  1. `cld` adds `f_auto,q_auto,w_480` to a Cloudinary URL.
  2. `cld` passes through non-Cloudinary URL unchanged.
  3. `cld` preserves existing query string (uses `&` separator).
  4. `srcset` returns 4 width descriptors joined by `, `.
  5. `srcset` uses default widths [320, 480, 768, 1200].
  6. `srcset` accepts custom widths array.
- `frontend/src/__tests__/jsonLd.test.js` (new, 4 tests):
  1. `productJsonLd` returns null for null product.
  2. `productJsonLd` builds valid Product schema with aggregateRating.
  3. `productJsonLd` limits reviews to 3.
  4. `organizationJsonLd` returns Organization schema.
- `e2e/pageSmoke.spec.js`: extend w/ 3 assertions on PDP:
  - `await page.locator('script[type="application/ld+json"]').first().textContent()` matches `/\"@type\":\"Product\"/`.
  - PDP contains an `aggregateRating` in injected JSON.
  - Home page contains an `Organization` schema.

---

## PR3 — A11y Fixes

### Skip-link

**New component**: `frontend/src/components/SkipLink.jsx`

```jsx
export default function SkipLink({ targetId = 'main' }) {
  return (
    <a href={`#${targetId}`} className="skip-link">
      Skip to main content
    </a>
  );
}
```

**CSS** (in `frontend/src/index.css`):

```css
.skip-link {
  position: absolute;
  left: 0;
  top: 0;
  padding: 12px 16px;
  background: var(--t-neutral-900);
  color: var(--t-neutral-50);
  font-weight: 600;
  text-decoration: none;
  transform: translateY(-200%);
  z-index: 9999;
  transition: transform 120ms ease;
}
.skip-link:focus,
.skip-link:focus-visible {
  transform: translateY(0);
  outline: 2px solid var(--t-primary);
  outline-offset: 2px;
}
```

**Wire-up**:
- `frontend/src/components/Home/Header/index.js`: render `<SkipLink />` as first child.
- `frontend/src/App.js`: wrap route outlet in `<Box component="main" id="main" tabIndex={-1}>` so skip-link target is focusable but not in tab order.

### 44px touch targets

**File**: `frontend/src/components/Product/ProductCard.jsx`
- Wishlist heart `IconButton` size `small` → `medium` (36px → 44px).
- Quick-add cart button: confirm `minWidth: 44, minHeight: 44` (audit).

### Hero image alt text

**File**: `frontend/src/components/Product/PDP/MainImage.js`
- Change `alt=""` (decorative) → `alt={product?.name || 'Product image'}`.
- Hero image is informative, not decorative.

### Contrast tokens

**File**: `frontend/src/design/tokens-css.js`
- Add `--t-neutral-700: #3D3D3D` (AA-compliant ≥4.5:1 against `#FAFAF9` background for body text).
- Migrate known offenders:
  - `frontend/src/components/Product/ProductCard.jsx` review-count span → `color: var(--t-neutral-700)`.
  - `frontend/src/components/Home/Header/DesktopNav.jsx` breadcrumb captions → `var(--t-neutral-700)`.
  - `frontend/src/components/Footer.js` small link text → `var(--t-neutral-700)`.
- Keep `--t-neutral-500` for non-text (icons, borders, dividers).

### Tests

- `e2e/pageSmoke.spec.js`: assert `await page.keyboard.press('Tab')` → SkipLink visible in viewport, `getByRole('link', { name: /skip to main/i })` has focus.

---

## Error Handling Summary

| Failure | Behavior |
|---|---|
| Non-Cloudinary URL passed to `cld` | Pass-through unchanged. |
| `JSON.stringify` throws on JsonLd data | Render nothing. `console.warn` in dev only. |
| Skip-link target `#main` missing | Browser shows "anchor not found" in dev; no crash. |
| Cloudinary CDN cache cold | Old image format for ~1hr post-deploy until CDN propagates. |

## Testing Summary

| Suite | Existing | New | Status |
|---|---|---|---|
| Backend Jest | 210 | 0 | Must stay green (no BE change) |
| Frontend Jest | 43 | 10 (6 cloudinary + 4 jsonLd) | Must pass |
| Playwright E2E | 80 | 4 (3 JSON-LD + 1 skip-link) | Must pass |

## Success Criteria

Measured by `npm run perf` after PR3:

- Lighthouse **a11y ≥95** on `/` and `/product/:id` (mobile + desktop).
- Lighthouse **perf ≥90** on `/product/:id` (mobile). Current baseline TBD by PR1.
- Lighthouse **best-practices ≥95** on `/product/:id`.
- Zero critical axe violations on `/`, `/products`, `/product/:id`, `/cart`, `/checkout`.

Compared to PR1 baseline via 3-run mean (LH ±3 variance).

## Risks

1. **Cloudinary CDN cache ~1hr cold-start after PR2 deploy**. First run may show unchanged URLs. Mitigate: warm via preview deploy before prod.
2. **LH score variance ±3**. Compare 3-run mean, not single run.
3. **Skip-link fail-soft on any page missing `<main id="main">`**. Caught by PR3 page-by-page review; smoke E2E covers PLP/PDP/Checkout.
4. **JSON-LD `dangerouslySetInnerHTML`**. Safe because input is typed JSON we just serialized, never raw HTML. Unit-tested via jsonLd tests.

## Rollout

- PR1: merge → run `npm run perf` → commit baseline JSON.
- PR2: merge → wait 1hr CDN warm → re-run `npm run perf` → commit post-perf JSON.
- PR3: merge → re-run `npm run perf` → commit post-a11y JSON.

Each PR atomic + revertable. No DB migrations, no env changes, no breaking API.

## Deferred (separate specs)

- **Phase B — Guest Checkout**: spec exists 2026-07-13.
- **Phase C — Hierarchy + Trust Polish**: not started.
- **Phase D — Test Infrastructure** (jest-axe, Playwright @axe): not started.
- **Tips #8 (AI recs), #10 (A/B infra)**: user-flagged gaps, future.

## Documentation

- Append "Conversion uplift — Phase A" section to `docs/reports/CODEBASE_ANALYSIS_REPORT.md`.
- Commit baseline/post-baseline JSON files under `docs/perf/`.
- README: untouched.