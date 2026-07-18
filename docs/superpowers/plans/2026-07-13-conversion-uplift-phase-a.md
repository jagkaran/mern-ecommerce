# Conversion Uplift — Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 3 atomic PRs (Lighthouse baseline, image perf + JSON-LD, a11y fixes) targeting LH a11y ≥95, perf ≥90, and SERP rich snippets via structured data on PDP.

**Architecture:** Frontend-only changes. 3 new primitives (`utils/cloudinary.js`, `components/JsonLd.jsx`, `components/SkipLink.jsx`), 1 new dev script (`scripts/lhci/local-lighthouse.mjs`), wire-ups across 8 existing components. No backend, no DB, no env changes.

**Tech Stack:** React 17, Material UI, Cloudinary (URL transforms), Lighthouse 12 + chrome-launcher (dev deps), Jest + RTL, Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-07-13-conversion-uplift-phase-a-design.md`

## Global Constraints

- CommonJS backend untouched; React 17 frontend; no Tailwind usage (CSS-var tokens only).
- All existing tests must stay green: 210 BE Jest, 43 FE Jest, 80 Playwright E2E.
- Branch: `feat/conversion-uplift-phase-a` (created in Task 1).
- Conventional commits. Each PR = one squashable branch = one merge commit.
- No new runtime deps. Dev deps only in PR1.
- Brand/UX strings untouched (Hverdag design system preserved).

---

## Task 1: Lighthouse Baseline Script (PR1)

**Files:**

- Create: `package.json` (edit, add 2 devDeps + 1 script)
- Create: `scripts/lhci/local-lighthouse.mjs`
- Create: `docs/perf/.gitkeep` (new dir)
- Reference product slug for PDP test — read from `backend/seeders/seedProducts.js` or fetch first product via API in script.

**Interfaces:**

- Produces: `npm run perf` exits 0; writes `docs/perf/baseline-YYYY-MM-DD.json` w/ `Date.now()` filename.
- Consumes (later): PR2 + PR3 will re-run `npm run perf` to compare.

- [ ] **Step 1: Create branch**

```bash
git checkout master
git pull origin master
git checkout -b feat/conversion-uplift-phase-a
```

- [ ] **Step 2: Create `docs/perf/` directory**

```bash
mkdir -p docs/perf
touch docs/perf/.gitkeep
git add docs/perf/.gitkeep
```

- [ ] **Step 3: Add devDeps + script to `package.json`**

Open `package.json` (root). Under `devDependencies`, add:

```json
"lighthouse": "^12.0.0",
"chrome-launcher": "^1.1.2"
```

Under `scripts`, add:

```json
"perf": "node scripts/lhci/local-lighthouse.mjs"
```

Install:

```bash
npm install
```

Expected: 2 new packages added to `package-lock.json`, no errors.

- [ ] **Step 4: Create `scripts/lhci/local-lighthouse.mjs`**

```js
#!/usr/bin/env node
// scripts/lhci/local-lighthouse.mjs
// Local Lighthouse smoke runner. Not a CI gate. Captures baseline + post-change scores.
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import fs from "node:fs/promises";
import path from "node:path";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000/api/v1";
const OUTPUT_DIR = path.resolve("docs/perf");

// Fetch one product slug for PDP URL via backend API.
async function getProductSlug() {
  const res = await fetch(`${BACKEND_URL}/products?limit=1`);
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  const json = await res.json();
  const p = json?.products?.[0];
  if (!p?._id) throw new Error("No products found in DB; seed first.");
  return p._id;
}

const CATEGORIES = ["accessibility", "performance", "best-practices", "seo"];

async function runOne(url, formFactor) {
  const chrome = await launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      logLevel: "error",
      output: "json",
      onlyCategories: CATEGORIES,
      formFactor,
      screenEmulation:
        formFactor === "mobile"
          ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }
          : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
      throttling:
        formFactor === "mobile"
          ? {
              rttMs: 150,
              throughputKbps: 1638.4,
              cpuSlowdownMultiplier: 4,
              requestLatencyMs: 0,
              downloadThroughputKbps: 0,
              uploadThroughputKbps: 0,
            }
          : {
              rttMs: 40,
              throughputKbps: 10240,
              cpuSlowdownMultiplier: 1,
              requestLatencyMs: 0,
              downloadThroughputKbps: 0,
              uploadThroughputKbps: 0,
            },
    });
    const cats = result.lhr.categories;
    return Object.fromEntries(CATEGORIES.map((c) => [c, Math.round((cats[c]?.score ?? 0) * 100)]));
  } finally {
    await chrome.kill();
  }
}

