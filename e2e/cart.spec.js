const { test, expect } = require("@playwright/test");
const { pickInStockProductCard, seedCartOnce } = require("./helpers/cartFlow");

test.describe("Cart (Basket) page", () => {
  test("empty cart shows empty state message", async ({ page }) => {
    await page.goto("/cart");
    const main = page.locator("main").first();
    await expect(main).toBeVisible({ timeout: 8000 });
    const emptyText = page
      .getByText(/your bag is empty/i)
      .or(page.getByText(/cart is empty/i))
      .first();
    await expect(emptyText).toBeVisible({ timeout: 8000 });
  });

  test("cart page does not crash", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Add to Cart flow", () => {
  test("clicking Add to Cart on PDP adds item", async ({ page }) => {
    test.setTimeout(60_000);
    const targetLink = await pickInStockProductCard(page);
    expect(targetLink, "No in-stock product found on /products").not.toBeNull();
    await targetLink.waitFor({ timeout: 20000 });
    await targetLink.click();
    await page.waitForURL(/product/, { timeout: 15000 });
    const addToCart = page.getByRole("button", { name: /add to cart/i });
    await addToCart.waitFor({ timeout: 10000 });
    await addToCart.click();
    await expect(page.getByText(/added to cart/i).first()).toBeVisible({ timeout: 10000 });
  });
});
