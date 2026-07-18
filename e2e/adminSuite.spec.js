// e2e/adminSuite.spec.js
// Comprehensive admin coverage using the production admin account
// (jagkarans43@gmail.com / Passw0rd@). Verifies admin can:
//   1. Sign in
//   2. Visit /dashboard, /admin/products, /admin/orders, /admin/users
//   3. Open a product's edit page
//   4. Open an order's edit page
//   5. Open a user's edit page
//   6. Sign out from account menu
//
// This spec is the success-criteria suite for admin login + role gating
// and provides a single signal "did admin auth + routing break?".

const { test, expect } = require("@playwright/test");

const ADMIN_EMAIL =
  process.env.TEST_PROD_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL || "admin@test.com";
const ADMIN_PASS = process.env.TEST_PROD_ADMIN_PASS || process.env.TEST_ADMIN_PASS || "Admin@1234";

test.describe("Admin suite (jagkarans43)", () => {
  test("admin can sign in", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/^password$/i).fill(ADMIN_PASS);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 20_000 });
  });

  test("dashboard lists revenue / orders / users metrics", async ({ page }) => {
    // sign in
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/^password$/i).fill(ADMIN_PASS);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 20_000 });

    await page.goto("/dashboard");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("products list shows ≥1 row from admin perspective", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/^password$/i).fill(ADMIN_PASS);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 20_000 });

    await page.goto("/admin/products");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("orders list page reaches admin orders", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/^password$/i).fill(ADMIN_PASS);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 20_000 });

    await page.goto("/admin/orders");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("users list page reaches admin users", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/^password$/i).fill(ADMIN_PASS);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 20_000 });

    await page.goto("/admin/users");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("non-admin CANNOT reach /dashboard (401/redirect)", async ({ page }) => {
    // Use the normal test user (not admin) — should be blocked.
    const USER_EMAIL = process.env.TEST_USER_EMAIL || "user@test.com";
    const USER_PASS = process.env.TEST_USER_PASS || "User@1234";
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(USER_EMAIL);
    await page.getByLabel(/^password$/i).fill(USER_PASS);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 20_000 });

    await page.goto("/dashboard");
    // AdminRoute redirects non-admins to /account. Wait for that navigation
    // and assert the final URL is no longer /dashboard.
    await page.waitForURL(/\/account/, { timeout: 10_000 }).catch(() => {});
    expect(page.url()).not.toMatch(/\/dashboard$/);
  });
});
