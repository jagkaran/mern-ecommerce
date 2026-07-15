# Products Page Redesign — Design Spec

**Date:** 2026-07-15
**Status:** Approved (brainstorming phase complete)
**Branch:** master
**Scope:** Listing page (`/products`) layout + card UX + backend sort param. PDP, cart, wishlist, checkout untouched.

## Problem

1. Grid forces 4 columns at every viewport width — `ProductGrid.js` sets `gridTemplateColumns: 'repeat(4, 1fr)'` inline, overriding the responsive CSS class.
2. Top bar shows static "Suggested order" — no actual sort UI; backend hardcodes `sort({ createdAt: -1 })`.
3. Active filters only have a single "Clear filters" button — shoppers can't deselect a single filter without re-picking from the panel.
4. Filter panel stacks below the grid on mobile with no entry-point cue.
5. Card has a hover-only Quick View modal — desktop-only, not useful on touch.

## Goals

- Grid: 4 cols ≥1280, 3 cols 769–1280, 2 cols ≤768. No 1-col floor.
- Top bar: result count + Sort dropdown (5 options) + filter chips row.
- Active filter chips above grid — one click to remove.
- Mobile: filter panel becomes collapsible disclosure, default closed.
- Card: replace Quick View with permanent Add-to-Cart button. Stock-aware.

## Design

### A. Grid (`frontend/src/components/Product/ProductGrid.js`)

Remove inline `gridTemplateColumns: 'repeat(4, 1fr)'`. Let the `.prod-grid` class drive.

### B. Breakpoints (`frontend/src/design/tokens-css.js`)

```css
.prod-grid { grid-template-columns: repeat(4, 1fr); }   /* existing */

@media (max-width: 1280px) { .prod-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px)  { .prod-grid { grid-template-columns: repeat(2, 1fr); } }
/* remove the @media (max-width: 480px) { grid-template-columns: 1fr; } rule */
```

### C. Sort (server-side)

`backend/controllers/productController.js`:

```js
const SORT_MAP = {
  newest:        { createdAt: -1 },
  'price-asc':   { price: 1 },
  'price-desc':  { price: -1 },
  'rating-desc': { ratings: -1 },
  'name-asc':    { name: 1 },
};
const sortKey = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
const sort = SORT_MAP[sortKey] || SORT_MAP.newest;
// replace the hardcoded .sort({ createdAt: -1 }) with .sort(sort)
```

Whitelist prevents injection of arbitrary Mongo sort objects. Unknown values fall back to `newest`.

`frontend/src/components/Product/Products.js` — top bar sort:

```jsx
<TextField
  select
  size="small"
  value={sort}
  onChange={(e) => { setSort(e.target.value); setCurrentPage(1); }}
  sx={{ minWidth: 180 }}
>
  <MenuItem value="newest">Newest</MenuItem>
  <MenuItem value="price-asc">Price ↑ (low to high)</MenuItem>
  <MenuItem value="price-desc">Price ↓ (high to low)</MenuItem>
  <MenuItem value="rating-desc">Rating (high to low)</MenuItem>
  <MenuItem value="name-asc">Name (A–Z)</MenuItem>
</TextField>
```

`sort` lives in URL `?sort=` (consistent with `?category=`). State in component, mirrored to URL on change.

`getProduct` action gains a `sort` arg; reducer unchanged. Query string updated by `setSearchParams`.

### D. Active filter chips

Above grid, single `<Box>` row, wraps, gap 8px. One chip per active filter:

- Category: `{category} ×` → clears `category`
- Price: `£{min}–£{max} ×` → resets `price`/`priceRange` to `dbPriceRange`
- Rating: `{n}+ stars ×` → resets `ratingValue` to 0
- Trailing: small "Clear all" link button when ≥1 chip active

Chips render only when at least one filter is active. Each chip is a `<button>` with `×` glyph for one-click removal.

### E. Mobile filter disclosure