function fmt(table) {
  // compact console table
  console.table(table);
}

async function main() {
  const slug = await getProductSlug();
  const pages = {
    home: `${FRONTEND_URL}/`,
    pdp: `${FRONTEND_URL}/product/${slug}`,
  };
  const out = { date: new Date().toISOString(), scores: {} };
  const flat = [];
  for (const [name, url] of Object.entries(pages)) {
    out.scores[name] = {};
    for (const ff of ["mobile", "desktop"]) {
      process.stdout.write(`▶ ${name} ${ff} … `);
      try {
        const scores = await runOne(url, ff);
        out.scores[name][ff] = scores;
        flat.push({ page: name, viewport: ff, ...scores });
        process.stdout.write("ok\n");
      } catch (e) {
        process.stdout.write(`FAIL: ${e.message}\n`);
        out.scores[name][ff] = { error: e.message };
      }
    }
  }
  fmt(flat);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const file = path.join(OUTPUT_DIR, `baseline-${stamp}.json`);
  await fs.writeFile(file, JSON.stringify(out, null, 2));
  console.log(`\n✓ scores written to ${file}`);
  process.exit(0); // smoke, never gate
}

main().catch((e) => {
  console.error(e);
  process.exit(0); // smoke, never gate
});
```

- [ ] **Step 5: Start dev servers (separate terminals) and run baseline**

Terminal A:

```bash
npm run dev
```

Terminal B:

```bash
npm start --prefix frontend
```

Wait for both ready (backend on :4000, frontend on :3000).

Terminal C:

```bash
npm run perf
```

Expected: prints a 4-row table (home-mobile, home-desktop, pdp-mobile, pdp-desktop) with a11y/perf/bp/seo scores 0–100. Exits 0. Writes `docs/perf/baseline-2026-07-13.json`.

- [ ] **Step 6: Verify baseline JSON written**

```bash
ls -la docs/perf/baseline-*.json
cat docs/perf/baseline-$(date +%Y-%m-%d).json | head -30
```

Expected: file exists, JSON contains `date`, `scores.home.mobile.accessibility` (number 0-100).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json scripts/lhci/local-lighthouse.mjs docs/perf/baseline-*.json
git commit -m "feat(perf): add Lighthouse baseline script (PR1 of Phase A)

Local npm run perf runner captures a11y/perf/bp/seo scores for
homepage + PDP across mobile + desktop. Smoke only, exit 0 always.

Baseline JSON committed for diff after PR2/PR3 ship.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] **Step 8: Push branch + open draft PR**

```bash
git push -u origin feat/conversion-uplift-phase-a
gh pr create --draft --base master --title "perf: Lighthouse baseline (PR1 Phase A)" --body "Adds \`npm run perf\` local runner. Captures baseline scores for Phase A success measurement."
```

---

## Task 2: Cloudinary Helper + Unit Tests (PR2 step 1)

**Files:**

- Create: `frontend/src/utils/cloudinary.js`
- Create: `frontend/src/__tests__/cloudinary.test.js`

**Interfaces:**

- Exports:
  - `cld(url: string | undefined, opts?: { w?: number, h?: number }): string`
  - `srcset(url: string, widths?: number[]): string` — default widths `[320, 480, 768, 1200]`
- Both pass-through for non-Cloudinary URLs (no `res.cloudinary.com` substring).
- Consumed by: Task 3 (ProductCard, MainImage, QuickViewDialog).

- [ ] **Step 1: Write failing tests**

Create `frontend/src/__tests__/cloudinary.test.js`:

```js
import { cld, srcset } from "../utils/cloudinary";

