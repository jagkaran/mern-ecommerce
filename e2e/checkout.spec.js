// e2e/checkout.spec.js
const { test, expect } = require('@playwright/test');
const { loginViaUI } = require('./helpers/auth');

const USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const USER_PASS = process.env.TEST_USER_PASS || 'Test@1234';

test.describe('Shipping form validation', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, USER_EMAIL, USER_PASS);
    await page.goto('/shipping');
  });

  test('shipping form renders all required fields', async ({ page }) => {
    await expect(
      page.getByLabel(/address/i).first()
    ).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel(/city/i)).toBeVisible();
    await expect(page.getByLabel(/phone|mobile/i).first()).toBeVisible();
    await expect(page.getByLabel(/postal|zip|pin/i).first()).toBeVisible();
    await expect(page.getByLabel(/country/i).first()).toBeVisible();
  });

  test('phone field rejects non-numeric input', async ({ page }) => {
    const phoneInput = page.getByLabel(/phone|mobile/i).first();
    await phoneInput.fill('abcde');
    await phoneInput.blur();
    await expect(
      page
        .getByText(/numeric|digits only|invalid phone|numbers only/i)
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('phone field rejects less than 10 digits', async ({ page }) => {
    const phoneInput = page.getByLabel(/phone|mobile/i).first();
    await phoneInput.fill('12345');
    await phoneInput.blur();
    await expect(
      page
        .getByText(/10 digit|must be 10|at least 10|invalid phone/i)
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('address field rejects less than 10 characters', async ({ page }) => {
    const addressInput = page.getByLabel(/address/i).first();
    await addressInput.fill('Short');
    await addressInput.blur();
    await expect(
      page.getByText(/at least 10|minimum 10|address must/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('valid form allows proceeding to next step', async ({ page }) => {
    await page.getByLabel(/address/i).first().fill('123 Main Street, Apt 4');
    await page.getByLabel(/city/i).fill('Berlin');
    await page.getByLabel(/phone|mobile/i).first().fill('9876543210');
    await page.getByLabel(/postal|zip|pin/i).first().fill('10115');

    const country = page.getByLabel(/country/i).first();
    const tagName = await country.evaluate((el) => el.tagName.toLowerCase());
    if (tagName === 'select') {
      await country.selectOption({ index: 1 });
    } else {
      await country.fill('Germany');
    }

    const continueBtn = page.getByRole('button', {
      name: /continue|next|proceed/i,
    });
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });
    await continueBtn.click();
    await page.waitForURL(
      (url) => !url.pathname.includes('/shipping'),
      { timeout: 10000 }
    );
  });
});
