// e2e/helpers/adminSeed.js
// Helper: ensure the first N products in the DB have stock > 0 so e2e tests
// that depend on an "in-stock" item don't fail due to stale fixtures.
//
// Logs in as TEST_ADMIN_EMAIL, fetches the first page of products, then
// issues PUT /api/v1/admin/product/:id with stock=10 for each. Idempotent:
// safe to call repeatedly, only updates when stock === 0.

const http = require("http");

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || "10000", 10);
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@test.com";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || "Admin@1234";

function rawReq(opts, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...opts, hostname: "localhost", port: BACKEND_PORT }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
        resolve({
          status: res.statusCode,
          data,
          cookies: res.headers["set-cookie"] || [],
          headers: res.headers,
        });
      });
    });
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

function setCookieFromResponse(jar, cookies) {
  for (const c of cookies) {
    const first = c.split(";")[0];
    const name = first.split("=")[0];
    const idx = jar.findIndex((j) => j.startsWith(`${name}=`));
    if (idx >= 0) jar[idx] = first;
    else jar.push(first);
  }
  return jar;
}

async function adminLogin() {
  // Get csrf
  let res = await rawReq({ path: "/api/v1/csrf-token", method: "GET" });
  const jar = [];
  setCookieFromResponse(jar, res.cookies);
  const csrfToken = res.data?.csrfToken;

  // Login (POST, exempt from csrf per config? if not, send token)
  res = await rawReq(
    {
      path: "/api/v1/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        cookie: jar.join("; "),
      },
    },
    { email: ADMIN_EMAIL, password: ADMIN_PASS }
  );
  setCookieFromResponse(jar, res.cookies);

  // Confirm admin
  res = await rawReq({
    path: "/api/v1/me",
    method: "GET",
    headers: { cookie: jar.join("; ") },
  });
  if (res.status !== 200) {
    throw new Error(`admin seed: login failed, status=${res.status}`);
  }
  return { jar, role: res.data?.user?.role };
}

async function ensureInStock(n = 5) {
  // Ponytail: skip live DB writes when the spec has mocked the products
  // endpoint via e2e/helpers/mocks.js. Opt in with E2E_MOCK_PRODUCTS=1.
  // The caller is responsible for registering the mock before navigating
  // to /products (see mockProductsRoute(page, [...]) in helpers/mocks.js).
  if (process.env.E2E_MOCK_PRODUCTS === "1") {
    return [];
  }

  let { jar, role } = await adminLogin();
  if (role !== "admin") {
    throw new Error(`admin seed: TEST_ADMIN_EMAIL=${ADMIN_EMAIL} is not admin (role=${role})`);
  }

  // Fetch first page of products
  let res = await rawReq({
    path: "/api/v1/products?page=1&limit=50",
    method: "GET",
    headers: { cookie: jar.join("; ") },
  });
  const products = (res.data?.products || []).slice(0, n);
  if (products.length === 0) {
    console.warn("[adminSeed] No products returned from /products");
    return [];
  }

  // For each, ensure stock > 0
  const outOfStock = products.filter((p) => (p.stock ?? 0) <= 0);
  for (const p of outOfStock) {
    // Need fresh CSRF for each PUT
    res = await rawReq({
      path: "/api/v1/csrf-token",
      method: "GET",
      headers: { cookie: jar.join("; ") },
    });
    setCookieFromResponse(jar, res.cookies);
    const csrfToken = res.data?.csrfToken;

    res = await rawReq(
      {
        path: `/api/v1/admin/product/${p._id}`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
          cookie: jar.join("; "),
        },
      },
      { stock: 10 }
    );
    if (res.status >= 400) {
      console.warn(
        `[adminSeed] PUT failed for ${p._id}: status=${res.status} body=${JSON.stringify(res.data)}`
      );
    }
  }
  return products.map((p) => ({ id: p._id, name: p.name, wasInStock: (p.stock ?? 0) > 0 }));
}

module.exports = { ensureInStock, adminLogin };
