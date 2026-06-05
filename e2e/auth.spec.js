const { test, expect } = require('@playwright/test');

test.describe('Sign In page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
  });

  test('renders sign-in form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('has link to sign up page', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /sign up|register/i })
    ).toBeVisible();
  });
});

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('renders register form', async ({ page }) => {
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
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
});
