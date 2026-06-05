const { expect } = require("@playwright/test");

async function loginViaUI(page, email, password) {
  await page.goto("/signin");
  await page.getByLabel(/email/i).fill(email);
  await page.locator('input#password').fill(password);

  // Click the native <button type="submit"> so React's onSubmit fires.
  // Using a real browser click generates a proper SubmitEvent that React's
  // synthetic-event delegation picks up. The previous approach — filling
  // fields then dispatching a plain Event("submit") via evaluate — did not
  // trigger React's handler, so the form never navigated away from /signin
  // and the URL wait always timed out.
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 20_000 });
}

module.exports = { loginViaUI };
