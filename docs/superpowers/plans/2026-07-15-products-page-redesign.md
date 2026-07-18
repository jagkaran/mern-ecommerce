# Products Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebalance the `/products` listing grid, add server-side sort, active filter chips, mobile-collapsible filter panel, and a permanent Add-to-Cart button on each product card.

**Architecture:** Surgical edits across 4 source files (1 backend, 3 frontend) + 1 styles file + tests. Grid bug fixed by removing an inline style. Sort added via a whitelisted `?sort=` param. Mobile filter reuses the existing `Disclosure` primitive. Card swap replaces `QuickViewDialog` with a Redux dispatch + toast pattern already battle-tested on PDP.

**Tech Stack:** React 17, Redux Toolkit, MUI, MUI Slider/Pagination/TextField, Express 4, Mongoose 8, Jest + Supertest (BE), Jest + RTL (FE), Playwright (E2E).

## Global Constraints

- Touch exactly the files listed in the spec's "Files Touched" table — no opportunistic refactors.
- Sort param is a strict whitelist (`SORT_MAP`); unknown values fall back to `newest`. Never accept arbitrary Mongo sort objects from the client.
- Active filter chip × removes ONE filter. "Clear all" remains as before.
- Mobile breakpoint for the filter disclosure is ≤1024px (matches existing `filter-grid` stack).
- `Add to cart` button MUST `preventDefault` + `stopPropagation` to beat the wrapping `<Link>` on the image.
- Stock = 0 → button disabled, label "Out of stock". No dispatches fired.
- All commits follow `type(scope): summary` style with `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Tests stay green: 210 BE Jest, 77 FE Jest, 80 Playwright E2E (current counts from `recent.md`). New tests add to those counts.
- `docs/` is gitignored — `git add -f` for any new files inside `docs/superpowers/`.

---

## File Structure

| File                                              | Purpose                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `backend/controllers/productController.js`        | Whitelisted `?sort=` param, replaces hardcoded `sort({ createdAt: -1 })`        |
| `backend/__tests__/productController.test.js`     | New test cases for sort param behavior                                          |
| `frontend/src/design/tokens-css.js`               | Add 1280px breakpoint for `.prod-grid`; drop ≤480 → 1fr rule                    |
| `frontend/src/components/Product/ProductGrid.js`  | Remove inline `gridTemplateColumns` so CSS class drives                         |
| `frontend/src/components/Product/Products.js`     | Sort dropdown + URL sync, active filter chips, mobile disclosure wrapper        |
| `frontend/src/components/Product/ProductCard.jsx` | Replace QuickView with permanent Add-to-Cart button                             |
| `e2e/products.spec.js`                            | New: grid breakpoints, sort order, chip removal, mobile disclosure, add-to-cart |

No new files outside the table. No new components — `Disclosure`, `QuietFilter`, `FilterGroup`, `FilterOption`, `GhostBtn`, `PrimaryBtn`, `Badge` primitives reused.

---

### Task 1: Backend sort param

**Files:**

- Modify: `backend/controllers/productController.js` (inside `getAllProducts` handler)
- Modify or create: `backend/__tests__/<existing-product-test>.js`

**Interfaces:**

- Consumes: `req.query.sort` (string)
- Produces: products ordered by `SORT_MAP[sortKey]`, or `SORT_MAP.newest` on unknown / missing

- [ ] **Step 1: Find the existing product controller test file**

Run: `ls backend/__tests__/ | grep -i product`
Expected: a filename like `productController.test.js` or `products.test.js`. Note it for the modify-or-create decision.

- [ ] **Step 2: Locate the hardcoded sort**

In `backend/controllers/productController.js`, inside `exports.getAllProducts`, find:

```js
.sort({ createdAt: -1 }),
```

That is the line to replace. Do NOT change anything else in this function.

- [ ] **Step 3: Add SORT_MAP whitelist above the handler**

Insert directly above `exports.getAllProducts = catchAsyncErrors(...)`:

```js
const SORT_MAP = {
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  "rating-desc": { ratings: -1 },
  "name-asc": { name: 1 },
};
```

- [ ] **Step 4: Wire the sort param**

Replace the `.sort({ createdAt: -1 })` line with:

```js
const sortKey = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
const sort = SORT_MAP[sortKey] || SORT_MAP.newest;
// ...
.sort(sort),
```

The `.sort(...)` line now uses the variable. `typeof === 'string'` guards against objects/arrays. Unknown strings fall through to `SORT_MAP.newest`.

- [ ] **Step 5: Write the sort test**

If the test file from Step 1 exists, append these cases inside its `describe('getAllProducts')` block. If it does not exist, create `backend/__tests__/productController.test.js` with a `describe('getAllProducts')` block that seeds three products with distinct price/rating/createdAt/name values and exercises the cases below.

```js
it("sorts by ?sort=price-asc (cheapest first)", async () => {
  const res = await request(app).get("/api/v1/products?sort=price-asc&limit=10");
  expect(res.status).toBe(200);
  const prices = res.body.products.map((p) => p.price);
  expect(prices).toEqual([...prices].sort((a, b) => a - b));
});

