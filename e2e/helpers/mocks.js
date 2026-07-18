"use strict";
/**
 * E2E network-mocking helpers.
 *
 * Per docs/TESTING.md and the user's ask: avoid writing records to live
 * databases for every test execution. Use Playwright's native page.route()
 * to intercept heavy network requests and mock stable JSON responses.
 *
 * Each helper registers an interceptor on the supplied page. Call at the top
 * of the spec (or in beforeEach). Mocks persist for the page's lifetime; pair
 * with `await page.context().clearCookies()` etc. for hard resets.
 */
const { expect } = require("@playwright/test");

/**
 * Intercept GET /api/v1/products (and sub-paths) and return a canned list.
 * Use this in specs that need a stable product catalogue without depending
 * on the live seeder.
 *
 * @param {import("@playwright/test").Page} page
 * @param {Array<{_id:string,name:string,price:number,stock:number,images?:Array<{url:string}>,category?:string}>} products
 * @returns {Promise<void>}
 */
async function mockProductsRoute(page, products) {
  await page.route("**/api/v1/products**", async (route) => {
    const req = route.request();
    if (req.method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        products,
        productCount: products.length,
        resultPerPage: products.length,
      }),
    });
  });
}

/**
 * Intercept POST /api/v1/payment/process and return a fake client_secret.
 * Use in checkout/payment specs that want to short-circuit Stripe.
 *
 * @param {import("@playwright/test").Page} page
 * @param {{client_secret?:string,id?:string}} [response]
 * @returns {Promise<void>}
 */
async function mockPaymentRoute(page, response = {}) {
  const body = {
    success: true,
    client_secret: response.client_secret || "pi_test_secret_e2e",
    id: response.id || "pi_test_e2e",
  };
  await page.route("**/api/v1/payment/process", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

/**
 * Smoke check: confirm a route mock is actually firing. Useful in tests
 * that need to assert "the page hit the mocked endpoint" before downstream
 * UI assertions.
 *
 * @param {import("@playwright/test").Page} page
 * @param {string|RegExp} urlPattern
 * @returns {Promise<void>}
 */
async function expectRouteHit(page, urlPattern) {
  let hit = false;
  const probe = page
    .waitForRequest(urlPattern, { timeout: 5_000 })
    .then(() => {
      hit = true;
    })
    .catch(() => {});
  // Caller triggers the navigation/action; this probe races until either
  // the request fires (hit=true) or the timeout fires.
  await probe;
  expect(hit).toBe(true);
}

module.exports = { mockProductsRoute, mockPaymentRoute, expectRouteHit };
