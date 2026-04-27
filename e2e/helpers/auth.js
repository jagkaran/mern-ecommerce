/**
 * Shared auth helpers for Playwright E2E tests.
 * Uses the API directly to avoid testing login on every spec.
 */

/**
 * Log in via the UI sign-in page.
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
async function loginViaUI(page, email, password) {
  await page.goto("/signin");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for redirect away from signin
  await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 15000 });
}

/**
 * Log out via the UI.
 * @param {import('@playwright/test').Page} page
 */
async function logoutViaUI(page) {
  // Header has a user menu / logout option
  const logoutBtn = page.getByRole("button", { name: /logout/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  } else {
    // Try nav menu
    await page.getByRole("button", { name: /account|menu|profile/i }).first().click();
    await page.getByRole("menuitem", { name: /logout/i }).click();
  }
  await page.waitForURL("/", { timeout: 10000 });
}

module.exports = { loginViaUI, logoutViaUI };
