const { test, expect } = require('@playwright/test');

test.describe('Cart (Basket) page', () => {
  test('empty cart shows empty state message', async ({ page }) => {
    await page.goto('/cart');
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 8000 });
    const emptyText = page
      .getByText(/your cart is empty/i)
      .or(page.getByText(/cart is empty/i))
      .first();
    await expect(emptyText).toBeVisible({ timeout: 8000 });
  });

  test('cart page does not crash', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000, });
  });
});

test.describe('Add to Cart flow', () => {
  test('clicking Add to Cart on PDP adds item', async ({ page }) => {
    await page.goto('/products');
    // Find an available product card — do NOT blindly use the first card,
    // which may be out-of-stock (disabled Add-to-Cart button).
    // iterate through product links and pick one whose card text does NOT say "Out of Stock".
    const productLinks = page.locator('a[href*="/product/"]');
    const count = await productLinks.count();
    let targetLink = null;
    for (let i = 0; i < count; i++) {
      const card = productLinks.nth(i);
      const cardText = await card.innerText();
      if (!/out of stock/i.test(cardText)) {
        targetLink = card;
        break;
      }
    }
    expect(targetLink).not.toBeNull('No in-stock product found on /products');
    await targetLink.waitFor({ timeout: 20000 });
    await targetLink.click();
    await page.waitForURL(/product/, { timeout: 15000 });
    const addToCart = page.getByRole('button', { name: /add to cart/i });
    await addToCart.waitFor({ timeout: 10000 });
    await addToCart.click();
    await expect(page.getByText(/added to cart/i).first()).toBeVisible({ timeout: 10000, });
  });
});