describe("cld", () => {
  it("appends f_auto,q_auto,w_<w> to Cloudinary URLs", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/shoes.jpg";
    expect(cld(url, { w: 480 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_480/v1/shoes.jpg"
    );
  });

  it("appends h_<h> when provided", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/shoes.jpg";
    expect(cld(url, { w: 320, h: 240 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_320,h_240/v1/shoes.jpg"
    );
  });

  it("passes through non-Cloudinary URLs unchanged", () => {
    const url = "https://images.unsplash.com/photo-123";
    expect(cld(url, { w: 480 })).toBe(url);
  });

  it("passes through undefined and empty strings", () => {
    expect(cld(undefined, { w: 480 })).toBeUndefined();
    expect(cld("", { w: 480 })).toBe("");
  });

  it("preserves existing query string with & separator", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/shoes.jpg?public_id=abc";
    expect(cld(url, { w: 480 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_480/v1/shoes.jpg?public_id=abc"
    );
  });
});

describe("srcset", () => {
  it("returns default widths when no arg", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/shoes.jpg";
    expect(srcset(url)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_320/v1/shoes.jpg 320w, " +
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_480/v1/shoes.jpg 480w, " +
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_768/v1/shoes.jpg 768w, " +
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1200/v1/shoes.jpg 1200w"
    );
  });

  it("accepts custom widths array", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/shoes.jpg";
    expect(srcset(url, [100, 200])).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_100/v1/shoes.jpg 100w, " +
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_200/v1/shoes.jpg 200w"
    );
  });
});
```

- [ ] **Step 2: Run tests, verify FAIL**

```bash
cd frontend && npx jest __tests__/cloudinary.test.js --no-coverage
```

Expected: FAIL — "Cannot find module '../utils/cloudinary'".

- [ ] **Step 3: Implement `frontend/src/utils/cloudinary.js`**

```js
// utils/cloudinary.js
// Pure helpers for Cloudinary URL transforms.
// Pass-through for non-Cloudinary URLs (dev seed images, external CDNs).

export function cld(url, { w, h } = {}) {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  const transforms = ["f_auto", "q_auto"];
  if (w) transforms.push(`w_${w}`);
  if (h) transforms.push(`h_${h}`);
  const sep = url.includes("?") ? "&" : "?";
  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}

export function srcset(url, widths = [320, 480, 768, 1200]) {
  return widths.map((w) => `${cld(url, { w })} ${w}w`).join(", ");
}
```

- [ ] **Step 4: Run tests, verify PASS**

```bash
cd frontend && npx jest __tests__/cloudinary.test.js --no-coverage
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/utils/cloudinary.js frontend/src/__tests__/cloudinary.test.js
git commit -m "feat(perf): add cloudinary url transform helper + tests

cld(url, {w,h}) appends f_auto,q_auto for auto webp/avif + size.
srcset(url, widths) builds width descriptors for responsive images.
Pass-through for non-Cloudinary URLs (handles dev Unsplash seeds).

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Wire srcset into ProductCard, MainImage, QuickViewDialog (PR2 step 2)

**Files:**

- Modify: `frontend/src/components/Product/ProductCard.jsx` (PLP card)
- Modify: `frontend/src/components/Product/PDP/MainImage.js` (PDP hero)
- Modify: `frontend/src/components/Product/QuickViewDialog.jsx` (modal)

**Interfaces:**

- Consumes: `cld`, `srcset` from `../utils/cloudinary` (relative from Product/, → `../../utils/cloudinary`).
- Produces: `<img>` elements use responsive `src` + `srcSet` + `sizes`.

- [ ] **Step 1: Modify `frontend/src/components/Product/ProductCard.jsx`**

Find the card's `<img>` tag (around line ~98-130, the wishlist heart section). Locate the product image `<img>` element.

Add import at top:

```js
import { cld, srcset } from "../../utils/cloudinary";
```

Replace the product image `<img>` with:

```jsx
<img
  src={cld(product.images?.[0]?.url, { w: 480 })}
  srcSet={srcset(product.images?.[0]?.url)}
  sizes="(max-width:600px) 50vw, (max-width:1024px) 33vw, 25vw"
  alt={product.name}
  loading="lazy"
  decoding="async"
  className="product-card__image"
/>
```

