"use strict";
/**
 * Endpoint tests for the guest-checkout flow.
 * Covers:
 *   POST /api/v1/order/new   - accepts optional auth; returns claimToken for guests
 *   POST /api/v1/order/claim - public claim route that materialises the guest as a User
 *
 * Strategy: bypass the transaction wrapper (single-node mongo can't run
 * multi-doc transactions) and stub paymentService.retrievePaymentIntent so
 * the server-side amount check passes. The endpoint tests assert on HTTP
 * shape; the underlying services are already exercised in isolation in
 * claimService.test.js.
 */

jest.mock("../utils/transaction", () => ({
  __esModule: false,
  withTransaction: async (fn) => {
    const mockMongoose = require("mongoose");
    const session = await mockMongoose.startSession();
    try {
      return await fn(session);
    } finally {
      await session.endSession();
    }
  },
}));

jest.mock("../services/paymentService", () => ({
  retrievePaymentIntent: jest.fn(),
}));

const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const paymentService = require("../services/paymentService");

let productId;
beforeAll(async () => {
  const p = await Product.create({
    name: "EP",
    description: "d",
    price: 25,
    category: "Test",
    stock: 10,
    images: [{ public_id: "e", url: "http://e.com/e.jpg" }],
    createdBy: new mongoose.Types.ObjectId(),
  });
  productId = p._id;
});

// Test isolation: wipe Order/User state between tests so the second claim
// test doesn't see orders from the first (claimService scans recent orders
// by claimTokenHash, so cross-test residue can interfere with HMAC matching).
afterEach(async () => {
  const Order = require("../models/orderModel");
  await Promise.all([Order.deleteMany({}), User.deleteMany({})]);
  // Reset the paymentService mock between tests so leftover mock
  // implementations from prior tests don't satisfy a later test's call.
  paymentService.retrievePaymentIntent.mockReset();
});

const shipping = {
  address: "100 Test St",
  city: "Testville",
  state: "TS",
  country: "US",
  zip: "12345",
  phone: "9876543210",
};
const items = () => [
  { name: "x", price: 25, quantity: 1, image: "http://e.com/i.jpg", product: productId },
];

async function stubMatchingIntent(paymentId, { amount = 9999 } = {}) {
  paymentService.retrievePaymentIntent.mockImplementationOnce(async (pid) => ({
    id: pid,
    status: "succeeded",
    amount,
    currency: "usd",
  }));
  return paymentId;
}

describe("POST /order/new - guest path", () => {
  it("201 + claimToken when no auth + valid guestEmail", async () => {
    const paymentId = `pi_${Date.now()}`;
    // Server pricing: 25 * 1 + tax(15%) + shipping(50) = 78.75 → 7875 cents.
    await stubMatchingIntent(paymentId, { amount: 7875 });

    const res = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: items(),
        paymentInfo: { id: paymentId, status: "succeeded" },
        guestEmail: "guest_endpoint@y.io",
      });
    expect(res.status).toBe(201);
    expect(res.body.claimToken).toMatch(/^[0-9a-f]{64}$/);
    expect(res.body.order.guestEmail).toBe("guest_endpoint@y.io");
  });
  it("400 GUEST_EMAIL_REQUIRED when no auth + no email", async () => {
    const paymentId = `pi_ne_${Date.now()}`;
    await stubMatchingIntent(paymentId, { amount: 7875 });

    const res = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: items(),
        paymentInfo: { id: paymentId, status: "succeeded" },
      });
    expect(res.status).toBe(400);
  });
  it("400 STOCK_INSUFFICIENT when qty > stock (guest)", async () => {
    const oversized = [{ ...items()[0], quantity: 999 }];
    const paymentId = `pi_stk_${Date.now()}`;
    // Stock check happens server-side; stub returns any non-zero amount so
    // we don't have to compute pricing for an over-sized quantity that the
    // server will reject anyway.
    await stubMatchingIntent(paymentId, { amount: 1 });

    const res = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: oversized,
        paymentInfo: { id: paymentId, status: "succeeded" },
        guestEmail: "stockguest@y.io",
      });
    expect(res.status).toBe(400);
  });
});

describe("POST /order/claim", () => {
  it("201 + JWT cookie on success", async () => {
    const createPaymentId = `pi_cl_${Date.now()}`;
    await stubMatchingIntent(createPaymentId, { amount: 7875 });

    const created = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: items(),
        paymentInfo: { id: createPaymentId, status: "succeeded" },
        guestEmail: "claimme@y.io",
      });
    const token = created.body.claimToken;
    const claim = await request(app)
      .post("/api/v1/order/claim")
      .send({ claimToken: token, password: "passw0rd!" });
    expect(claim.status).toBe(201);
    expect(claim.headers["set-cookie"]).toBeDefined();
    const me = await request(app).get("/api/v1/me").set("Cookie", claim.headers["set-cookie"][0]);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("claimme@y.io");
  });
  it("400 on replay", async () => {
    const createPaymentId = `pi_clr_${Date.now()}`;
    await stubMatchingIntent(createPaymentId, { amount: 7875 });

    const created = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: items(),
        paymentInfo: { id: createPaymentId, status: "succeeded" },
        guestEmail: "replay@y.io",
      });
    const token = created.body.claimToken;
    const first = await request(app)
      .post("/api/v1/order/claim")
      .send({ claimToken: token, password: "passw0rd!" });
    expect(first.status).toBe(201);
    const second = await request(app)
      .post("/api/v1/order/claim")
      .send({ claimToken: token, password: "passw0rd!" });
    expect(second.status).toBe(400);
  });
  it("409 when email matches existing User", async () => {
    await User.create({
      name: "Dup2",
      email: "dup2@y.io",
      password: "Existing1!",
      profilePic: { public_id: "x", url: "http://e.com/x.jpg" },
    });
    const createPaymentId = `pi_dup_${Date.now()}`;
    await stubMatchingIntent(createPaymentId, { amount: 7875 });

    const created = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: items(),
        paymentInfo: { id: createPaymentId, status: "succeeded" },
        guestEmail: "dup2@y.io",
      });
    const res = await request(app)
      .post("/api/v1/order/claim")
      .send({ claimToken: created.body.claimToken, password: "passw0rd!" });
    expect(res.status).toBe(409);
  });
  it("400 on malformed claim token (non-hex)", async () => {
    const res = await request(app)
      .post("/api/v1/order/claim")
      .send({ claimToken: "Z".repeat(64), password: "passw0rd!" });
    expect(res.status).toBe(400);
  });
});
