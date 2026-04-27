// e2e/product.spec.js
const { test, expect } = require('@playwright/test');

// Helper: navigate to the first product in the listing and return its PDP URL.
async function goToPDP(page) {
  await page.goto('/products');
  const firstCard = page
    .locator('.MuiCard-root a, .MuiCardActionArea-root')
    .first();
  // Raised to 20 s — API response can be slow in dev
  await firstCard.waitFor({ timeout: 20000 });
  await firstCard.click();
  await page.waitForURL(/product/, { timeout: 15000 });
  return page.url();
}

test.describe('Home page', () => {
  test('loads and shows product cards', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.locator('.MuiCard-root').first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('header is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
  });
});

test.describe('Products listing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('renders products page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /products|all products/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows product cards', async ({ page }) => {
    await expect(
      page.locator('.MuiCard-root').first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('search by keyword navigates correctly', async ({ page }) => {
    const searchInput = page.getByRole('textbox').first();
    await searchInput.fill('phone');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/phone/, { timeout: 10000 });
  });
});

test.describe('Search page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
  });

  test('renders search input', async ({ page }) => {
    await expect(
      page.getByRole('textbox').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('searching submits and navigates to products', async ({ page }) => {
    const input = page.getByRole('textbox').first();
    await input.waitFor({ timeout: 10000 });
    await input.fill('phone');
    await input.press('Enter');
    await expect(page).toHaveURL(/products.*phone|phone/, { timeout: 15000 });
  });
});

test.describe('Product Detail Page (PDP)', () => {
  // Fix: resolve the PDP URL once in beforeAll so every test below can jump
  // directly to the known URL instead of re-navigating through /products each
  // time (which was timing out on the slow API call).
  let pdpUrl;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    pdpUrl = await goToPDP(page);
    await page.close();
  });

  test('PDP loads product name', async ({ page }) => {
    await page.goto(pdpUrl);
    await expect(page.getByRole('heading').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('PDP shows price', async ({ page }) => {
    await page.goto(pdpUrl);
    await expect(
      page.getByText(/\u20B9|\$|rs\.|price/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('PDP shows Add to Cart button', async ({ page }) => {
    await page.goto(pdpUrl);
    await expect(
      page.getByRole('button', { name: /add to cart/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('review section is present', async ({ page }) => {
    await page.goto(pdpUrl);
    await expect(
      page.getByText(/review|rating/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('REGRESSION: review date is not empty', async ({ page }) => {
    await page.goto(pdpUrl);
    const dates = await page
      .locator('[data-testid="review-date"], .review-date')
      .allTextContents();
    for (const d of dates) {
      expect(d.trim()).not.toBe('');
    }
  });
});