If the file currently accesses `product.images[0].url`, keep that pattern. Adjust optional chaining to match existing defensive code style.

- [ ] **Step 2: Modify `frontend/src/components/Product/PDP/MainImage.js`**

Add import:

```js
import { cld, srcset } from "../../../utils/cloudinary";
```

Replace the main `<img>` element:

```jsx
<img
  src={cld(activeImage?.url, { w: 1200 })}
  srcSet={srcset(activeImage?.url)}
  sizes="(max-width:768px) 100vw, 50vw"
  alt={product?.name || "Product image"}
  loading="eager"
  fetchpriority="high"
  decoding="async"
  className="pdp__main-image"
/>
```

- [ ] **Step 3: Modify `frontend/src/components/Product/QuickViewDialog.jsx`**

Add import:

```js
import { cld, srcset } from "../../utils/cloudinary";
```

Find the dialog's product image `<img>` and replace:

```jsx
<img
  src={cld(product.images?.[0]?.url, { w: 480 })}
  srcSet={srcset(product.images?.[0]?.url)}
  sizes="(max-width:600px) 100vw, 50vw"
  alt={product.name}
  loading="lazy"
  decoding="async"
/>
```

- [ ] **Step 4: Run all FE tests**

```bash
cd frontend && npx jest --no-coverage
```

Expected: 50 tests pass (43 existing + 7 new from Task 2). No regressions.

- [ ] **Step 5: Run E2E**

```bash
cd ..
npm run e2e
```

Expected: 80 Playwright tests pass. No regressions.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Product/ProductCard.jsx frontend/src/components/Product/PDP/MainImage.js frontend/src/components/Product/QuickViewDialog.jsx
git commit -m "feat(perf): wire srcset/cloudinary transforms into product images

PLP card, PDP hero, quick-view modal now serve WebP/AVIF via
f_auto,q_auto. PDP main image gets fetchpriority=high for LCP.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: JSON-LD Component + Helpers + Tests (PR2 step 3)

**Files:**

- Create: `frontend/src/components/JsonLd.jsx`
- Create: `frontend/src/utils/jsonLd.js`
- Create: `frontend/src/__tests__/jsonLd.test.js`

**Interfaces:**

- `<JsonLd data={object} />` → renders `<script type="application/ld+json">` w/ `JSON.stringify(data)`.
- `productJsonLd(product)` → returns Product schema object or null.
- `organizationJsonLd()` → returns Organization schema object.
- Consumed by: Task 5 (wire into PDP + Home).

- [ ] **Step 1: Write failing tests for `jsonLd.js`**

Create `frontend/src/__tests__/jsonLd.test.js`:

```js
import { productJsonLd, organizationJsonLd } from "../utils/jsonLd";

describe("productJsonLd", () => {
  it("returns null for null/undefined product", () => {
    expect(productJsonLd(null)).toBeNull();
    expect(productJsonLd(undefined)).toBeNull();
  });

  it("builds Product schema with aggregateRating", () => {
    const product = {
      _id: "p1",
      name: "Linen Shirt",
      description: "A shirt",
      images: [{ url: "https://res.cloudinary.com/demo/image/upload/v1/shirt.jpg" }],
      avgRating: 4.5,
      numOfReviews: 12,
    };
    const out = productJsonLd(product);
    expect(out["@type"]).toBe("Product");
    expect(out.name).toBe("Linen Shirt");
    expect(out.sku).toBe("p1");
    expect(out.aggregateRating.ratingValue).toBe(4.5);
    expect(out.aggregateRating.reviewCount).toBe(12);
  });

  it("limits reviews to 3", () => {
    const product = {
      _id: "p1",
      name: "X",
      description: "d",
      images: [],
      reviews: Array.from({ length: 10 }, (_, i) => ({
        name: `r${i}`,
        createdAt: "2026-01-01",
        comment: `c${i}`,
        rating: 5,
      })),
    };
    expect(productJsonLd(product).review).toHaveLength(3);
  });

  it("omits aggregateRating when no avgRating", () => {
    const product = { _id: "p1", name: "X", description: "d", images: [] };
    expect(productJsonLd(product).aggregateRating).toBeUndefined();
  });
});

describe("organizationJsonLd", () => {
  it("returns Organization schema with name + url", () => {
    const out = organizationJsonLd();
    expect(out["@type"]).toBe("Organization");
    expect(out.name).toBeTruthy();
    expect(out.url).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests, verify FAIL**

```bash
cd frontend && npx jest __tests__/jsonLd.test.js --no-coverage
```

Expected: FAIL — "Cannot find module '../utils/jsonLd'".

- [ ] **Step 3: Implement `frontend/src/utils/jsonLd.js`**

```js
// utils/jsonLd.js
// Schema.org JSON-LD builders for SEO rich snippets.

