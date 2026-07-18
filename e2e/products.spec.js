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
    await expect(page.locator(".prod-grid")).toHaveCSS("grid-template-columns", /(^|\s)repeat\(4/);

    await page.setViewportSize({ width: 1100, height: 900 });
    await expect(page.locator(".prod-grid")).toHaveCSS("grid-template-columns", /(^|\s)repeat\(3/);

    await page.setViewportSize({ width: 600, height: 900 });
    await expect(page.locator(".prod-grid")).toHaveCSS("grid-template-columns", /(^|\s)repeat\(2/);
  });

  test("sort Price ascending reorders results", async ({ page }) => {
    await page.goto("/products?limit=12");
    // Wait for the grid + sort control to render — the MUI Select is only
    // mounted after products load.
    await page.locator(".prod-grid").first().waitFor({ timeout: 30_000 });
    // The MUI Select (TextField select) renders as role="combobox".
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /Price .* low to high/i }).click();
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
    await page.goto("/products?category=Mugs");

    // Active-filters region is a Box with role="region" aria-label="Active
    // filters". It only renders when at least one filter is active.
    const filtersRegion = page.getByRole("region", { name: /active filters/i });
    await expect(filtersRegion).toBeVisible();
    await expect(filtersRegion).toContainText(/Mugs/);

    // MUI Chip's delete icon button defaults to aria-label="Delete".
    await filtersRegion
      .getByRole("button", { name: /delete/i })
      .first()
      .click();
    await page.waitForURL((url) => !url.searchParams.has("category"));

    // Region is unmounted once no filters are active.
    await expect(page.getByRole("region", { name: /active filters/i })).toHaveCount(0);
  });

  test("mobile filter trigger expands panel", async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 });
    await page.goto("/products");

    // Mobile filter trigger is the Disclosure button ("Filters"). The desktop
    // sidebar (QuietFilter) is hidden at xs; on mobile the trigger button is
    // the only visible "Filters" button.
    const trigger = page.getByRole("button", { name: /^Filters$/ }).first();
    await expect(trigger).toBeVisible();

    // Before expanding, no category "All" option is rendered yet (Disclosure
    // panel starts closed).
    await expect(page.getByRole("button", { name: /^All$/ })).toHaveCount(0);

    await trigger.click();

    // After expanding the disclosure, the category options appear. FilterOption
    // renders as a `<button>` (not radio), so query by role/name.
    await expect(page.getByRole("button", { name: /^All$/ }).first()).toBeVisible();
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
    await expect(page.getByText(/added to cart/i)).toBeVisible();

    // Button briefly flips to "Added" (the visible label is "✓ Added").
    await expect(addBtn).toContainText(/Added/i);
  });
});
