// e2e/auth.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Sign In page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
  });

  test('renders sign-in form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    // Use input#password directly — getByLabel(/password/i) also matches the
    // MUI "toggle password visibility" button, causing a strict-mode violation.
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation error for invalid email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('notvalid');
    await page.getByLabel(/email/i).blur();
    await expect(
      page.getByText(/valid email|enter a valid email|invalid email/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows validation error for short password', async ({ page }) => {
    await page.locator('input#password').fill('123');
    await page.locator('input#password').blur();
    await expect(
      page.getByText(/password must be/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.locator('input#password').fill('Wrong@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(
      page.getByText(/invalid email or password/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('has link to sign up page', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /sign up|register/i })
    ).toBeVisible();
  });
});

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('renders register form', async ({ page }) => {
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });

  test('shows name validation error', async ({ page }) => {
    await page.getByLabel(/name/i).fill('');
    await page.getByLabel(/name/i).blur();
    await expect(
      page.getByText(/name is required|name must/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows email validation error', async ({ page }) => {
    await page.getByLabel(/email/i).fill('bademail');
    await page.getByLabel(/email/i).blur();
    await expect(
      page.getByText(/valid email|enter a valid email|invalid email/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows password validation error', async ({ page }) => {
    await page.locator('input#password').fill('weak');
    await page.locator('input#password').blur();
    await expect(
      page.getByText(/password must be/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('sign up button disabled until form valid and avatar uploaded', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /sign up|register/i });
    await expect(submitBtn).toBeDisabled();
  });

  test('has link back to sign in', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /sign in|log in/i })
    ).toBeVisible();
  });
});

test.describe('Forgot Password page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/password/forgot');
  });

  test('renders forgot password form', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('shows error for invalid email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('notvalid');
    await page.getByLabel(/email/i).blur();
    await expect(
      page.getByText(/valid email|enter a valid email|invalid email/i).first()
    ).toBeVisible({ timeout: 8000 });
  });
});
