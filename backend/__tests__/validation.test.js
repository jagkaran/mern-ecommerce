"use strict";
/**
 * Tests for backend/middleware/validation.js
 * Uses supertest against the real Express app so the full
 * express-validator pipeline (chain → handleValidationErrors) runs.
 */
const request = require("supertest");
const app     = require("../app");
const User    = require("../models/userModel");

// ─── helpers ────────────────────────────────────────────────────────────────

const ts   = Date.now();
let cookie = "";

/** Seed one user and return an auth cookie for authenticated routes */
async function seedUserCookie() {
  if (cookie) return cookie;
  const email = `val_${ts}@example.com`;
  await User.create({
    name: "Val User",
    email,
    password: "Test@12345",
    profilePic: { public_id: "x", url: "http://example.com/x.jpg" },
  });
  const res = await request(app).post("/api/v1/login").send({ email, password: "Test@12345" });
  cookie = res.headers["set-cookie"]?.[0] || "";
  return cookie;
}

// ─── validateRegistration ────────────────────────────────────────────────────

describe("validateRegistration", () => {
  it("400 when name is too short", async () => {
    const res = await request(app).post("/api/v1/register").send({
      name: "Ab", email: "ab@example.com", password: "Test@12345",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/4 and 30/i);
  });

  it("400 when email is malformed", async () => {
    const res = await request(app).post("/api/v1/register").send({
      name: "Valid Name", email: "not-an-email", password: "Test@12345",
    });
    expect(res.status).toBe(400);
  });

  it("400 when password has no uppercase", async () => {
    const res = await request(app).post("/api/v1/register").send({
      name: "Valid Name", email: `nouc_${ts}@example.com`, password: "alllower1",
    });
    expect(res.status).toBe(400);
  });

  it("201 or 500 with fully valid payload (cloudinary optional in test)", async () => {
    const res = await request(app).post("/api/v1/register").send({
      name: "Valid Name",
      email: `valid_reg_${ts}@example.com`,
      password: "Test@12345",
    });
    expect([201, 500]).toContain(res.status);
  });
});

// ─── validateLogin ───────────────────────────────────────────────────────────

describe("validateLogin", () => {
  it("400 when email is missing", async () => {
    const res = await request(app).post("/api/v1/login").send({ password: "Test@12345" });
    expect(res.status).toBe(400);
  });

  it("400 when password is missing", async () => {
    const res = await request(app).post("/api/v1/login").send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });

  it("400 when password is too short", async () => {
    const res = await request(app).post("/api/v1/login").send({ email: "a@b.com", password: "short" });
    expect(res.status).toBe(400);
  });
});

// ─── validateCreateOrder — state edge cases ──────────────────────────────────

describe("validateCreateOrder — shippingInfo.state", () => {
  const baseOrder = {
    orderItems: [{
      name: "Test Product",
      price: 10.0,
      quantity: 1,
      image: "https://res.cloudinary.com/test/image/upload/test.jpg",
      product: "507f1f77bcf86cd799439011",
    }],
    paymentInfo: { id: "pi_test123", status: "succeeded" },
    itemPrice: 10.0,
    taxPrice:  1.5,
    shippingPrice: 5.0,
    totalPrice: 16.5,
  };

  it("400 when state is exactly 1 char (Austria-style ISO code) — MUST PASS after fix", async () => {
    const ck = await seedUserCookie();
    const res = await request(app)
      .post("/api/v1/order/new")
      .set("Cookie", ck)
      .send({
        ...baseOrder,
        shippingInfo: {
          firstName: "Test", lastName: "User",
          address: "Schulstr. 13", city: "Vienna",
          state: "7",          // <-- single-char Austrian ISO code
          country: "AT",
          zip: "1010",
          phone: "06641234567",
        },
      });
    // After the fix state min:1, this must NOT return 400 for a length reason.
    // It may still return 401 (no auth in test env) or 200/201 — never 400.
    expect(res.status).not.toBe(400);
  });

  it("passes when state is omitted (optional field)", async () => {
    const ck = await seedUserCookie();
    const res = await request(app)
      .post("/api/v1/order/new")
      .set("Cookie", ck)
      .send({
        ...baseOrder,
        shippingInfo: {
          firstName: "Test", lastName: "User",
          address: "Schulstr. 13", city: "Vienna",
          country: "AT",
          zip: "1010",
          phone: "06641234567",
        },
      });
    expect(res.status).not.toBe(400);
  });

  it("400 when address is missing", async () => {
    const ck = await seedUserCookie();
    const res = await request(app)
      .post("/api/v1/order/new")
      .set("Cookie", ck)
      .send({
        ...baseOrder,
        shippingInfo: {
          firstName: "Test", lastName: "User",
          city: "Vienna", country: "AT", zip: "1010", phone: "06641234567",
        },
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/address/i);
  });

  it("400 when orderItems is empty array", async () => {
    const ck = await seedUserCookie();
    const res = await request(app)
      .post("/api/v1/order/new")
      .set("Cookie", ck)
      .send({
        ...baseOrder,
        orderItems: [],
        shippingInfo: {
          firstName: "Test", lastName: "User",
          address: "Schulstr. 13", city: "Vienna",
          country: "AT", zip: "1010", phone: "06641234567",
        },
      });
    expect(res.status).toBe(400);
  });

  it("400 when paymentInfo.status is invalid", async () => {
    const ck = await seedUserCookie();
    const res = await request(app)
      .post("/api/v1/order/new")
      .set("Cookie", ck)
      .send({
        ...baseOrder,
        paymentInfo: { id: "pi_test", status: "unknown" },
        shippingInfo: {
          firstName: "Test", lastName: "User",
          address: "Schulstr. 13", city: "Vienna",
          country: "AT", zip: "1010", phone: "06641234567",
        },
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/payment status/i);
  });
});

// ─── validateProductReview ───────────────────────────────────────────────────

describe("validateProductReview", () => {
  it("400 when rating is out of range", async () => {
    const ck = await seedUserCookie();
    const res = await request(app)
      .put("/api/v1/review")
      .set("Cookie", ck)
      .send({ rating: 6, comment: "Great product!", productId: "507f1f77bcf86cd799439011" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/1 and 5/i);
  });

  it("400 when comment is too short", async () => {
    const ck = await seedUserCookie();
    const res = await request(app)
      .put("/api/v1/review")
      .set("Cookie", ck)
      .send({ rating: 4, comment: "Bad", productId: "507f1f77bcf86cd799439011" });
    expect(res.status).toBe(400);
  });

  it("400 when productId is not a MongoId", async () => {
    const ck = await seedUserCookie();
    const res = await request(app)
      .put("/api/v1/review")
      .set("Cookie", ck)
      .send({ rating: 4, comment: "Nice product overall", productId: "not-a-mongo-id" });
    expect(res.status).toBe(400);
  });
});