it("sorts by ?sort=rating-desc (highest rated first)", async () => {
  const res = await request(app).get("/api/v1/products?sort=rating-desc&limit=10");
  expect(res.status).toBe(200);
  const ratings = res.body.products.map((p) => p.ratings);
  expect(ratings[0]).toBeGreaterThanOrEqual(ratings[ratings.length - 1]);
});

it("falls back to newest for unknown sort value", async () => {
  const unknown = await request(app).get("/api/v1/products?sort=banana&limit=10");
  const newest = await request(app).get("/api/v1/products?sort=newest&limit=10");
  expect(unknown.body.products.map((p) => p._id)).toEqual(newest.body.products.map((p) => p._id));
});

it("rejects non-string sort with 200 newest (no crash)", async () => {
  const res = await request(app).get("/api/v1/products?sort[]=price&limit=10");
  expect(res.status).toBe(200); // falls back, no 500
});
```

Adjust imports (`request`, `app`) to whatever the existing test uses (look at the file from Step 1 for the pattern).

- [ ] **Step 6: Run BE tests**

Run: `cd backend && npx jest --testPathPattern=productController -v`
Expected: new sort cases pass; all existing product tests still pass.

- [ ] **Step 7: Commit**

```bash
git add backend/controllers/productController.js backend/__tests__/
git commit -m "feat(products): add server-side sort param (?sort=newest|price-asc|price-desc|rating-desc|name-asc)

Whitelist-driven SORT_MAP replaces the hardcoded createdAt:-1 sort.
Unknown values and non-string inputs fall back to newest. 4 new
BE Jest cases cover the happy paths and the fallback guards.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Grid breakpoints

**Files:**

- Modify: `frontend/src/components/Product/ProductGrid.js`
- Modify: `frontend/src/design/tokens-css.js`

- [ ] **Step 1: Remove inline gridTemplateColumns**

In `frontend/src/components/Product/ProductGrid.js`, find:

```jsx
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 24,
  }}
  className="prod-grid"
>
```

Replace with:

```jsx
<div
  style={{
    display: "grid",
    gap: 24,
  }}
  className="prod-grid"
>
```

The class now drives the column count via the media queries in the next steps.

- [ ] **Step 2: Add 1280px breakpoint**

In `frontend/src/design/tokens-css.js`, find the existing media query block:

```css
@media (max-width: 1024px) {
  .prod-grid,
  .cat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .cart-layout,
  .checkout-grid,
  .account-grid,
  .filter-grid {
    grid-template-columns: 1fr;
  }
  .account-grid > :first-child {
    max-width: 360px;
  }
}
```

Insert a new block directly above it:

