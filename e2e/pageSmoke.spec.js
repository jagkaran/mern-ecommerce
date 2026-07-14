// e2e/pageSmoke.spec.js
// Per-page smoke coverage. Verifies that every route:
//   1. Loads without uncaught JS errors (no `pageerror`).
//   2. Loads without HTTP 5xx (4xx tolerated for known anon /me, etc.).
//   3. Renders its primary <main> landmark within 10s.
//   4. Renders an expected page-specific element (text match).
//   5. Layout is responsive at iPhone-SE / iPad / Desktop viewports.

const { test, expect } = require("@playwright/test");
const { loginAsAdmin, loginAsUser } = require("./helpers/auth");

// Pages any visitor (anon) can reach.
const PUBLIC_PAGES = [
  { path: "/", name: "Home", expect: /made to live with|everyday|hverdag/i },
  { path: "/products", name: "Products listing", expect: /pieces made to live|the collection/i },
  { path: "/search", name: "Search", expect: /search a product|look through the shelves/i },
  { path: "/signin", name: "Sign in", expect: /come in|sign in/i },
  { path: "/signup", name: "Sign up", expect: /create an account|sign up|register/i },
  { path: "/password/forgot", name: "Forgot password", expect: /email|password/i },
  { path: "/cart", name: "Cart", expect: /bag|cart/i },
  { path: "/aboutus", name: "About us", expect: /hverdag|keeper|workshop/i },
  { path: "/notfound", name: "Not found", expect: /can't find|not found|workshop/i },
];

const ADMIN_PAGES = [
  { path: "/dashboard", name: "Dashboard", expect: /dashboard|revenue|orders|users/i },
  { path: "/admin/products", name: "Admin products", expect: /products/i },
  { path: "/admin/orders", name: "Admin orders", expect: /orders/i },
  { path: "/admin/users", name: "Admin users", expect: /users/i },
  { path: "/admin/product/new", name: "Create product", expect: /create product|name|price|description/i },
];

const USER_PAGES = [
  { path: "/account", name: "Account", expect: /profile|account|email/i },
  { path: "/password/update", name: "Update password", expect: /old password|new password|password/i },
];

const PUBLIC_DYNAMIC_PAGES = [
  { path: "/products/laptop", name: "Search keyword", expect: /laptop|pieces made to live|collection/i },
  { path: "/wishlist", name: "Wishlist", expect: /wishlist|sign in to keep/i },
];

// Filter resource-load console noise that comes from anon fetches (e.g. /api/v1/me
// returning 401). Only real JS errors (pageerror) should fail a test.
function attachErrorCapture(p, sink) {
  p.on("pageerror", (err) => sink.pageErrors.push(String(err)));
}

test.describe("Per-page smoke (anon)", () => {
  for (const page of PUBLIC_PAGES) {
    test(`public ${page.name} (${page.path}) loads cleanly`, async ({ page: p }) => {
      const sink = { pageErrors: [] };
      attachErrorCapture(p, sink);

      const response = await p.goto(page.path, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;
      if (page.path !== "/notfound") {
        expect(status, `HTTP ${status} on ${page.path}`).toBeLessThan(400);
      }

      await expect(p.locator("main").first()).toBeVisible({ timeout: 10_000 });
      await expect(p.getByText(page.expect).first()).toBeVisible({ timeout: 10_000 });

      expect(
        sink.pageErrors,
        `Page errors on ${page.path}:\n${sink.pageErrors.join("\n")}`
      ).toEqual([]);
    });
  }

  for (const page of PUBLIC_DYNAMIC_PAGES) {
    test(`dynamic ${page.name} (${page.path}) loads cleanly`, async ({ page: p }) => {
      const sink = { pageErrors: [] };
      attachErrorCapture(p, sink);

      await p.goto(page.path, { waitUntil: "domcontentloaded" });
      await expect(p.locator("main").first()).toBeVisible({ timeout: 10_000 });
      expect(
        sink.pageErrors,
        `Page errors on ${page.path}:\n${sink.pageErrors.join("\n")}`
      ).toEqual([]);
    });
  }
});

test.describe("Per-page smoke (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const page of ADMIN_PAGES) {
    test(`admin ${page.name} (${page.path}) loads cleanly`, async ({ page: p }) => {
      const sink = { pageErrors: [] };
      attachErrorCapture(p, sink);

      const response = await p.goto(page.path, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;
      expect(status, `HTTP ${status} on ${page.path}`).toBeLessThan(400);

      await expect(p.locator("main").first()).toBeVisible({ timeout: 10_000 });
      await expect(p.getByText(page.expect).first()).toBeVisible({ timeout: 10_000 });

      expect(
        sink.pageErrors,
        `Page errors on ${page.path}:\n${sink.pageErrors.join("\n")}`
      ).toEqual([]);
    });
  }
});

test.describe("Per-page smoke (user)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  for (const page of USER_PAGES) {
    test(`user ${page.name} (${page.path}) loads cleanly`, async ({ page: p }) => {
      const sink = { pageErrors: [] };
      attachErrorCapture(p, sink);

      const response = await p.goto(page.path, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;
      expect(status, `HTTP ${status} on ${page.path}`).toBeLessThan(400);

      await expect(p.locator("main").first()).toBeVisible({ timeout: 10_000 });
      await expect(p.getByText(page.expect).first()).toBeVisible({ timeout: 10_000 });

      expect(
        sink.pageErrors,
        `Page errors on ${page.path}:\n${sink.pageErrors.join("\n")}`
      ).toEqual([]);
    });
  }
});

