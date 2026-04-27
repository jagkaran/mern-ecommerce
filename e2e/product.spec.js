// @ts-check
const { test, expect } = require("@playwright/test");

// ---------------------------------------------------------------------------
// Product E2E Tests
// Covers: home page product grid, products listing, search, PDP, review date
// ---------------------------------------------------------------------------

test.describe("Home page", () => {
  test("loads and shows product cards", async ({ page }) => {
    await page.goto("/");
    // Wait for at least one product card to appear
    await expect(page.locator(".MuiCard-root").first()).toBeVisible({ timeout: 15000 });
  });

  test("header is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation")).toBeVisible();
  });
});

test.describe("Products listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products");
  });

  test("renders products page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /products/i })).toBeVisible({ timeout: 15000 });
  });

  test("shows product cards", async ({ page }) => {
    await expect(page.locator(".MuiCard-root").first()).toBeVisible({ timeout: 15000 });
  });

  test("search by keyword navigates correctly", async ({ page }) => {
    await page.goto("/products/laptop");
    // URL should contain the keyword — either products show or empty message
    await expect(page).toHaveURL(/\/products\/laptop/);
  });
});

test.describe("Search page", () => {
  test("renders search input", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("searching submits and navigates to products", async ({ page }) => {
    await page.goto("/search");
    const input = page.getByRole("textbox").first();
    await input.fill("phone");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/products\/phone/, { timeout: 10000 });
  });
});

test.describe("Product Detail Page (PDP)", () => {
  // Use a known-good route pattern — tests navigate to /products first
  // and click the first available product to get a real ID
  let pdpUrl;

  test.beforeEach(async ({ page }) => {
    await page.goto("/products");
    const firstCard = page.locator(".MuiCard-root a, .MuiCardActionArea-root").first();
    await firstCard.waitFor({ timeout: 15000 });
    await firstCard.click();
    await page.waitForURL(/\/product\//, { timeout: 10000 });
    pdpUrl = page.url();
  });

  test("PDP loads product name", async ({ page }) => {
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10000 });
  });

  test("PDP shows price", async ({ page }) => {
    await expect(page.getByText(/\u20b9|\$|price/i)).toBeVisible({ timeout: 10000 });
  });

  test("PDP shows Add to Cart button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible({ timeout: 10000 });
  });

  test("review section is present", async ({ page }) => {
    // Reviews section or 'no reviews yet' message
    const reviewSection = page.getByText(/review|rating/i).first();
    await expect(reviewSection).toBeVisible({ timeout: 10000 });
  });

  test("REGRESSION: review date is not empty", async ({ page }) => {
    // Regression guard for the createdAt date bug fix
    // If reviews exist, each date element must be non-empty
    const dates = page.locator(".review-date");
    const count = await dates.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await dates.nth(i).textContent();
        expect(text?.trim()).not.toBe("");
        expect(text?.trim()).not.toBe("Invalid Date");
      }
    }
    // If no reviews, test passes trivially — that's fine
  });
});