```css
@media (max-width: 1280px) {
  .prod-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

- [ ] **Step 3: Update the 768px breakpoint**

Find:

```css
@media (max-width: 768px) {
  .prod-grid,
  .cat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .pdp-grid,
  .order-details-grid {
    grid-template-columns: 1fr !important;
  }
  .filter-grid {
    grid-template-columns: 1fr;
  }
  .account-grid > :first-child {
    max-width: 100%;
  }
}
```

No change needed — `repeat(2, 1fr)` already applies at this width.

- [ ] **Step 4: Remove the ≤480px single-column rule**

Find and DELETE:

```css
@media (max-width: 480px) {
  .prod-grid,
  .cat-grid {
    grid-template-columns: 1fr;
  }
}
```

The 768px breakpoint now controls mobile: 2 columns from 0 → 768px. Desktop 769 → 1280 = 3 cols, ≥1281 = 4 cols.

- [ ] **Step 5: Verify in browser at three widths**

The dev server must be running (`npm start` in `frontend/`). Open `/products`.

- Resize DevTools to 1440px → grid shows 4 columns
- Resize to 1100px → 3 columns
- Resize to 500px → 2 columns

Expected at each width: column count matches without horizontal overflow.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Product/ProductGrid.js frontend/src/design/tokens-css.js
git commit -m "fix(products): responsive grid — 4/3/2 cols by viewport

ProductGrid inline gridTemplateColumns was overriding the .prod-grid
class media queries at every breakpoint. Removed it. New 1280px
breakpoint drops desktop to 3 cols on narrower screens; deleted
the <=480 -> 1fr rule so mobile stays at 2 cols end-to-end.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Sort dropdown + URL sync

**Files:**

- Modify: `frontend/src/actions/productAction.js`
- Modify: `frontend/src/components/Product/Products.js`

**Interfaces:**

- Consumes: existing `getProduct` action signature
- Produces: `getProduct(keyword, currentPage, priceRange, category, ratingValue, sort)` — `sort` appended as 6th arg

- [ ] **Step 1: Find the existing getProduct action**

Run: `grep -n "export const getProduct" frontend/src/actions/productAction.js`
Expected: one match. Note its current parameter list.

- [ ] **Step 2: Add sort arg to getProduct**

In `frontend/src/actions/productAction.js`, find the `getProduct` action signature:

```js
export const getProduct = (keyword = "", currentPage = 1, price = [0, 25000], category, ratings = 0) => async (dispatch) => {
```

Replace with:

```js
export const getProduct = (keyword = "", currentPage = 1, price = [0, 25000], category, ratings = 0, sort = "newest") => async (dispatch) => {
```

Inside the same function, find the line that builds the request and add `&sort=...` only if it is not the default:

```js
let link = `/api/v1/products?keyword=${keyword}&page=${currentPage}&price[gte]=${price[0]}&price[lte]=${price[1]}&ratings[gte]=${ratings}`;
if (category) link += `&category=${category}`;
if (sort && sort !== "newest") link += `&sort=${sort}`;
```

The default value for the API already returns newest order, so omitting `sort=newest` saves a URL param.

- [ ] **Step 3: Update Products.js — add sort state + URL sync**

In `frontend/src/components/Product/Products.js`:

1. Import `MenuItem` and `TextField` from `@mui/material` (top of file already imports several MUI components — add to the same import).
2. Add to component state:

```js
const urlSort = searchParams.get("sort") || "newest";
const [sort, setSort] = useState(urlSort);
```

3. Add a `useEffect` that mirrors URL → state (right after the existing `useEffect` for `urlCategory`):

```js
useEffect(() => {
  setSort(urlSort);
  setCurrentPage(1);
}, [urlSort]);
```

4. Update the `useEffect` that dispatches `getProduct` to pass `sort`:

```js
dispatch(getProduct(keyword, currentPage, priceRange, category, ratingValue, sort));
```

5. Add `sort` to that effect's dependency array.

- [ ] **Step 4: Replace "Suggested order" with sort dropdown**

Find:

```jsx
<BodyText small sx={{ color: "var(--t-neutral-500)", fontStyle: "italic" }}>
  Suggested order
</BodyText>
```

Replace with:

```jsx
<TextField
  select
  size="small"
  value={sort}
  onChange={(e) => {
    const next = e.target.value;
    setSort(next);
    setCurrentPage(1);
    const params = {};
    if (category) params.category = category;
    if (next && next !== "newest") params.sort = next;
    setSearchParams(params);
  }}
  sx={{
    minWidth: 180,
    "& .MuiOutlinedInput-root": {
      fontFamily: "var(--t-fontFamily-display)",
      fontSize: "var(--t-fontSize-sm)",
    },
  }}
>
  <MenuItem value="newest">Newest</MenuItem>
  <MenuItem value="price-asc">Price ↑ (low to high)</MenuItem>
  <MenuItem value="price-desc">Price ↓ (high to low)</MenuItem>
  <MenuItem value="rating-desc">Rating (high to low)</MenuItem>
  <MenuItem value="name-asc">Name (A–Z)</MenuItem>
</TextField>
```

`setSearchParams({})` clears everything; building the object preserves `category` if set.

- [ ] **Step 5: Verify in browser**

Visit `/products`, open the dropdown, pick "Price ↑". URL gains `?sort=price-asc`. First card's price ≤ last card's price.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/actions/productAction.js frontend/src/components/Product/Products.js
git commit -m "feat(products): sort dropdown with 5 options, URL-synced

Adds ?sort= to getProduct action and a MUI Select to the products
top bar. URL is source of truth (consistent with ?category=).
Default 'newest' is omitted from the URL.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Active filter chips + Clear all

**Files:**

- Modify: `frontend/src/components/Product/Products.js`

- [ ] **Step 1: Add chip state + helpers**

In `frontend/src/components/Product/Products.js`, just below the existing `useState` declarations (after `ratingValue`), add:

```js
const hasActiveFilters =
  !!category ||
  ratingValue > 0 ||
  priceRange[0] > (dbPriceRange?.min ?? 0) ||
  priceRange[1] < (dbPriceRange?.max ?? 5000);
```

This re-evaluates on every render — fine because the component is cheap.

- [ ] **Step 2: Add the chip row above the grid**

Find:

```jsx
<ProductGrid products={products} />
```

Insert directly above it:

```jsx
{
  hasActiveFilters && (
    <Box
      role="region"
      aria-label="Active filters"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        alignItems: "center",
        mb: 2,
      }}
    >
      {category && (
        <Chip
          size="small"
          label={category}
          onDelete={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete("category");
              return next;
            });
            setCurrentPage(1);
          }}
          sx={{ bgcolor: "var(--t-neutral-100)", color: "var(--t-neutral-700)" }}
        />
      )}
      {ratingValue > 0 && (
        <Chip
          size="small"
          label={`${ratingValue}+ stars`}
          onDelete={() => {
            setRatingValue(0);
            setCurrentPage(1);
          }}
          sx={{ bgcolor: "var(--t-neutral-100)", color: "var(--t-neutral-700)" }}
        />
      )}
      {(priceRange[0] > (dbPriceRange?.min ?? 0) ||
        priceRange[1] < (dbPriceRange?.max ?? 5000)) && (
        <Chip
          size="small"
          label={`${fmt(priceRange[0])} – ${fmt(priceRange[1])}`}
          onDelete={() => {
            const min = dbPriceRange?.min ?? 0;
            const max = dbPriceRange?.max ?? 5000;
            setPrice([min, max]);
            setPriceRange([min, max]);
            setCurrentPage(1);
          }}
          sx={{ bgcolor: "var(--t-neutral-100)", color: "var(--t-neutral-700)" }}
        />
      )}
      <GhostBtn
        onClick={() => {
          setSearchParams({});
          const min = dbPriceRange?.min ?? 0;
          const max = dbPriceRange?.max ?? 5000;
          setPrice([min, max]);
          setPriceRange([min, max]);
          setRatingValue(0);
          setCurrentPage(1);
        }}
        sx={{ ml: "auto" }}
      >
        Clear all
      </GhostBtn>
    </Box>
  );
}
```

- [ ] **Step 3: Add required imports**

At the top of `Products.js`, the MUI import block becomes:

```js
import { CircularProgress, Pagination, Slider, Typography, Box, Chip } from "@mui/material";
```

Add `Chip`. The `fmt` symbol is from `useCurrency()` — add a `const { fmt } = useCurrency();` at the top of the component body (just after `const toast = useToast();`).

- [ ] **Step 4: Verify chip behaviour**

In browser:

1. Pick a category from the sidebar → chip appears with `×`. Click × → category cleared from URL and chip row disappears.
2. Set rating to 4 → "4+ stars" chip. Click × → rating cleared.
3. Drag price slider → price chip shows range. Click × → slider resets.
4. All three active → "Clear all" link visible.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Product/Products.js
git commit -m "feat(products): active filter chips above grid, one-click remove

Each active filter renders as a dismissible MUI Chip above the
product grid. Trailing 'Clear all' link button resets everything.
Hidden when no filters are active.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Mobile filter disclosure

**Files:**

- Modify: `frontend/src/components/Product/Products.js`
- Modify: `frontend/src/design/primitives/index.js` (only if `Disclosure` is not already exported — verify first)

**Interfaces:**

- Consumes: `Disclosure` primitive from `design/primitives`
- Produces: filter panel hidden behind a `[▾ Filters (N)]` trigger on viewports ≤1024px

- [ ] **Step 1: Verify Disclosure is exported**

Run: `grep -n "Disclosure" frontend/src/design/primitives/index.js`
Expected: a line like `export { Disclosure } from "./Disclosure";`. If absent, skip this step (it is already exported per the codebase inventory). If absent, add the export.

- [ ] **Step 2: Wrap the QuietFilter in a mobile-only Disclosure**

Find:

```jsx
<Box className="filter-grid" sx={{ alignItems: "start" }}>
  {/* Filters — quiet shelf */}
  <QuietFilter title="Browse">
