const { test, expect } = require('@playwright/test');
const { loginViaUI } = require('./helpers/auth');

const USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const USER_PASS = process.env.TEST_USER_PASS || 'Test@1234';

test.describe('Shipping form', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, USER_EMAIL, USER_PASS);
    await page.goto('/shipping');
  });

  test('form renders all required fields', async ({ page }) => {
    await expect(page.getByLabel(/first name/i).first()).toBeVisible({ timeout: 8000, });
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/address/i)).toBeVisible();
    await expect(page.getByLabel(/city/i)).toBeVisible();
    await expect(page.getByLabel(/phone number/i)).toBeVisible();
    await expect(page.getByLabel(/zip/i).or(page.getByLabel(/postal/i))).toBeVisible();
    await expect(page.getByLabel(/country/i)).toBeVisible();
  });

  test('phone field shows validation error on blur for non-numeric', async ({ page, }) => {
    const phoneInput = page.getByLabel(/phone number/i).first();
    await phoneInput.fill('abcde');
    await phoneInput.blur();
    await expect(page.getByText(/10 digits/i).first()).toBeVisible({ timeout: 8000, });
  });

  test('phone field shows error for fewer than 10 digits', async ({ page }) => {
    const phoneInput = page.getByLabel(/phone number/i).first();
    await phoneInput.fill('12345');
    await phoneInput.blur();
    await expect(page.getByText(/10 digits/i).first()).toBeVisible({ timeout: 8000, });
  });

  test('address field shows error for too-short input', async ({ page }) => {
    const addressInput = page.getByLabel(/address/i).first();
    await addressInput.fill('Short');
    await addressInput.blur();
    await expect(page.getByText(/at least 10/i).first()).toBeVisible({ timeout: 8000, });
  });

  test('valid form allows proceeding to next step', async ({ page }) => {
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/address/i).fill('123 Main Street, Apt 4');
    await page.getByLabel(/city/i).fill('Berlin');
    await page.getByLabel(/phone number/i).fill('9876543210');
    const zipInput = page.getByLabel(/zip/i).or(page.getByLabel(/postal/i)).first();
    await zipInput.fill('10115');
    const countrySelect = page.getByLabel(/country/i).first();
    const tag = await countrySelect.evaluate((el) => el.tagName.toLowerCase());
    if (tag === 'select') {
      await countrySelect.selectOption({ index: 1 });
    }
    const continueBtn = page.getByRole('button', { name: /next/i });
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });
    await continueBtn.click();
    await page.waitForURL((url) => !url.pathname.includes('/shipping'), { timeout: 12000, });
  });
});
