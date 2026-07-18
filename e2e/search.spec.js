// e2e/search.spec.js
// Search flow: Header Search icon → /search → fill input + submit →
// /products/:keyword results grid renders with at least one product card.

const { test, expect } = require("@playwright/test");

test.describe("Search flow", () => {
  test("/search renders headline + empty search form", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder(/search a product/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /look through the shelves/i })).toBeVisible();
  });

  test("Header search icon routes to /search", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
    // Header exposes /search as an IconButton-link (no accessible name),
    // so locate by href rather than role+name.
    const searchLink = page.locator('a[href="/search"]').first();
    await expect(searchLink).toBeVisible({ timeout: 10_000 });
    await searchLink.click();
    await page.waitForURL(/\/search$/, { timeout: 10_000 });
  });

  test("submitting a query navigates to /products/:keyword and renders results", async ({
    page,
  }) => {
    await page.goto("/search");
    const input = page.getByPlaceholder(/search a product/i);
    await expect(input).toBeVisible({ timeout: 10_000 });

    // Single-char query "a" matches nearly every product (Apparel, Footwear, etc.).
    await input.fill("a");
    await input.press("Enter");

    await page.waitForURL(/\/products\//, { timeout: 10_000 });
    await expect(page.locator('a[href*="/product/"]').first()).toBeVisible({ timeout: 10_000 });
  });
});