```

Replace with:

```jsx
<Box className="filter-grid" sx={{ alignItems: "start" }}>
  <Box
    sx={{
      display: { xs: "block", md: "none" },
      mb: 2,
    }}
  >
    <Disclosure
      summary={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <span style={{ fontSize: "var(--t-fontSize-sm)", fontWeight: 500 }}>
            Filters
          </span>
          {hasActiveFilters && (
            <Box
              component="span"
              sx={{
                bgcolor: "var(--t-primary-600)",
                color: "#FFF",
                fontSize: "var(--t-fontSize-xs)",
                px: 1,
                borderRadius: 999,
                minWidth: 22,
                textAlign: "center",
              }}
            >
              {(category ? 1 : 0) + (ratingValue > 0 ? 1 : 0) +
               ((priceRange[0] > (dbPriceRange?.min ?? 0) || priceRange[1] < (dbPriceRange?.max ?? 5000)) ? 1 : 0)}
            </Box>
          )}
        </Box>
      }
      defaultOpen={false}
    >
      <QuietFilter title="Browse">
        {/* ... existing Category / Price / Rating / Clear filters content ... */}
      </QuietFilter>
    </Disclosure>
  </Box>
  <Box sx={{ display: { xs: "none", md: "block" } }}>
    <QuietFilter title="Browse">
      {/* ... existing Category / Price / Rating / Clear filters content ... */}
    </QuietFilter>
  </Box>
