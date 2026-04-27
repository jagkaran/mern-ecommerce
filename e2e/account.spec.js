// e2e/account.spec.js
const { test, expect } = require('@playwright/test');
const { loginViaUI } = require('./helpers/auth');

const USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const USER_PASS = process.env.TEST_USER_PASS || 'Test@1234';

test.describe('Account page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, USER_EMAIL, USER_PASS);
    await page.goto('/me');
  });

  test('account page renders user info', async ({ page }) => {
    await expect(
      page
        .getByText(new RegExp(USER_EMAIL, 'i'))
        .or(page.getByRole('heading', { name: /profile|account|my profile/i }))
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('update password page renders', async ({ page }) => {
    await page.goto('/password/update');
    await expect(
      page
        .locator(
          'input[name="oldPassword"], input[id*="old"], input[placeholder*="old" i]'
        )
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("update password shows error if new passwords don't match", async ({
    page,
  }) => {
    await page.goto('/password/update');
    const newPass = page
      .locator('input[name="newPassword"], input[id*="new"]')
      .first();
    const confirmPass = page
      .locator('input[name="confirmPassword"], input[id*="confirm"]')
      .first();
    await newPass.fill('NewPass@1234');
    await confirmPass.fill('DifferentPass@999');
    await confirmPass.blur();
    await expect(
      page
        .getByText(/passwords do not match|password mismatch|must match/i)
        .first()
    ).toBeVisible({ timeout: 8000 });
  });
});