At viewport ≤1024px, the `<QuietFilter>` is wrapped in the existing `Disclosure` primitive (already in `design/primitives`). Default closed. Trigger label: `[▾ Filters]` with active-filter count badge `(3)`.

Desktop behavior unchanged — filter sidebar always visible.

### F. Card Add-to-Cart (replaces Quick View)

`frontend/src/components/Product/ProductCard.jsx`:

- Drop `QuickViewDialog` import, `quickOpen` state, hover-only quick-view bar.
- Add new `added` state (1.2s flash after successful add).
- Replace the hover quick-view `<div>` with a permanent bottom-of-media button:

```jsx
<button
  type="button"
  onClick={handleAddToCart}
  disabled={oos}
  aria-label={oos ? `${name} out of stock` : `Add ${name} to cart`}
  style={{
    position: 'absolute',
    left: 12, right: 12, bottom: 12,
    height: 44,
    border: 'none',
    borderRadius: 'var(--t-border-radius-sm)',
    background: added ? 'var(--t-semantic-success)' : 'var(--t-primary-600)',
    color: '#FFF',
    fontSize: 'var(--t-fontSize-sm)',
    fontWeight: 500,
    letterSpacing: '0.04em',
    cursor: oos ? 'not-allowed' : 'pointer',
    opacity: oos ? 0.55 : 1,
    transition: 'background var(--t-motion-duration-fast) var(--t-motion-easing-out)',
  }}
>
  {oos ? 'Out of stock' : added ? '✓ Added' : 'Add to cart'}
</button>
```

`handleAddToCart`:
1. `e.preventDefault()` + `e.stopPropagation()` — must beat wrapping `<Link>`
2. `dispatch(addItemsToCart(productId, 1))`
3. `toast.success('Added to cart')`
4. `setAdded(true)` → `setTimeout(() => setAdded(false), 1200)`

Stock = 0 → button disabled, "Out of stock" label. `Badge` for "Out of Stock" top-left kept (still visible).

## Out of Scope (YAGNI)

- Color swatch click → variant swap (cards are static today)
- Compare list
- Infinite scroll (Pagination stays)
- Recently viewed strip
- A/B test sort defaults

## Files Touched

| File | Change |
|---|---|
| `frontend/src/components/Product/ProductGrid.js` | Remove inline gridTemplateColumns |
| `frontend/src/design/tokens-css.js` | New 1280px breakpoint; drop ≤480 rule |
| `frontend/src/components/Product/Products.js` | Sort dropdown, filter chips, mobile Disclosure wrapper |
| `frontend/src/components/Product/ProductCard.jsx` | Replace QuickView with Add-to-Cart button |
| `backend/controllers/productController.js` | `?sort=` via SORT_MAP whitelist |
| `backend/__tests__/productController.test.js` (or equivalent) | Sort param coverage |
| `e2e/products.spec.js` | Sort changes order; chip removes filter; mobile disclosure |

## Testing

- **BE Jest**: `getAllProducts` honors `?sort=price-asc` (cheapest product first), `?sort=rating-desc`, unknown → newest
- **FE Jest**: `Products.js` snapshot with sort selected; chip click → URL param removed; Add-to-Cart click → dispatches `addItemsToCart(productId, 1)`
- **E2E (Playwright)**:
  1. `/products` desktop → 4 columns @ 1440, 3 columns @ 1100, 2 columns @ 600 (resize)
  2. Pick Price ↑ → first card price ≤ last
  3. Apply category filter → chip appears → click × → category cleared
  4. Resize to 600 → filter trigger visible, default closed, click expands
  5. Click Add-to-Cart on a card → toast shown, button briefly flips to "✓ Added"

## Risks

- **Low.** Grid fix is removing inline style. Sort param is whitelisted (no injection). Mobile disclosure uses existing primitive. Add-to-Cart uses existing `addItemsToCart` action + toast hook — battle-tested in PDP.
- **Pagination + sort**: server applies sort before skip/limit, so sorted order is consistent across pages. Confirmed in existing `apiFeature.query.sort(...)` position relative to `.skip()`/`.limit()`.