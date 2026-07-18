// e2e/helpers/reviewSeed.js
// Seeds a verified purchase for the test user against the first in-stock
// product. Required because PUT /api/v1/review enforces a verified-purchase
// gate (must have ordered the product at least once).
//
// Flow:
//   1. Login as test user.
//   2. POST /api/v1/payment/process with orderItems → get Stripe client_secret.
//   3. Confirm the PaymentIntent with a Stripe test payment method using
//      STRIPE_SECRET_KEY (skipped if not set; helper becomes a no-op).
//   4. POST /api/v1/order/new with the confirmed intent id → real order.
//
// All API calls run against the backend over the configured port.

const http = require("http");
const https = require("https");

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || "10000", 10);
const HOST = process.env.E2E_HOST || "localhost";

const USER_EMAIL = process.env.E2E_USER_EMAIL || process.env.TEST_USER_EMAIL || "user@test.com";
const USER_PASS = process.env.E2E_USER_PASSWORD || process.env.TEST_USER_PASS || "User@1234";

function rawReq(opts, body, cookies = []) {
  return new Promise((resolve, reject) => {
    const headers = { ...(opts.headers || {}) };
    if (cookies.length) headers.cookie = cookies.join("; ");
    const req = http.request({ hostname: HOST, port: BACKEND_PORT, ...opts, headers }, (res) => {
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
        });
      });
    });
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

function getCsrf(cookies) {
  return rawReq(
    {
      path: "/api/v1/csrf-token",
      method: "GET",
      headers: { cookie: cookies.join("; ") },
    },
    null,
    cookies
  );
}

function mergeCookies(existing, fresh) {
  const map = new Map();
  for (const c of existing) {
    const [pair] = c.split(";");
    const [name] = pair.split("=");
    map.set(name, c);
  }
  for (const c of fresh) {
    const [pair] = c.split(";");
    const [name] = pair.split("=");
    map.set(name, c);
  }
  return [...map.values()];
}

async function login() {
  let cookies = [];
  // CSRF is only enforced in production NODE_ENV. In dev / E2E the route
  // doesn't even exist, so we don't bother fetching a token here.
  const res = await rawReq(
    {
      path: "/api/v1/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: USER_EMAIL, password: USER_PASS },
    cookies
  );

  cookies = mergeCookies(cookies, res.cookies);
  if (res.status >= 400) {
    throw new Error(
      `reviewSeed: login failed status=${res.status} body=${JSON.stringify(res.data)}`
    );
  }
  return cookies;
}

async function fetchFirstInStock(cookies) {
  const products = await rawReq(
    { path: "/api/v1/products?page=1", method: "GET", headers: { cookie: cookies.join("; ") } },
    null,
    cookies
  );
  const list = products.data?.products || [];
  return list.find((p) => Number(p.stock) > 0) || null;
}

async function createPaymentIntent(cookies, product) {
  // Stripe rejects with 402 if paymentInfo.id is not a real PaymentIntent.
  // Hit the actual /payment/process endpoint to mint one. Server computes
  // the amount from authoritative DB prices (we just pass orderItems).
  const res = await rawReq(
    {
      path: "/api/v1/payment/process",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies.join("; "),
      },
    },
    {
      orderItems: [
        {
          product: product._id,
          quantity: 1,
        },
      ],
    },
    cookies
  );

  if (res.status >= 400) {
    throw new Error(
      `reviewSeed: payment failed status=${res.status} body=${JSON.stringify(res.data)}`
    );
  }
  // Response shape: { success, client_secret }.
  // client_secret is "pi_XXX_secret_YYY" — the intent id is the prefix.
  const clientSecret = res.data?.client_secret;
  if (!clientSecret) {
    throw new Error(`reviewSeed: no client_secret in response ${JSON.stringify(res.data)}`);
  }
  const intentId = clientSecret.split("_secret_")[0];
  return { intentId, clientSecret };
}

// Confirm a PaymentIntent with Stripe's test card (pm_card_visa) using the
// Stripe REST API directly. Requires STRIPE_SECRET_KEY. The Stripe Dashboard
// for this account enables redirect-based payment methods (link, etc.), so
// we must pass a return_url even though we're using a non-redirect method.
function stripeConfirmIntent(intentId, secretKey) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      payment_method: "pm_card_visa",
      return_url: "http://localhost:3000/success",
    });
    const body = params.toString();
    const req = https.request(
      {
        hostname: "api.stripe.com",
        path: `/v1/payment_intents/${intentId}/confirm`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
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
          resolve({ status: res.statusCode, data });
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function placeOrder(cookies, product, paymentIntentId) {
  const orderPayload = {
    shippingInfo: {
      address: "221B Baker Street",
      city: "London",
      state: "GL",
      country: "United Kingdom",
      zip: 10115,
      phone: 447911123456,
    },
    orderItems: [
      {
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.images?.[0]?.url || "",
        product: product._id,
      },
    ],
    paymentInfo: { id: paymentIntentId, status: "succeeded" },
  };

  const res = await rawReq(
    {
      path: "/api/v1/order/new",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies.join("; "),
      },
    },
    orderPayload,
    cookies
  );

  if (res.status >= 400) {
    throw new Error(
      `reviewSeed: order failed status=${res.status} body=${JSON.stringify(res.data)}`
    );
  }
  return res.data;
}

async function ensureUserHasPurchasedFirstProduct() {
  let cookies;
  try {
    cookies = await login();
  } catch (e) {
    console.warn(`[reviewSeed] ${e.message}`);
    return;
  }

  const product = await fetchFirstInStock(cookies);
  if (!product) {
    console.warn("[reviewSeed] no in-stock products to seed purchase against");
    return;
  }

  try {
    const { intentId } = await createPaymentIntent(cookies, product);

    // Confirm the intent via Stripe so the order service sees status='succeeded'.
    // Skip if STRIPE_SECRET_KEY isn't set; helper becomes a no-op.
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      const confirm = await stripeConfirmIntent(intentId, secretKey);
      if (confirm.status >= 400 || confirm.data?.status !== "succeeded") {
        throw new Error(
          `reviewSeed: stripe confirm failed status=${confirm.status} body=${JSON.stringify(confirm.data)}`
        );
      }
    }

    await placeOrder(cookies, product, intentId);
    console.log(
      `[reviewSeed] seeded purchase of ${product.name} (${product._id}) for ${USER_EMAIL}`
    );
  } catch (e) {
    // Likely already purchased or stock issue — tolerable for E2E purposes.
    console.warn(`[reviewSeed] ${e.message}`);
  }
}

module.exports = { ensureUserHasPurchasedFirstProduct };