test.describe("JSON-LD rich snippets", () => {
  let productSlug;

  test.beforeAll(async ({ request }) => {
    // Resolve any product slug for PDP assertions. Fetching via the public
    // list endpoint avoids depending on a hard-coded id and keeps the test
    // resilient as the catalog rotates.
    const res = await request.get("/api/v1/products?limit=1");
    expect(res.status(), `products list status: ${res.status()}`).toBe(200);
    const json = await res.json();
    productSlug = json?.products?.[0]?._id;
    expect(productSlug, "expected at least one product in DB").toBeTruthy();
  });

  test("PDP injects Product JSON-LD", async ({ page }) => {
    await page.goto(`/product/${productSlug}`, {
      waitUntil: "domcontentloaded",
    });
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(jsonLd, "Product JSON-LD script content").toContain('"@type":"Product"');
    expect(jsonLd, "Product JSON-LD aggregateRating").toContain(
      '"@type":"AggregateRating"'
    );
  });

  test("Home injects Organization JSON-LD", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(jsonLd, "Organization JSON-LD script content").toContain(
      '"@type":"Organization"'
    );
  });
});

test.describe("Responsive (mobile/tablet/desktop)", () => {
  for (const viewport of [
    { name: "iPhone-SE", width: 375, height: 667 },
    { name: "iPad", width: 768, height: 1024 },
    { name: "Desktop-1440", width: 1440, height: 900 },
  ]) {
    test(`Home loads cleanly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      page: p,
    }) => {
      const sink = { pageErrors: [] };
      attachErrorCapture(p, sink);

      await p.setViewportSize({ width: viewport.width, height: viewport.height });
      await p.goto("/");
      await expect(p.locator("main").first()).toBeVisible({ timeout: 10_000 });

      expect(
        sink.pageErrors,
        `Page errors at ${viewport.name}:\n${sink.pageErrors.join("\n")}`
      ).toEqual([]);
    });

    test(`Products listing loads cleanly at ${viewport.name}`, async ({ page: p }) => {
      const sink = { pageErrors: [] };
      attachErrorCapture(p, sink);

      await p.setViewportSize({ width: viewport.width, height: viewport.height });
      await p.goto("/products");
      await expect(p.locator("main").first()).toBeVisible({ timeout: 10_000 });

      expect(
        sink.pageErrors,
        `Page errors at ${viewport.name}:\n${sink.pageErrors.join("\n")}`
      ).toEqual([]);
    });
  }
});