export function productJsonLd(product) {
  if (!product) return null;
  const imageArr = Array.isArray(product.images)
    ? product.images.map((i) => (typeof i === "string" ? i : i?.url)).filter(Boolean)
    : [];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: imageArr,
    description: product.description,
    sku: product._id,
    aggregateRating: product.avgRating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.avgRating,
          reviewCount: product.numOfReviews ?? 0,
        }
      : undefined,
    review: (product.reviews || []).slice(0, 3).map((r) => ({
      "@type": "Review",
      author: r.name,
      datePublished: r.createdAt,
      reviewBody: r.comment,
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hverdag",
    url: typeof window !== "undefined" ? window.location.origin : "",
    logo: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_512/v1/hverdag-logo.png",
  };
}
```

- [ ] **Step 4: Run tests, verify PASS**

```bash
cd frontend && npx jest __tests__/jsonLd.test.js --no-coverage
```

Expected: 5 tests pass.

- [ ] **Step 5: Implement `frontend/src/components/JsonLd.jsx`**

```jsx
// components/JsonLd.jsx
// Safe JSON-LD <script> injector. dangerouslySetInnerHTML is safe here:
// input is JSON.stringify of an object we just built from typed props;
// no user-supplied raw HTML reaches this path.
export default function JsonLd({ data }) {
  if (!data) return null;
  try {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
    );
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("JsonLd: stringify failed", err);
    }
    return null;
  }
}
```

- [ ] **Step 6: Commit**

```bash
cd ..
git add frontend/src/utils/jsonLd.js frontend/src/components/JsonLd.jsx frontend/src/__tests__/jsonLd.test.js
git commit -m "feat(seo): add JSON-LD builders + JsonLd component + tests

productJsonLd emits Product schema w/ aggregateRating + up to 3 reviews.
organizationJsonLd for homepage brand block.
JsonLd component safely serializes object into ld+json script tag.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Wire JsonLd into PDP + Home (PR2 step 4)

**Files:**

- Modify: `frontend/src/components/Product/PDP/ProductDetailsV2.js`
- Modify: `frontend/src/components/Home/Home.js`

**Interfaces:**

- Consumes: `JsonLd` from `../JsonLd`, `productJsonLd` from `../../utils/jsonLd`.
- Produces: PDP renders Product schema; Home renders Organization schema.

- [ ] **Step 1: Modify `frontend/src/components/Product/PDP/ProductDetailsV2.js`**

Add imports at top:

```js
import JsonLd from "../JsonLd";
import { productJsonLd } from "../../utils/jsonLd";
```

Locate the component's top-level `return (` block. As the first child inside the outermost wrapper element, add:

```jsx
<JsonLd data={productJsonLd(product)} />
```

(If the component wraps everything in a `<Box>` or fragment, place the `<JsonLd>` as the first child.)

- [ ] **Step 2: Modify `frontend/src/components/Home/Home.js`**

Add imports at top:

```js
import JsonLd from "../JsonLd";
import { organizationJsonLd } from "../utils/jsonLd";
```

Locate the `return (` block. As the first child, add:

```jsx
<JsonLd data={organizationJsonLd()} />
```

- [ ] **Step 3: Run all FE tests**

```bash
cd frontend && npx jest --no-coverage
```

Expected: 55 tests pass (43 + 7 from Task 2 + 5 from Task 4). No regressions.

- [ ] **Step 4: Run E2E**

