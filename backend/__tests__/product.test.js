"use strict";
const request  = require("supertest");
const mongoose = require("mongoose");
const app      = require("../app");
const Product  = require("../models/productModel");
const User     = require("../models/userModel");

let adminCookie = "";
let productId   = "";

const adminUser = {
  name: "Admin User",
  email: `admin_prod_${Date.now()}@example.com`,
  password: "Admin@12345",
  role: "admin",
};

const productPayload = {
  name: "Test Product", description: "A test product description",
  price: 999, category: "Electronics", stock: 50, images: [],
};

beforeAll(async () => {
  const user = await User.create({
    ...adminUser,
    profilePic: { public_id: "test_id", url: "http://example.com/img.jpg" },
  });
  const loginRes = await request(app).post("/api/v1/login")
    .send({ email: adminUser.email, password: adminUser.password });
  if (loginRes.headers["set-cookie"]) adminCookie = loginRes.headers["set-cookie"][0];
  const product = await Product.create({ ...productPayload, createdBy: user._id });
  productId = product._id.toString();
});

describe("Product API — public routes", () => {
  it("GET /api/v1/products → 200 + products array", async () => {
    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });
  it("GET /api/v1/products?keyword=Test → 200", async () => {
    const res = await request(app).get("/api/v1/products?keyword=Test");
    expect(res.status).toBe(200);
  });
  it("GET /api/v1/products?page=1&limit=4 → 200", async () => {
    const res = await request(app).get("/api/v1/products?page=1&limit=4");
    expect(res.status).toBe(200);
  });
  it("GET /api/v1/product/:id → 200 for known product", async () => {
    const res = await request(app).get(`/api/v1/product/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.product._id).toBe(productId);
  });
  it("GET /api/v1/product/:id → 404 for unknown id", async () => {
    const res = await request(app).get("/api/v1/product/000000000000000000000000");
    expect(res.status).toBe(404);
  });
  it("GET /api/v1/product/:id → 400/500 for malformed id", async () => {
    const res = await request(app).get("/api/v1/product/not-an-id");
    expect([400, 500]).toContain(res.status);
  });
});

describe("Product API — admin routes", () => {
  it("GET /api/v1/admin/products → 401 without auth", async () => {
    const res = await request(app).get("/api/v1/admin/products");
    expect(res.status).toBe(401);
  });
  it("GET /api/v1/admin/products → 200 with admin auth", async () => {
    if (!adminCookie) return;
    const res = await request(app).get("/api/v1/admin/products").set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });
  it("DELETE /api/v1/admin/product/:id → 401 without auth", async () => {
    const res = await request(app).delete(`/api/v1/admin/product/${productId}`);
    expect(res.status).toBe(401);
  });
});

describe("Product API — reviews", () => {
  // GET /api/v1/reviews requires authentication (isAuthenticatedUser middleware).
  // Unauthenticated requests correctly return 401 — tests must send the admin
  // cookie so we reach the controller logic and get the actual 404 / 200.
  it("GET /api/v1/reviews → 401 without auth", async () => {
    const res = await request(app).get("/api/v1/reviews?id=000000000000000000000000");
    expect(res.status).toBe(401);
  });
  it("GET /api/v1/reviews → 404 for unknown product (with auth)", async () => {
    if (!adminCookie) return;
    const res = await request(app)
      .get("/api/v1/reviews?id=000000000000000000000000")
      .set("Cookie", adminCookie);
    expect(res.status).toBe(404);
  });
  it("GET /api/v1/reviews → 200 for seeded product (with auth)", async () => {
    if (!adminCookie) return;
    const res = await request(app)
      .get(`/api/v1/reviews?id=${productId}`)
      .set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("reviews");
  });
});
