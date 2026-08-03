"use strict";
/**
 * newFeatures.spec.js — E2E coverage for UX features shipped in 2026-07-30
 * to 2026-08-03 (Lenis, motion, mini-cart, scroll polish, mobile filters,
 * skeletons).
 *
 * Run with:
 *   npm run e2e e2e/newFeatures.spec.js
 * or (if backend + frontend already running):
 *   E2E_NO_WEBSERVER=1 npm run e2e e2e/newFeatures.spec.js
 *
 * Requires seeded products with stock > 0. Use e2e/helpers/adminSeed.js
 * to ensure stock before running.
 */

const { test, expect } = require("@playwright/test");
const { pickInStockProductCard } = require("./helpers/cartFlow");

// ─── Mini-cart drawer ───────────────────────────────────────────────────────

test.describe("Mini-cart drawer", () => {
  test("header cart icon opens empty drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^cart$/i }).first().click();
    await expect(page.getByRole("dialog", { name: /shopping cart/i })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/your bag is empty/i)).toBeVisible();
  });

  test("add-to-cart from PLP opens mini-cart drawer", async ({ page }) => {
    const card = await pickInStockProductCard(page);
    expect(card, "no in-stock product on /products").not.toBeNull();
    await card.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByRole("dialog", { name: /shopping cart/i })).toBeVisible({
      timeout: 5000,
    });
    // Drawer should show the added item (line total visible).
    await expect(page.getByText(/subtotal/i)).toBeVisible();
  });

  test("add-to-cart from PDP opens mini-cart drawer", async ({ page }) => {
    const card = await pickInStockProductCard(page);
    expect(card, "no in-stock product on /products").not.toBeNull();
    await card.click();
    await page.waitForURL(/\/product\//, { timeout: 15_000 });
    await page.getByRole("button", { name: /add to cart/i }).first().click();
    await expect(page.getByRole("dialog", { name: /shopping cart/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("mini-cart 'View bag' closes drawer and navigates to /cart", async ({ page }) => {
    const card = await pickInStockProductCard(page);
    expect(card, "no in-stock product on /products").not.toBeNull();
    await card.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByRole("dialog", { name: /shopping cart/i })).toBeVisible({
      timeout: 5000,
    });
    await page.getByRole("link", { name: /view bag/i }).click();
    await page.waitForURL(/\/cart$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /your bag|cart/i })).toBeVisible();
  });
});

// ─── Scroll-to-top button ───────────────────────────────────────────────────

test.describe("Scroll-to-top button", () => {
  test("hidden at top, visible after scroll, clicking returns to top", async ({ page }) => {
    await page.goto("/products");
    const btn = page.getByRole("button", { name: /scroll to top/i });
    await expect(btn).toHaveAttribute("tabindex", "-1", { timeout: 5000 });

    // Scroll past threshold.
    await page.evaluate(() => window.scrollTo(0, 1000));
    // Wait for lenis interpolation to settle.
    await page.waitForTimeout(500);
    await expect(btn).toHaveAttribute("tabindex", "0", { timeout: 5000 });

    // Click — should glide back to top.
    await btn.click();
    await page.waitForFunction(() => window.scrollY < 50, undefined, { timeout: 5000 });
  });
});

// ─── Scroll progress bar ────────────────────────────────────────────────────

test.describe("Scroll progress bar", () => {
  test("appears at top after route change", async ({ page }) => {
    await page.goto("/products");
    // Bar is a fixed element with aria-hidden, containing a child div with
    // a transform: scaleX inline style.
    const bar = page
      .locator("[aria-hidden]")
      .filter({ has: page.locator('[style*="scaleX"]') })
      .first();
    await expect(bar).toBeAttached({ timeout: 5000 });
    // After scrolling, the inner scaleX should be > 0.
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(300);
    const transform = await bar.locator("div").first().getAttribute("style");
    expect(transform).toMatch(/scaleX\((0\.[1-9]|1)/);
  });
});

// ─── PDP jump pills ─────────────────────────────────────────────────────────

test.describe("PDP jump pills", () => {
  test("jump-to-reviews scrolls to reviews section", async ({ page }) => {
    await page.goto("/products");
    const card = page.locator('a[href*="/product/"]').first();
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await page.waitForURL(/\/product\//, { timeout: 15_000 });

    // Scroll to the "The details" section.
    await page.locator("#pdp-details").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Click "Jump to reviews".
    await page.getByRole("button", { name: /jump to reviews/i }).click();

    // After click, the "Kept notes" heading should be near the top of
    // the viewport (within first 300px).
    await page.waitForTimeout(1200); // allow smooth scroll
    const keptNotes = page.getByRole("heading", { name: /kept notes/i });
    await expect(keptNotes).toBeVisible();
    const box = await keptNotes.boundingBox();
    expect(box, "kept notes heading should be in upper viewport").not.toBeNull();
    expect(box.y).toBeLessThan(300);
  });

  test("jump-to-details scrolls back from reviews", async ({ page }) => {
    await page.goto("/products");
    const card = page.locator('a[href*="/product/"]').first();
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await page.waitForURL(/\/product\//, { timeout: 15_000 });

    // Scroll to reviews.
    await page.locator("#pdp-reviews").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Click "Jump to details".
    await page.getByRole("button", { name: /jump to details/i }).click();
    await page.waitForTimeout(1200);

    const details = page.locator("#pdp-details");
    await expect(details).toBeVisible();
    const box = await details.boundingBox();
    expect(box, "pdp-details should be in upper viewport").not.toBeNull();
    expect(box.y).toBeLessThan(300);
  });
});

// ─── Mobile filter drawer ───────────────────────────────────────────────────

test.describe("Mobile filter drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12

  test("Filters button opens bottom-sheet drawer with content", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("button", { name: /^filters$/i }).first().click();
    const drawer = page.getByRole("dialog", { name: /filter products/i });
    await expect(drawer).toBeVisible({ timeout: 5000 });
    // Drawer should have Category + Price + Rating groups.
    await expect(drawer.getByText(/category/i).first()).toBeVisible();
    await expect(drawer.getByText(/price/i).first()).toBeVisible();
    await expect(drawer.getByText(/rating/i).first()).toBeVisible();
  });

  test("X button closes drawer", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("button", { name: /^filters$/i }).first().click();
    await expect(page.getByRole("dialog", { name: /filter products/i })).toBeVisible();
    await page.getByRole("button", { name: /close filters/i }).click();
    await expect(page.getByRole("dialog", { name: /filter products/i })).not.toBeVisible({
      timeout: 3000,
    });
  });
});

// ─── Loading skeletons ──────────────────────────────────────────────────────

test.describe("Loading skeletons", () => {
  test("PLP shows skeleton during initial load", async ({ page }) => {
    // Slow the network to ensure skeleton is visible.
    await page.route("**/api/v1/products**", async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.goto("/products");
    // MUI Skeleton renders as div with class containing "MuiSkeleton".
    const skeletons = page.locator(".MuiSkeleton-root");
    await expect(skeletons.first()).toBeVisible({ timeout: 5000 });
    // Should be 8+ skeletons for the card grid (image + 3 text lines per card).
    const count = await skeletons.count();
    expect(count).toBeGreaterThan(20);
  });
});