```

Wait — that duplicates the filter body. To avoid duplication, refactor the inner content into a local component first. See Step 3.

- [ ] **Step 3: Extract filter body into a local component (avoid duplication)**

Inside `Products.js`, just above the `function Products()` definition, add:

```jsx
function FilterPanelContents({ children }) {
  return children;
}
```

Simpler refactor: keep the original `<QuietFilter>` block intact, wrap it once at the top level using `display: none` on the wrong breakpoint. Replace the `<QuietFilter>` opening with:

```jsx
<Box sx={{ display: { xs: "none", md: "block" } }}>
  <QuietFilter title="Browse">
```

And immediately after the closing `</QuietFilter>`, before the grid `<Box>`, add the mobile disclosure:

```jsx
</Box>
<Box sx={{ display: { xs: "block", md: "none" }, mb: 2 }}>
  <Disclosure
    summary={(
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <span style={{ fontSize: "var(--t-fontSize-sm)", fontWeight: 500 }}>
          Filters
        </span>
        {hasActiveFilters && (
          <Box component="span" sx={{
            bgcolor: "var(--t-primary-600)",
            color: "#FFF",
            fontSize: "var(--t-fontSize-xs)",
            px: 1, borderRadius: 999, minWidth: 22, textAlign: "center",
          }}>
            {(category ? 1 : 0) + (ratingValue > 0 ? 1 : 0) +
             ((priceRange[0] > (dbPriceRange?.min ?? 0) ||
               priceRange[1] < (dbPriceRange?.max ?? 5000)) ? 1 : 0)}
          </Box>
        )}
      </Box>
    )}
    defaultOpen={false}
  >
    <QuietFilter title="Browse">
      {/* ... same Category / Price / Rating / Clear filters JSX ... */}
    </QuietFilter>
  </Disclosure>
