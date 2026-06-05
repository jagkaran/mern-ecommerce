const { test, expect } = require('@playwright/test');
const { loginViaUI } = require('./helpers/auth');

const USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const USER_PASS = process.env.TEST_USER_PASS || 'Test@1234';

test.describe('Account page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, USER_EMAIL, USER_PASS);
    await page.goto('/account');
  });

  test('account page renders user info', async ({ page }) => {
    await expect(page.getByLabel(/email address/i).first()).toBeVisible({ timeout: 8000, });
  });

  test('update password page renders', async ({ page }) => {
    await page.goto('/password/update');
    await expect(page.getByLabel(/old password/i).first()).toBeVisible({ timeout: 8000, });
  });

  test("update password shows error if new passwords don't match", async ({ page, }) => {
    await page.goto('/password/update');
    await page.getByLabel(/old password/i).fill('oldpass123');
    await page.getByLabel(/new password/i).fill('newpass123');
    const confirmField = page.getByLabel(/confirm password/i);
    await confirmField.fill('mismatchpass');
    await confirmField.blur();
    await page.getByRole('button', { name: /update/i }).click();
    await expect(page.getByText(/passwords do not match/i).first()).toBeVisible({ timeout: 8000, });
  });
});
