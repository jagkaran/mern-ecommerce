const { expect } = require("@playwright/test");

// Default to the real admin account so we're not pounding the test@stubble
// admin (which gets rate-limited at 20/15min). Falls back to TEST_ADMIN_*
// for hermetic CI envs.
const ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ||
  process.env.TEST_PROD_ADMIN_EMAIL ||
  process.env.TEST_ADMIN_EMAIL ||
  "admin@test.com";
const ADMIN_PASS =
  process.env.E2E_ADMIN_PASS ||
  process.env.TEST_PROD_ADMIN_PASS ||
  process.env.TEST_ADMIN_PASS ||
  "Admin@1234";

const USER_EMAIL = process.env.TEST_USER_EMAIL || "user@test.com";
const USER_PASS = process.env.TEST_USER_PASS || "User@1234";

async function loginViaUI(page, email, password) {
  await page.goto("/signin");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 20_000 });
}

async function loginAsAdmin(page) {
  return loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS);
}

async function loginAsUser(page) {
  return loginViaUI(page, USER_EMAIL, USER_PASS);
}

module.exports = {
  loginViaUI,
  loginAsAdmin,
  loginAsUser,
  ADMIN_EMAIL,
  ADMIN_PASS,
  USER_EMAIL,
  USER_PASS,
};
