// @ts-check
const { test, expect } = require("@playwright/test");
const { loginViaUI } = require("./helpers/auth");

// ---------------------------------------------------------------------------
// Account / Profile E2E Tests
// Covers: profile page renders, update-password validation
// ---------------------------------------------------------------------------

test.describe("Account page", () => {
  test.skip(
    !process.env.TEST_EMAIL || !process.env.TEST_PASSWORD,
    "Set TEST_EMAIL and TEST_PASSWORD env vars to run account tests"
  );

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, process.env.TEST_EMAIL, process.env.TEST_PASSWORD);
    await page.goto("/account");
  });

  test("account page renders user info", async ({ page }) => {
    await expect(page.getByText(/my profile|account|profile/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("update password page renders", async ({ page }) => {
    await page.goto("/password/update");
    await expect(page.getByLabel(/old password|current password/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/new password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm/i)).toBeVisible();
  });

  test("update password shows error if new passwords don't match", async ({ page }) => {
    await page.goto("/password/update");
    await page.getByLabel(/new password/i).fill("NewPass@1");
    await page.getByLabel(/confirm/i).fill("Different@1");
    await page.getByLabel(/confirm/i).blur();
    await expect(page.getByText(/do not match|passwords must match/i)).toBeVisible();
  });
});
