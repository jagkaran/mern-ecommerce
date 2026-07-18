// e2e/admin.spec.js
// Admin reachability checks across dashboard / products / orders / users +
// Create Product form validation. Uses TEST_ADMIN_EMAIL + TEST_ADMIN_PASS
// from .env.e2e (defaults to admin@test.com / Admin@1234).

const { test, expect } = require("@playwright/test");
const { loginAsAdmin } = require("./helpers/auth");
const { ensureInStock } = require("./helpers/adminSeed");

test.describe("Admin dashboard", () => {
  test.beforeAll(async () => {
    try {
      await ensureInStock(5);
    } catch (e) {
      console.warn("[admin.spec] ensureInStock failed:", e.message);
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin can navigate to dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("admin products list renders", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("admin orders list renders", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("admin users list renders", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test.describe("Create Product form validation", () => {
    // Parent beforeEach already logs in as admin. Just navigate to the form.
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/product/new");
    });

    test("create product page renders form", async ({ page }) => {
      await expect(page.getByLabel(/name|product name/i).first()).toBeVisible({ timeout: 8000 });
    });

    test("shows error for empty product name on blur", async ({ page }) => {
      const nameInput = page.getByLabel(/name|product name/i).first();
      await nameInput.fill("");
      await nameInput.blur();
      await expect(
        page.getByText(/Product name must be at least 3 characters/i).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test("shows error for negative price", async ({ page }) => {
      const priceInput = page.getByLabel(/price/i).first();
      await priceInput.fill("-10");
      await priceInput.blur();
      await expect(page.getByText(/Price must be greater than 0/i).first()).toBeVisible({
        timeout: 8000,
      });
    });

    test("shows error for negative stock", async ({ page }) => {
      const stockInput = page.getByLabel(/stock/i).first();
      await stockInput.fill("-5");
      await stockInput.blur();
      await expect(
        page.getByText(/Stock must be a non-negative whole number/i).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test("shows error for short description", async ({ page }) => {
      const desc = page.getByLabel(/description/i).first();
      await desc.fill("hi");
      await desc.blur();
      await expect(
        page.getByText(/Description must be at least 20 characters/i).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test("submit button disabled when form invalid", async ({ page }) => {
      const submitBtn = page.getByRole("button", {
        name: /create|submit|add product/i,
      });
      await expect(submitBtn).toBeDisabled({ timeout: 8000 });
    });
  });
});
