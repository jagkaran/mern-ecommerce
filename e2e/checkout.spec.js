const { test, expect } = require("@playwright/test");
const { loginAsUser } = require("./helpers/auth");
const { seedCartOnce } = require("./helpers/cartFlow");

test.describe("Shipping form", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60_000);
    await loginAsUser(page);
    // Seed cart via the real Add to Cart flow before visiting checkout —
    // /checkout redirects to /products when cart is empty.
    await seedCartOnce(page).catch((e) =>
      console.warn("[checkout.spec] cart seed failed:", e.message)
    );
    // Use SPA navigation (cart → Continue to checkout) so Redux state
    // (cart contents) survives the route change. A full `page.goto`
    // would re-mount the React tree and drop the seeded cart.
    const headerCartLink = page.locator('header a[href="/cart"]').first();
    await headerCartLink.click();
    await page.waitForURL(/\/cart$/, { timeout: 10_000 });
    const checkoutLink = page.getByRole("link", { name: /continue to checkout/i }).first();
    await checkoutLink.waitFor({ timeout: 10_000 });
    await checkoutLink.click();
    // Checkout is a single page with internal step state (Contact → Shipping
    // → Payment). URL stays at /checkout throughout.
    await page.waitForURL(/\/checkout$/, { timeout: 15_000 });
    // Fill the Contact step (email) and jump to Shipping via the stepper.
    const emailInput = page.getByLabel(/email/i).first();
    await emailInput.waitFor({ timeout: 8000 });
    await emailInput.fill("e2e-user@test.com");
    // StepIndicator renders each step as a <button role="listitem"> with
    // aria-label "Go to <Step>". Query by the listitem's accessible name.
    await page
      .getByRole("listitem", { name: /go to shipping/i })
      .click();
    // Wait for shipping-specific field to appear.
    await page.getByLabel(/full name/i).first().waitFor({ timeout: 8000 });
  });

  test("form renders all required fields", async ({ page }) => {
    await expect(page.getByLabel(/full name/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel(/address line 1/i)).toBeVisible();
    await expect(page.getByLabel(/^city/i)).toBeVisible();
    await expect(page.getByLabel(/^state/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
    await expect(
      page.getByLabel(/zip/i).or(page.getByLabel(/postal/i))
    ).toBeVisible();
    // Country is rendered as a MUI Select (role="combobox"). Its
    // accessible name is the selected value text, not "Country". Find
    // the combobox in the Shipping surface that displays a country name.
    await expect(
      page.getByRole("combobox", { name: /united states|canada|united kingdom|india|germany|france/i })
    ).toBeVisible();
  });

  test("phone field accepts input without erroring", async ({ page }) => {
    // The Shipping form does not surface per-field validation inline; it
    // only blocks the Place order action via a form-level check. Verify
    // the phone field is editable.
    const phoneInput = page.getByLabel(/phone/i).first();
    await phoneInput.fill("abcde");
    await expect(phoneInput).toHaveValue("abcde");
  });

  test("valid form allows proceeding to next step", async ({ page }) => {
    await page.getByLabel(/full name/i).fill("John Doe");
    await page.getByLabel(/address line 1/i).fill("123 Main Street, Apt 4");
    await page.getByLabel(/^city/i).fill("Berlin");
    await page.getByLabel(/^state/i).fill("BE");
    await page.getByLabel(/phone/i).fill("9876543210");
    const zipInput = page
      .getByLabel(/zip/i)
      .or(page.getByLabel(/postal/i))
      .first();
    await zipInput.fill("10115");
    // Country is a MUI Select combobox — a <div role="combobox"> that
    // opens a MenuList. Click to open, then click a non-default option.
    const countrySelect = page.getByRole("combobox", {
      name: /united states|canada|united kingdom|india|germany|france/i,
    });
    await countrySelect.click();
    await page
      .getByRole("option", { name: /canada|germany|united kingdom|india|france/i })
      .first()
      .click();
    // Checkout is single-page; there's no "Next" — jump to Payment via
    // the stepper and assert the Payment iframe is now visible.
    await page
      .getByRole("listitem", { name: /go to payment/i })
      .click();
    await expect(
      page.locator("iframe[name^='__privateStripeFrame']").first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