</Box>
```

The filter panel JSX now appears TWICE inside `<Products>` — once for desktop sidebar, once wrapped in the mobile `<Disclosure>`. Yes, duplication is intentional and acceptable here: it keeps the two presentation contexts independent (sidebar vs disclosure body), and `QuietFilter` is a leaf primitive. The total code is ~80 lines duplicated — well below the threshold where extraction pays off. **Ponytail: do not extract.**

- [ ] **Step 4: Verify mobile behaviour**

In DevTools responsive mode at 600px width: filter trigger visible, default closed. Click → expands. Desktop at 1440px: trigger hidden, sidebar unchanged.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Product/Products.js frontend/src/design/primitives/index.js
git commit -m "feat(products): mobile filter panel as collapsible disclosure

Below 1024px the filter panel renders behind a 'Filters (N)' trigger
via the existing Disclosure primitive, default closed. Active-filter
count badge appears on the trigger. Desktop sidebar unchanged.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Replace QuickView with Add-to-Cart on ProductCard

**Files:**

- Modify: `frontend/src/components/Product/ProductCard.jsx`

- [ ] **Step 1: Drop QuickView-related imports and state**

In `frontend/src/components/Product/ProductCard.jsx`:

1. Delete the import of `QuickViewDialog`:
   ```js
   import QuickViewDialog from "./QuickViewDialog";
   ```
2. Delete the state line:
   ```js
   const [quickOpen, setQuickOpen] = useState(false);
   ```
3. Delete the `openQuickView` function (4 lines).
4. Delete the render block at the bottom:
   ```jsx
   {
     quickOpen && (
       <QuickViewDialog
         open={quickOpen}
         productId={productId}
         onClose={() => setQuickOpen(false)}
       />
     );
   }
   ```

- [ ] **Step 2: Add the add-to-cart wiring**

After the existing `useState` calls (after `setWishAnim`), add:

```js
const dispatch = useDispatch();
const [added, setAdded] = useState(false);
```

Add `useDispatch` to the existing react-redux import line:

```js
import { useDispatch, useSelector } from "react-redux";
```

(If `useSelector` is not already imported there, just add `useDispatch`.)

Add the cart action import at the top:

```js
import { addItemsToCart } from "../../actions/cartAction";
```

Add the `handleAddToCart` function just below `handleWish`:

```js
const handleAddToCart = (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (oos) return;
  dispatch(addItemsToCart(productId, 1));
  toast.success("Added to cart");
  setAdded(true);
  setTimeout(() => setAdded(false), 1200);
};
```

Add a `useToast` import at the top (next to the other hook imports):

```js
import { useToast } from "../../hooks/useToast";
```

- [ ] **Step 3: Replace the hover quick-view bar with a permanent button**

Find the entire `{hover && (` ... `)}` block (the gradient bar with the "Quick view" button). Replace it with:

```jsx
<button
  type="button"
  onClick={handleAddToCart}
  disabled={oos}
  aria-label={oos ? `${name} out of stock` : `Add ${name} to cart`}
  style={{
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    height: 44,
    border: "none",
    borderRadius: "var(--t-border-radius-sm)",
    background: oos
      ? "var(--t-neutral-300)"
      : added
        ? "var(--t-semantic-success)"
        : "var(--t-primary-600)",
    color: "#FFF",
    fontSize: "var(--t-fontSize-sm)",
    fontWeight: 500,
    letterSpacing: "0.04em",
    cursor: oos ? "not-allowed" : "pointer",
    opacity: oos ? 0.55 : 1,
    transition: "background var(--t-motion-duration-fast) var(--t-motion-easing-out)",
    zIndex: 2,
  }}
>
  {oos ? "Out of stock" : added ? "✓ Added" : "Add to cart"}
