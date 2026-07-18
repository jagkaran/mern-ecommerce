const { test, expect } = require("@playwright/test");
const { loginAsUser, USER_EMAIL, USER_PASS } = require("./helpers/auth");

test.describe("Account page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/account");
  });

  test("account page renders user info", async ({ page }) => {
    await expect(page.getByLabel(/email address/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("update password page renders", async ({ page }) => {
    await page.goto("/password/update");
    await expect(page.getByLabel(/old password/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("update password shows error if new passwords don't match", async ({ page }) => {
    await page.goto("/password/update");
    // Frontend regex requires digit + special char; backend requires upper/lower/digit.
    // Use values that pass both so the only failing check is the mismatch itself.
    await page.getByLabel(/old password/i).fill("Oldpass1!");
    await page.getByLabel(/new password/i).fill("Newpass1!");
    const confirmField = page.getByLabel(/confirm password/i);
    await confirmField.fill("Mismatch2!");
    await confirmField.blur();
    // Frontend pre-validates and blocks submit when passwords don't match —
    // verify the inline error is shown instead of clicking through.
    await expect(
      page.getByText(/passwords? (do not|and confirm) match|must match/i).first()
    ).toBeVisible({ timeout: 8000 });
    const updateBtn = page.getByRole("button", { name: /update/i });
    await expect(updateBtn).toBeDisabled({ timeout: 5000 });
  });
});
