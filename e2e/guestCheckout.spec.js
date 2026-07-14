const { test, expect } = require("@playwright/test");

test("guest happy path places order + claim converts to user", async ({ page, request }) => {
  await page.goto("/");
  // Assume seed has a product and cart is empty — add to cart through API or UI
  await page.goto("/products");
  await page.getByRole("button", { name: /add to cart/i }).first().click();
  await page.goto("/cart");
  await page.getByRole("link", { name: /checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByRole("button", { name: /continue as guest/i }).click();
  await page.getByLabel(/email/i).fill(`g_${Date.now()}@example.com`);
  await page.getByLabel(/full name/i).fill("Guest Buyer");
  await page.getByLabel(/address line 1/i).fill("1 Test St");
  await page.getByLabel(/city/i).fill("Testville");
  await page.getByLabel(/state/i).fill("TS");
  await page.getByLabel(/postal|zip/i).fill("12345");
  await page.getByLabel(/country/i).selectOption("US");
  await page.getByLabel(/phone/i).fill("4155551234");
  await page.getByPlaceholder(/card/i).fill("4242424242424242");
  await page.getByPlaceholder(/exp/i).fill("12/30");
  await page.getByPlaceholder(/cvc/i).fill("123");
  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page).toHaveURL(/\/success/);
  const url = page.url();
  const token = new URL(url).searchParams.get("token");
  expect(token).toMatch(/^[0-9a-f]{64}$/);

  await page.getByLabel(/password/i).fill("passw0rd!");
  await page.getByRole("button", { name: /save my details/i }).click();
  await expect(page).toHaveURL(/\/(orders|myorders)/);

  // Verify cookie via API
  const ctx = page.context();
  const cookies = await ctx.cookies();
  expect(cookies.find((c) => c.name === "token")).toBeDefined();

  // Verify order shows in /orders
  await page.goto("/orders");
  await expect(page.getByText(/1 test st|Testville|TS/).first()).toBeVisible();
});

test("auth user skips guest CTA + email pre-filled", async ({ page }) => {
  await page.goto("/signin");
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL || "user@e2e.io");
  await page.getByLabel(/password/i).fill(process.env.E2E_USER_PW || "passw0rd!");
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.goto("/cart");
  await page.getByRole("link", { name: /checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("button", { name: /continue as guest/i })).toBeHidden();
  await expect(page.getByLabel(/email/i)).not.toHaveValue("");
});
