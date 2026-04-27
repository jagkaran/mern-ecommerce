// helpers/auth.js
// Fix: use page.locator('input#password') to avoid strict-mode violation
// from getByLabel(/password/i) matching both the <input id="password"> AND
// the MUI "toggle password visibility" <button aria-label="...">.

async function loginViaUI(page, email, password) {
  await page.goto('/signin');
  await page.getByLabel(/email/i).fill(email);
  // Target the input specifically via its id to avoid MUI icon-button collision
  await page.locator('input#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Wait for redirect away from /signin
  await page.waitForURL((url) => !url.pathname.includes('/signin'), {
    timeout: 15000,
  });
}

module.exports = { loginViaUI };
