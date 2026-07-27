const { test, expect } = require("@playwright/test");
const { seedCartOnce } = require("./helpers/cartFlow");

test("guest happy path places order + claim converts to user", async ({ page, request }) => {
  await page.goto("/");
  // Assume seed has a product and cart is empty — add to cart through API or UI
  await page.goto("/products");
  // Product cards expose "Add {name} to cart" via aria-label on the per-card
  // button. The literal "add to cart" only matches the PDP button; on the
  // listing we need a regex that accepts the per-card aria-label shape.
  await page.getByRole("button", { name: /add .* to cart/i }).first().click();
  await page.goto("/cart");
  await page.getByRole("link", { name: /checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByRole("button", { name: /continue as guest/i }).click();
  await page.getByLabel(/email/i).fill(`g_${Date.now()}@example.com`);
  // Advance to Shipping step via the stepper.
  await page.getByRole("listitem", { name: /go to shipping/i }).click();
  await page.getByLabel(/full name/i).fill("Guest Buyer");
  await page.getByLabel(/address line 1/i).fill("1 Test St");
  await page.getByLabel(/^city/i).fill("Testville");
  // "State" is too broad — "State/Region" field and others. Use a regex
  // that matches the field's actual accessible name.
  await page.getByLabel(/state\s*\/\s*region/i).fill("TS");
  await page.getByLabel(/postal|zip/i).fill("12345");
  // Country is a MUI Select combobox. Click to open, then click the option.
  const countryCombobox = page
    .getByRole("combobox", { name: /united states|canada|united kingdom|india|germany|france/i })
    .first();
  await countryCombobox.click();
  await page.getByRole("option", { name: /united states/i }).click();
  await page.getByLabel(/phone/i).fill("4155551234");
  // Advance to Payment step via the stepper before filling card.
  await page.getByRole("listitem", { name: /go to payment/i }).click();
  // Stripe renders the card form inside an iframe — switch to it.
  const stripeFrame = page.frameLocator("iframe[name^='__privateStripeFrame']").first();
  await stripeFrame.locator('input[placeholder="Card number"]').fill("4242424242424242");
  await stripeFrame.locator('input[placeholder="MM / YY"]').fill("12/30");
  await stripeFrame.locator('input[placeholder="CVC"]').fill("123");
  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page).toHaveURL(/\/success/);
  const url = page.url();
  const token = new URL(url).searchParams.get("token");
  expect(token).toMatch(/^[0-9a-f]{64}$/);

  await page.getByLabel(/password/i).fill("passw0rd!");
  await page.getByRole("button", { name: /save my details/i }).click();
  // Claim endpoint sets the JWT cookie. Wait for the cookie before
  // asserting the post-claim URL — the navigate("/myorders") call can
  // race with the cookie write.
  const ctx = page.context();
  await expect
    .poll(async () => (await ctx.cookies()).some((c) => c.name === "token"))
    .toBe(true, { timeout: 10_000 });

  // Verify order shows in /orders
  // /orders 404s; the actual route is /myorders.
  await page.goto("/myorders");
  await expect(
    page.getByRole("heading", { name: /kept pieces/i })
  ).toBeVisible({ timeout: 10_000 });
});

test("auth user skips guest CTA + email pre-filled", async ({ page }) => {
  await page.goto("/signin");
  const SignInPage = require("./pages/SignInPage");
  const signIn = new SignInPage(page);
  // Use the seeded test user (TEST_USER_EMAIL in .env.e2e). Fall back to
  // the POM defaults only if env is missing — the .env.e2e values are
  // the actual seeded credentials the backend recognises.
  await signIn.fillCredentials(
    process.env.TEST_USER_EMAIL || "user@test.com",
    process.env.TEST_USER_PASS || "User@1234"
  );
  await signIn.submit();
  // Seed the cart via the real Add to Cart flow so the cart page shows
  // the "Continue to checkout" CTA.
  await seedCartOnce(page);
  await page.goto("/cart");
  await page.getByRole("link", { name: /continue to checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  // For an auth user, the "Continue as guest" CTA is hidden once the
  // /api/v1/me fetch completes. Wait for the email field to be prefilled
  // (ContactBlock's auth effect) as the signal that the user state is
  // loaded. Allow 20s for the initial /me + state propagation.
  const emailInput = page.getByLabel(/email/i);
  await expect(emailInput).not.toHaveValue("", { timeout: 20_000 });
  await expect(
    page.getByRole("button", { name: /continue as guest/i })
  ).toBeHidden();
});
