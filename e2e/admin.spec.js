// @ts-check
const { test, expect } = require("@playwright/test");
const { loginViaUI } = require("./helpers/auth");

// ---------------------------------------------------------------------------
// Admin E2E Tests
// Covers: dashboard, product list, create-product form validation
// Requires TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD env vars
// ---------------------------------------------------------------------------

test.describe("Admin dashboard", () => {
  test.skip(
    !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD,
    "Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD env vars to run admin tests"
  );

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD);
  });

  test("admin can navigate to dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible({ timeout: 15000 });
  });

  test("admin products list renders", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page.getByRole("heading", { name: /products/i })).toBeVisible({ timeout: 15000 });
  });

  test("admin orders list renders", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page.getByRole("heading", { name: /orders/i })).toBeVisible({ timeout: 15000 });
  });

  test("admin users list renders", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible({ timeout: 15000 });
  });

  test.describe("Create Product form validation", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD);
      await page.goto("/admin/product/new");
    });

    test("create product page renders form", async ({ page }) => {
      await expect(page.getByLabel(/product name/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel(/price/i)).toBeVisible();
      await expect(page.getByLabel(/stock/i)).toBeVisible();
      await expect(page.getByLabel(/description/i)).toBeVisible();
    });

    test("shows error for empty product name on blur", async ({ page }) => {
      const nameInput = page.getByLabel(/product name/i);
      await nameInput.focus();
      await nameInput.blur();
      await expect(page.getByText(/name is required|product name/i)).toBeVisible();
    });

    test("shows error for negative price", async ({ page }) => {
      await page.getByLabel(/price/i).fill("-10");
      await page.getByLabel(/price/i).blur();
      await expect(page.getByText(/greater than 0|positive/i)).toBeVisible();
    });

    test("shows error for negative stock", async ({ page }) => {
      await page.getByLabel(/stock/i).fill("-1");
      await page.getByLabel(/stock/i).blur();
      await expect(page.getByText(/non-negative|stock/i)).toBeVisible();
    });

    test("shows error for short description", async ({ page }) => {
      await page.getByLabel(/description/i).fill("Too short");
      await page.getByLabel(/description/i).blur();
      await expect(page.getByText(/at least 20 characters/i)).toBeVisible();
    });

    test("submit button disabled when form invalid", async ({ page }) => {
      const submitBtn = page.getByRole("button", { name: /create|submit/i });
      await expect(submitBtn).toBeDisabled();
    });
  });
});
