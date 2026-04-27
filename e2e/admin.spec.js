// e2e/admin.spec.js
const { test, expect } = require('@playwright/test');
const { loginViaUI } = require('./helpers/auth');

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || 'Admin@1234';

test.describe('Admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS);
  });

  test('admin can navigate to dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(
      page
        .getByRole('heading', { name: /dashboard/i })
        .or(page.getByText(/total orders|revenue|users/i).first())
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('admin products list renders', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(
      page
        .getByRole('heading', { name: /products/i })
        .or(page.locator('table, .MuiTable-root').first())
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('admin orders list renders', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(
      page
        .getByRole('heading', { name: /orders/i })
        .or(page.locator('table, .MuiTable-root').first())
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('admin users list renders', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(
      page
        .getByRole('heading', { name: /users/i })
        .or(page.locator('table, .MuiTable-root').first())
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  test.describe('Create Product form validation', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS);
      await page.goto('/admin/product/new');
    });

    test('create product page renders form', async ({ page }) => {
      await expect(
        page.getByLabel(/name|product name/i).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test('shows error for empty product name on blur', async ({ page }) => {
      const nameInput = page.getByLabel(/name|product name/i).first();
      await nameInput.fill('');
      await nameInput.blur();
      await expect(
        page.getByText(/name is required|product name.*required/i).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test('shows error for negative price', async ({ page }) => {
      const priceInput = page.getByLabel(/price/i).first();
      await priceInput.fill('-10');
      await priceInput.blur();
      await expect(
        page
          .getByText(/price.*positive|must be.*greater|invalid price/i)
          .first()
      ).toBeVisible({ timeout: 8000 });
    });

    test('shows error for negative stock', async ({ page }) => {
      const stockInput = page.getByLabel(/stock/i).first();
      await stockInput.fill('-5');
      await stockInput.blur();
      await expect(
        page
          .getByText(/stock.*positive|must be.*greater|invalid stock/i)
          .first()
      ).toBeVisible({ timeout: 8000 });
    });

    test('shows error for short description', async ({ page }) => {
      const desc = page.getByLabel(/description/i).first();
      await desc.fill('hi');
      await desc.blur();
      await expect(
        page.getByText(/description.*longer|at least|too short/i).first()
      ).toBeVisible({ timeout: 8000 });
    });

    test('submit button disabled when form invalid', async ({ page }) => {
      const submitBtn = page.getByRole('button', {
        name: /create|submit|add product/i,
      });
      await expect(submitBtn).toBeDisabled({ timeout: 8000 });
    });
  });
});
