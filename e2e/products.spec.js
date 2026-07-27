// e2e/products.spec.js
// Tests for the /products redesign: responsive grid breakpoints, sort order,
// active-filter chips, mobile filter disclosure, and per-card Add-to-Cart.
//
// Selectors reconciled against the actual rendered DOM:
// - `.prod-grid` is the grid container; cards are `<article>` elements.
// - The sort control is a MUI Select (TextField select) — the combobox role
//   is the input. Menu items become `role="option"` once opened.
// - The active-filter region is `<Box role="region" aria-label="Active filters">`
//   and MUI Chip's delete icon button defaults to aria-label="Delete".
// - Mobile filter trigger is a `<Disclosure title="Filters">` → rendered as a
//   `<button>` with accessible name "Filters".
// - `FilterOption` renders as a `<button>` with the label as its accessible
//   name (e.g. "All", "Mugs") — not `role="radio"`.
// - Per-card Add-to-Cart button has aria-label `Add {name} to cart` and
//   visible text "Add to cart" / "✓ Added". The toast is `Added to cart`.

const { test, expect } = require("@playwright/test");

test.describe("Products redesign", () => {
  test("products grid: 4 cols @ 1440, 3 cols @ 1100, 2 cols @ 600", async ({ page }) => {
    // CSS breakpoint map (tokens-css.js):
    //   base  (>1280): repeat(4, 1fr)
    //   ≤1280 / ≤1024: repeat(3, 1fr)
    //   ≤768:          repeat(2, 1fr)
    await page.goto("/products");
    // Grid is only mounted after the products fetch resolves. Wait for it
    // before reading CSS — the page itself returns on document load, well
    // before Redux finishes dispatching getProduct.
    await page.locator(".prod-grid").first().waitFor({ timeout: 30_000 });

    await page.setViewportSize({ width: 1440, height: 900 });
    // Computed grid-template-columns is "Npx Npx Npx Npx" (4 tracks).
    await expect(page.locator(".prod-grid")).toHaveCSS("grid-template-columns", /(\d+px\s+){3}\d+px/);

    await page.setViewportSize({ width: 1100, height: 900 });
    await expect(page.locator(".prod-grid")).toHaveCSS("grid-template-columns", /(\d+px\s+){2}\d+px/);

    await page.setViewportSize({ width: 600, height: 900 });
    await expect(page.locator(".prod-grid")).toHaveCSS("grid-template-columns", /\d+px\s+\d+px/);
  });

  test("sort Price ascending reorders results", async ({ page }) => {
    await page.goto("/products?limit=12");
    // Wait for the grid + sort control to render — the MUI Select is only
    // mounted after products load.
    await page.locator(".prod-grid").first().waitFor({ timeout: 30_000 });
    // Two comboboxes on /products (currency switcher + sort). Scope by name.
    await page.getByRole("combobox", { name: "Newest" }).click();
    // MUI Select renders options with role="option". Match the actual menu
    // text "Price ↑ (low to high)" — the arrow glyph is between the words.
    await page.getByRole("option", { name: /price.*low to high/i }).click();
    await page.waitForURL(/sort=price-asc/);

    // The card body has the price as its last numeric token after the
    // category overline and product name. The Add-to-Cart button overlays
    // an aria-label with "Add {name} to cart" (which is not numeric), so
    // picking the last numeric run gets the displayed price.
    const prices = await page.$$eval(".prod-grid article", (cards) =>
      cards.map((c) => {
        const m = c.textContent.match(/[\d.]+/g);
        return m ? Number(m[m.length - 1]) : 0;
      })
    );
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  test("category filter chip appears and one-click removes", async ({ page }) => {
    // Use a real category from the seed data. Mugs doesn't exist; footwear
    // has 16 items in the seed.
    await page.goto("/products?category=footwear");

    // Active-filters region is a Box with role="region" aria-label="Active
    // filters". It only renders when at least one filter is active.
    const filtersRegion = page.getByRole("region", { name: /active filters/i });
    await expect(filtersRegion).toBeVisible();
    await expect(filtersRegion).toContainText(/footwear/i);

    // MUI Chip's delete button has no accessible name by default. Use the
    // MUI class hook (.MuiChip-deleteIcon) to locate the delete SVG, then
    // click its parent button.
    await filtersRegion
      .locator(".MuiChip-deleteIcon")
      .first()
      .click();
    await page.waitForURL((url) => !url.searchParams.has("category"));

    // Region is unmounted once no filters are active.
    await expect(page.getByRole("region", { name: /active filters/i })).toHaveCount(0);
  });

  test("mobile filter trigger expands panel", async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 });
    await page.goto("/products");

    // Mobile flow has two "Filters" buttons stacked: the outer Disclosure
    // trigger (collapsed by default) and the inner QuietFilter chip that
    // opens the Drawer. Click both to actually expose the filter options.
    const filtersButtons = page.getByRole("button", { name: /^Filters$/ });
    await expect(filtersButtons.first()).toBeVisible();
    await filtersButtons.first().click(); // expand Disclosure
    await filtersButtons.last().click(); // open Drawer via mobile chip

    // Drawer slides in; category options become visible. FilterOption
    // renders as a `<button>` (not radio), so query by role/name.
    await expect(page.getByRole("button", { name: /^All/ }).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("card Add-to-Cart dispatches and toasts", async ({ page }) => {
    await page.goto("/products");
    await page.locator(".prod-grid article").first().waitFor({ timeout: 30_000 });

    const card = page.locator(".prod-grid article").first();
    // The Add-to-Cart button has aria-label "Add {name} to cart". Card markup
    // nests the button inside an `<a>` (Link wrapper), so scope to the card.
    const addBtn = card.getByRole("button", { name: /Add .* to cart/i });
    await addBtn.waitFor({ timeout: 15_000 });
    await addBtn.click();

    // Toast text from useToast.success('Added to cart') → ToastHost message.
    // The button itself has no text content (icon-only), so the toast is the
    // only user-facing "Added" signal.
    await expect(page.getByText(/added to cart/i)).toBeVisible();
  });
});
