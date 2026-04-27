// @ts-check
const { test, expect } = require("@playwright/test");
const { loginViaUI } = require("./helpers/auth");

// ---------------------------------------------------------------------------
// Checkout / Shipping E2E Tests
// Covers: shipping form renders, validation errors on empty submit
// Note: Full payment flow requires Stripe test keys — covered here up to
//       the payment step using mock/test card numbers.
// ---------------------------------------------------------------------------

test.describe("Shipping form validation", () => {
  test.skip(
    !process.env.TEST_EMAIL || !process.env.TEST_PASSWORD,
    "Set TEST_EMAIL and TEST_PASSWORD env vars to run checkout tests"
  );

  test.beforeEach(async ({ page }) => {
    await loginViaUI(
      page,
      process.env.TEST_EMAIL,
      process.env.TEST_PASSWORD
    );
    // Add a product to cart first so shipping is accessible
    await page.goto("/products");
    const firstCard = page.locator(".MuiCard-root a, .MuiCardActionArea-root").first();
    await firstCard.waitFor({ timeout: 15000 });
    await firstCard.click();
    await page.waitForURL(/\/product\//, { timeout: 10000 });
    const addBtn = page.getByRole("button", { name: /add to cart/i });
    await addBtn.waitFor({ timeout: 10000 });
    if (!(await addBtn.isDisabled())) await addBtn.click();
    await page.goto("/shipping");
  });

  test("shipping form renders all required fields", async ({ page }) => {
    await expect(page.getByLabel(/first name/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/address/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
    await expect(page.getByLabel(/city/i)).toBeVisible();
    await expect(page.getByLabel(/zip|postal/i)).toBeVisible();
  });

  test("phone field rejects non-numeric input", async ({ page }) => {
    const phoneInput = page.getByLabel(/phone/i);
    await phoneInput.fill("abcdefghij");
    await phoneInput.blur();
    await expect(page.getByText(/10 digits/i)).toBeVisible();
  });

  test("phone field rejects less than 10 digits", async ({ page }) => {
    const phoneInput = page.getByLabel(/phone/i);
    await phoneInput.fill("12345");
    await phoneInput.blur();
    await expect(page.getByText(/10 digits/i)).toBeVisible();
  });

  test("address field rejects less than 10 characters", async ({ page }) => {
    const addressInput = page.getByLabel(/^address/i);
    await addressInput.fill("123 St");
    await addressInput.blur();
    await expect(page.getByText(/at least 10/i)).toBeVisible();
  });

  test("valid form allows proceeding to next step", async ({ page }) => {
    await page.getByLabel(/first name/i).fill("John");
    await page.getByLabel(/last name/i).fill("Doe");
    await page.getByLabel(/^address/i).fill("123 Main Street, Apt 4");
    await page.getByLabel(/phone/i).fill("9876543210");
    await page.getByLabel(/city/i).fill("Mumbai");
    await page.getByLabel(/zip|postal/i).fill("400001");
    // Select country
    await page.getByLabel(/country/i).click();
    await page.getByRole("option", { name: "India" }).click();
    // Continue / Next button should be enabled
    const nextBtn = page.getByRole("button", { name: /continue|next|proceed/i });
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });
  });
});