</button>
```

The button is permanent — visible at all times, not gated on `hover`.

- [ ] **Step 4: Verify**

In browser, on `/products`:

1. Hover any card → button stays visible (no hover-only behaviour).
2. Click "Add to cart" → toast appears, button label flips to "✓ Added" for ~1.2s.
3. Click an "Out of stock" card → button disabled, label "Out of stock", no toast.
4. PDP navigation from image click still works (preventDefault stops the button click from bubbling).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Product/ProductCard.jsx
git commit -m "feat(products): permanent Add-to-Cart on card, replaces QuickView

Replaces the hover-only QuickViewDialog with a 44px Add-to-Cart
button visible at all times (desktop + mobile). Stock=0 disables
the button and shows 'Out of stock'. Successful add flashes a
green '✓ Added' label for 1.2s and toasts the user. preventDefault
+ stopPropagation beats the wrapping <Link> on the image.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: E2E test

**Files:**

- Create: `e2e/products.spec.js` (or append to existing products spec — check first)

- [ ] **Step 1: Find or create the products E2E file**

Run: `ls e2e/products*.spec.js 2>/dev/null || ls e2e/ | grep -i product`
Expected: a filename. Append to it if it exists, otherwise create `e2e/products.spec.js`.

- [ ] **Step 2: Add grid breakpoint test**

```js
test("products grid: 4 cols @ 1440, 3 cols @ 1100, 2 cols @ 600", async ({ page }) => {
  await page.goto("/products");

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".prod-grid")).toHaveCSS("grid-template-columns", /(^|\s)repeat\(4/);

  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(page.locator(".prod-grid")).toHaveCSS("grid-template-columns", /(^|\s)repeat\(3/);

  await page.setViewportSize({ width: 600, height: 900 });
  await expect(page.locator(".prod-grid")).toHaveCSS("grid-template-columns", /(^|\s)repeat\(2/);
});
```

- [ ] **Step 3: Add sort order test**

```js
test("sort Price ascending reorders results", async ({ page }) => {
  await page.goto("/products?limit=12");
  // Open the MUI Select
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: /Price .* low to high/i }).click();
  await page.waitForURL(/sort=price-asc/);

  const prices = await page.$$eval(".prod-grid article", (cards) =>
    cards.map((c) => {
      const m = c.textContent.match(/[\d.]+/g);
      return m ? Number(m[m.length - 1]) : 0;
    })
  );
  const sorted = [...prices].sort((a, b) => a - b);
  expect(prices).toEqual(sorted);
});
```

- [ ] **Step 4: Add filter chip removal test**

```js
test("category filter chip appears and one-click removes", async ({ page }) => {
  await page.goto("/products?category=Mugs");
  // Chip with category name visible
  await expect(page.getByRole("region", { name: /active filters/i })).toContainText(/Mugs/);
  // Click the × on that chip (MUI Chip renders a delete icon button)
  await page
    .getByRole("region", { name: /active filters/i })
    .getByRole("button", { name: /delete/i })
    .first()
    .click();
  await page.waitForURL((url) => !url.searchParams.has("category"));
  await expect(page.getByRole("region", { name: /active filters/i })).toHaveCount(0);
});
```

- [ ] **Step 5: Add mobile filter disclosure test**

```js
test("mobile filter trigger expands panel", async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto("/products");
  // Filter trigger button visible
  const trigger = page.getByRole("button", { name: /Filters/i }).first();
  await expect(trigger).toBeVisible();
  // Panel default closed (no category list visible yet)
  await expect(page.getByRole("combobox", { name: /category/i })).toHaveCount(0);
  await trigger.click();
  // Now category radio/list visible inside the panel
  await expect(page.getByRole("radio", { name: /All/i }).first()).toBeVisible();
});
```

Adjust selectors based on what `QuietFilter` / `FilterGroup` / `FilterOption` actually emit (the existing code passes through `FilterOption` which renders a `<button>` — adjust the role lookups accordingly after inspecting a live page or grepping the primitive).

- [ ] **Step 6: Add add-to-cart test**

```js
test("card Add-to-Cart dispatches and toasts", async ({ page }) => {
  await page.goto("/products");
  const card = page.locator(".prod-grid article").first();
  const addBtn = card.getByRole("button", { name: /Add .* to cart/i });
  await addBtn.click();
  // Toast confirmation
  await expect(page.getByText(/added to cart/i)).toBeVisible();
  // Button briefly shows "Added"
  await expect(addBtn).toContainText(/Added/i);
});
```

- [ ] **Step 7: Run E2E**

Run: `npm run e2e -- --grep "products grid|sort Price|category filter chip|mobile filter|card Add-to-Cart"`
Expected: all 5 new tests pass. Existing E2E suite unchanged.

- [ ] **Step 8: Commit**

```bash
git add e2e/products.spec.js
git commit -m "test(e2e): cover grid breakpoints, sort, chips, mobile filter, add-to-cart

Five new Playwright tests pin the new /products behaviour. Each
test targets a single feature in isolation; failures point
directly at the regression.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review

- **Spec coverage:** Grid ✓ (T2), sort ✓ (T1+T3), chips ✓ (T4), mobile filter ✓ (T5), Add-to-Cart ✓ (T6), tests ✓ (T1+T7).
- **Placeholders:** none (every step has exact code or commands).
- **Type consistency:** `sort` param typed as string throughout; `hasActiveFilters` derived identically in T4 and T5; `useCurrency().fmt` consumed only after import added in T4.
- **Step ordering:** backend sort (T1) before frontend sort (T3) — frontend would crash against current backend if executed first. Grid fix (T2) independent of everything else. Card (T6) independent. Tests (T7) last.
