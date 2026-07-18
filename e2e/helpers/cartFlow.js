// e2e/helpers/cartFlow.js
// Helpers to seed the Redux cart with at least one in-stock item.
// Required because the cart lives in client Redux (no backend persistence)
// and Shipping page redirects to /products when cart is empty.

const { ensureInStock } = require("./adminSeed");

async function pickInStockProductCard(page) {
  // Ensure backend has stock > 0 for some products before scanning.
  try {
    await ensureInStock(5);
  } catch {
    /* tolerated */
  }
  await page.goto("/products");
  const cards = page.locator('a[href*="/product/"]');
  await cards.first().waitFor({ timeout: 20_000 });
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const text = (await card.innerText()).toLowerCase();
    if (!text.includes("out of stock")) return card;
  }
  return null;
}

async function seedCartOnce(page) {
  // Ensure backend has stock before pick.
  try {
    await ensureInStock(3);
  } catch {
    /* tolerated */
  }
  const card = await pickInStockProductCard(page);
  if (!card) throw new Error("seedCartOnce: no in-stock product on /products");
  await card.click();
  await page.waitForURL(/\/product\//, { timeout: 15_000 });
  const addBtn = page.getByRole("button", { name: /add to cart/i }).first();
  await addBtn.waitFor({ timeout: 10_000 });
  // Bail if disabled (test-side OOS).
  const disabled = await addBtn.isDisabled().catch(() => false);
  if (disabled) throw new Error("seedCartOnce: PDP add-to-cart disabled");
  await addBtn.click();
  await page
    .getByText(/added to cart/i)
    .first()
    .waitFor({ timeout: 10_000 });
}

module.exports = { pickInStockProductCard, seedCartOnce };