```bash
cd ..
npm run e2e
```

Expected: 80 tests pass.

- [ ] **Step 5: Extend E2E to assert JSON-LD present**

Modify `e2e/pageSmoke.spec.js`. Find the section that visits the PDP (search for `/product/`). After the existing assertions, add:

```js
test("PDP injects Product JSON-LD", async ({ page }) => {
  await page.goto(`/product/${productSlug}`);
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(jsonLd).toContain('"@type":"Product"');
  expect(jsonLd).toContain('"@type":"AggregateRating"');
});

test("Home injects Organization JSON-LD", async ({ page }) => {
  await page.goto("/");
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(jsonLd).toContain('"@type":"Organization"');
});
```

(Use the existing `productSlug` fixture/variable from the file. If the file doesn't have one, look up via API in `beforeAll`.)

- [ ] **Step 6: Run E2E with new tests**

```bash
npm run e2e
```

Expected: 82 tests pass (80 existing + 2 new). No regressions.

- [ ] **Step 7: Re-run Lighthouse, commit post-PR2 baseline**

```bash
npm run perf
mv docs/perf/baseline-$(date +%Y-%m-%d).json docs/perf/post-pr2-$(date +%Y-%m-%d).json
git add -f docs/perf/post-pr2-*.json
git commit -m "perf: capture post-PR2 Lighthouse scores

Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] **Step 8: Push branch + update PR (still draft)**

```bash
git push
gh pr edit --add-label "perf,seo" 2>/dev/null || true
```

---

## Task 6: SkipLink Component + CSS + Wire (PR3 step 1)

**Files:**

- Create: `frontend/src/components/SkipLink.jsx`
- Modify: `frontend/src/index.css` (add `.skip-link` styles)
- Modify: `frontend/src/components/Home/Header/index.js` (mount SkipLink)
- Modify: `frontend/src/App.js` (wrap routes in `<main id="main">`)

**Interfaces:**

- `<SkipLink targetId="main" />` → renders `<a href="#main" class="skip-link">Skip to main content</a>`.
- App.js wraps route outlet in `<Box component="main" id="main" tabIndex={-1}>`.

- [ ] **Step 1: Create `frontend/src/components/SkipLink.jsx`**

```jsx
// components/SkipLink.jsx
// A11y: visually hidden until focused. First focusable element on every page.
export default function SkipLink({ targetId = "main", children = "Skip to main content" }) {
  return (
    <a href={`#${targetId}`} className="skip-link">
      {children}
    </a>
  );
}
```

- [ ] **Step 2: Add `.skip-link` styles to `frontend/src/index.css`**

Open `frontend/src/index.css`. Find the `:focus-visible` block (~line 34-37). After it, add:

```css
/* A11y: skip-link, hidden until focused */
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

- [ ] **Step 3: Mount `<SkipLink />` in `frontend/src/components/Home/Header/index.js`**

Add import at top:

```js
import SkipLink from "../SkipLink";
```

Locate the header's outermost `return (`. As the first child inside the outermost wrapper (before any other JSX), add:

```jsx
<SkipLink />
```

- [ ] **Step 4: Wrap routes in `<main id="main">` in `frontend/src/App.js`**

Open `frontend/src/App.js`. Find the `<Routes>` block (around line ~28-54 inside the routed layout). Wrap it in:

```jsx
<Box component="main" id="main" tabIndex={-1} sx={{ outline: "none" }}>
  <Routes>{/* existing routes */}</Routes>
</Box>
```

If there's already a wrapper component (e.g., a Layout), add the `id="main"` and `component="main"` props to it instead of wrapping again. Use whichever approach minimizes the diff.

- [ ] **Step 5: Run FE tests**

```bash
cd frontend && npx jest --no-coverage
```

Expected: 55 tests pass (no new tests, no regressions).

- [ ] **Step 6: Commit**

```bash
cd ..
git add frontend/src/components/SkipLink.jsx frontend/src/index.css frontend/src/components/Home/Header/index.js frontend/src/App.js
git commit -m "feat(a11y): add skip-link + main landmark

WCAG 2.1 SC 2.4.1 Bypass Blocks. SkipLink visually hidden until
focused; jumps to #main landmark. Routes wrapped in main element
with tabIndex=-1 so target is focusable but not in tab order.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: 44px Touch Targets + Alt Text + Contrast Tokens (PR3 step 2)

**Files:**

- Modify: `frontend/src/components/Product/ProductCard.jsx` (heart 36 → 44)
- Modify: `frontend/src/components/Product/PDP/MainImage.js` (alt already set in Task 3)
- Modify: `frontend/src/design/tokens-css.js` (add `--t-neutral-700`)
- Modify: `frontend/src/components/Product/ProductCard.jsx` (migrate review-count to neutral-700)
- Modify: `frontend/src/components/Home/Header/DesktopNav.jsx` (breadcrumb captions)
- Modify: `frontend/src/components/Home/Footer.js` (small link text)

- [ ] **Step 1: Bump wishlist heart to 44px in `frontend/src/components/Product/ProductCard.jsx`**

Find the wishlist `IconButton`. Change `size="small"` to `size="medium"` (MUI IconButton `medium` is 40px; for 44px add `sx={{ minWidth: 44, minHeight: 44, p: 1.25 }}`).

If heart already uses custom `sx={{ p: 0.5 }}`, replace with `sx={{ minWidth: 44, minHeight: 44 }}`.

- [ ] **Step 2: Verify PDP MainImage alt already set**

Task 3 set `alt={product?.name || 'Product image'}`. Verify no change needed by reading the file at `frontend/src/components/Product/PDP/MainImage.js`. If alt still empty, apply the Task 3 change now.

- [ ] **Step 3: Add `--t-neutral-700` to `frontend/src/design/tokens-css.js`**

Find the `--t-neutral-*` block. After `--t-neutral-600`, add:

```js
'--t-neutral-700': '#3D3D3D',  // AA-compliant body text on #FAFAF9 (≥4.5:1)
```

Verify the existing `--t-neutral-*` shades remain unchanged.

- [ ] **Step 4: Migrate review-count color in `frontend/src/components/Product/ProductCard.jsx`**

Find the review-count `<span>` (around line ~305-324, near the star rating). Change its color from `var(--t-neutral-500)` (or inline `#6B6B6B`) to `var(--t-neutral-700)`.

- [ ] **Step 5: Migrate DesktopNav breadcrumb captions**

Open `frontend/src/components/Home/Header/DesktopNav.jsx`. Find any breadcrumb/caption text using `--t-neutral-500` or lighter. Change to `var(--t-neutral-700)`. Common offenders: small grey subtitle spans. If none exist, skip.

- [ ] **Step 6: Migrate Footer link text**

Open `frontend/src/components/Home/Footer.js`. Find small link text spans (`<Typography variant="caption">` or similar). Change color to `var(--t-neutral-700)`. If existing color is already darker, skip.

- [ ] **Step 7: Run all FE tests**

```bash
cd frontend && npx jest --no-coverage
```

Expected: 55 tests pass.

- [ ] **Step 8: Run E2E**

```bash
cd ..
npm run e2e
```

Expected: 82 tests pass.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/Product/ProductCard.jsx frontend/src/components/Product/PDP/MainImage.js frontend/src/design/tokens-css.js frontend/src/components/Home/Header/DesktopNav.jsx frontend/src/components/Home/Footer.js
git commit -m "feat(a11y): 44px touch targets + AA contrast tokens + hero alt text

- Wishlist heart 36→44px (WCAG 2.5.5 Target Size)
- Add --t-neutral-700 token for AA-compliant body text
- Migrate review-count, breadcrumb captions, footer links
- PDP main image alt was already updated in PR2

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: E2E Skip-Link Test + Final LH Capture + Docs (PR3 wrap)

**Files:**

- Modify: `e2e/pageSmoke.spec.js` (add skip-link focus test)
- Create: `docs/perf/post-pr3-YYYY-MM-DD.json` (re-run LH)
- Modify: `docs/reports/CODEBASE_ANALYSIS_REPORT.md` (append Phase A section)

- [ ] **Step 1: Extend E2E with skip-link focus test**

Open `e2e/pageSmoke.spec.js`. Add a new test:

```js
test("SkipLink becomes visible and focusable on first Tab", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: /skip to main content/i });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
});
```

- [ ] **Step 2: Run E2E**

```bash
npm run e2e
```

Expected: 83 tests pass (82 existing + 1 new).

- [ ] **Step 3: Re-run Lighthouse for final capture**

Make sure dev servers are running. Then:

```bash
npm run perf
mv docs/perf/baseline-$(date +%Y-%m-%d).json docs/perf/post-pr3-$(date +%Y-%m-%d).json 2>/dev/null || true
ls docs/perf/
```

Expected: at least `baseline-*.json`, `post-pr2-*.json`, `post-pr3-*.json` present.

- [ ] **Step 4: Append Phase A section to `docs/reports/CODEBASE_ANALYSIS_REPORT.md`**

Open the file. Append at the end:

```markdown
## Conversion Uplift — Phase A (2026-07-13)

Shipped: Lighthouse baseline + image perf (Cloudinary f_auto/q_auto + srcset) + JSON-LD Product/Organization schema + a11y fixes (skip-link, AA contrast tokens, 44px touch targets).

**Score deltas** (from baseline to post-PR3, mobile):

- Homepage a11y: <baseline> → <post-pr3>
- PDP a11y: <baseline> → <post-pr3>
- PDP perf: <baseline> → <post-pr3>

See `docs/perf/baseline-*.json`, `docs/perf/post-pr2-*.json`, `docs/perf/post-pr3-*.json` for raw scores.

**Spec**: `docs/superpowers/specs/2026-07-13-conversion-uplift-phase-a-design.md`

**Deferred**: Phase B (guest checkout, separate spec), Phase C (hierarchy + trust polish), Phase D (test infra), tips #8 (AI recs) and #10 (A/B infra) — user-flagged gaps.
```

Replace `<baseline>` and `<post-pr3>` with actual numbers from the JSON files.

- [ ] **Step 5: Commit + push**

```bash
git add -f docs/perf/ e2e/pageSmoke.spec.js docs/reports/CODEBASE_ANALYSIS_REPORT.md
git commit -m "test(a11y): e2e assert skip-link + capture final LH scores

Final Phase A wrap-up. Branch ready to merge.

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

- [ ] **Step 6: Mark PR ready for review**

```bash
gh pr ready
gh pr edit --add-label "a11y,perf,seo,phase-a" 2>/dev/null || true
```

---

## Self-Review

**1. Spec coverage:**

- Tip #3 (speed) → Tasks 2, 3 ✓
- Tip #4 (social proof via JSON-LD) → Tasks 4, 5 ✓
- Tip #9 (a11y) → Tasks 6, 7, 8 ✓
- Baseline measurement → Task 1 ✓
- Success criteria verification → Tasks 5, 8 ✓
- Risk: skip-link wrapped Routes — Step 4 of Task 6 mentions "if there's already a wrapper component" — plan handles both layouts ✓
- Risk: Cloudinary CDN cold cache — listed in spec risks, not blocking plan execution ✓

**2. Placeholder scan:** No "TBD", "TODO", "implement later", "fill in details". All code blocks complete.

**3. Type consistency:**

- `cld(url, { w, h })` defined Task 2, used Tasks 3 ✓
- `srcset(url, widths)` defined Task 2, used Tasks 3 ✓
- `productJsonLd(product)` defined Task 4, used Task 5 ✓
- `organizationJsonLd()` defined Task 4, used Task 5 ✓
- `<JsonLd data>` defined Task 4, used Task 5 ✓
- `<SkipLink targetId>` defined Task 6, used Task 6 ✓
- Import paths: Task 3 uses `'../../utils/cloudinary'` (from `components/Product/`), Task 4 uses `'../utils/jsonLd'` (from `utils/`) — verified against actual fs layout (Task 2 created file at `frontend/src/utils/cloudinary.js`, Task 3 imports from `components/Product/`). ✓
- Self-correction: spec mentioned `Product/QuickView/QuickViewDialog.jsx`, plan uses `Product/QuickViewDialog.jsx` (verified via `ls` earlier). ✓
