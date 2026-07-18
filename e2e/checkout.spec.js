const { test, expect } = require("@playwright/test");
const { loginAsUser } = require("./helpers/auth");
const { seedCartOnce } = require("./helpers/cartFlow");

test.describe("Shipping form", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60_000);
    await loginAsUser(page);
    // Seed cart via the real Add to Cart flow before visiting /shipping —
    // Shipping redirects to /products when cart is empty.
    await seedCartOnce(page).catch((e) =>
      console.warn("[checkout.spec] cart seed failed:", e.message)
    );
    // Use SPA navigation (cart → Continue to checkout) so Redux state
    // (cart contents) survives the route change. A full `page.goto`
    // would re-mount the React tree and drop the seeded cart.
    // Click the Header "Cart" link (React Router Link) to enter /cart
    // without a hard reload, then click "Continue to checkout" in-app.
    const headerCartLink = page.locator('header a[href="/cart"]').first();
    await headerCartLink.click();
    await page.waitForURL(/\/cart$/, { timeout: 10_000 });
    const checkoutLink = page.getByRole("link", { name: /continue to checkout/i }).first();
    await checkoutLink.waitFor({ timeout: 10_000 });
    await checkoutLink.click();
    await page.waitForURL(/\/shipping/, { timeout: 15_000 });
  });

  test("form renders all required fields", async ({ page }) => {
    await expect(page.getByLabel(/first name/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/address/i)).toBeVisible();
    await expect(page.getByLabel(/city/i)).toBeVisible();
    await expect(page.getByLabel(/phone number/i)).toBeVisible();
    await expect(page.getByLabel(/zip/i).or(page.getByLabel(/postal/i))).toBeVisible();
    await expect(page.getByLabel(/country/i)).toBeVisible();
  });

  test("phone field accepts input without erroring", async ({ page }) => {
    // The Shipping form does not surface per-field validation inline; it
    // only blocks step transition via the isFormEmpty form-level check.
    // Verify the phone field is editable and the form is still on step 1.
    const phoneInput = page.getByLabel(/phone number/i).first();
    await phoneInput.fill("abcde");
    await expect(phoneInput).toHaveValue("abcde");
    await expect(page.getByRole("button", { name: /next/i })).toBeVisible();
  });

  test("valid form allows proceeding to next step", async ({ page }) => {
    await page.getByLabel(/first name/i).fill("John");
    await page.getByLabel(/last name/i).fill("Doe");
    await page.getByLabel(/address/i).fill("123 Main Street, Apt 4");
    await page.getByLabel(/city/i).fill("Berlin");
    await page.getByLabel(/phone number/i).fill("9876543210");
    const zipInput = page
      .getByLabel(/zip/i)
      .or(page.getByLabel(/postal/i))
      .first();
    await zipInput.fill("10115");
    const countrySelect = page.getByLabel(/country/i).first();
    const tag = await countrySelect.evaluate((el) => el.tagName.toLowerCase());
    if (tag === "select") {
      await countrySelect.selectOption({ index: 1 });
    }
    const continueBtn = page.getByRole("button", { name: /next/i });
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });
    await continueBtn.click();
    // /shipping is a single page with a step indicator. After Next, the
    // step indicator advances to step 2 (Review) — URL stays at /shipping.
    // Verify by checking the Review step content becomes visible.
    await expect(page.getByText(/Order Items|Review|Subtotal|Items/i).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
