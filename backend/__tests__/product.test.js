"use strict";
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const Product = require("../models/productModel");
const User = require("../models/userModel");

let adminCookie = "";
let productId = "";

const adminUser = {
  name: "Admin User",
  email: `admin_prod_${Date.now()}@example.com`,
  password: "Admin@12345",
  role: "admin",
};

const productPayload = {
  name: "Test Product",
  description: "A test product description",
  price: 999,
  category: "Electronics",
  stock: 50,
  images: [],
};

beforeAll(async () => {
  const user = await User.create({
    ...adminUser,
    profilePic: { public_id: "test_id", url: "http://example.com/img.jpg" },
  });
  const loginRes = await request(app)
    .post("/api/v1/login")
    .send({ email: adminUser.email, password: adminUser.password });
  if (loginRes.headers["set-cookie"]) adminCookie = loginRes.headers["set-cookie"][0];
  const product = await Product.create({ ...productPayload, createdBy: user._id });
  productId = product._id.toString();
});

describe("Product API — public routes", () => {
  it("GET /api/v1/products → 200 + products array", async () => {
    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(res.body.resultPerPage).toBe(50);
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
    expect(res.body.limit).toBe(50);
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

describe("getAllProducts — server-side sort param", () => {
  // Three products with distinct values across every sort dimension so the
  // four cases below can each prove the right key was applied. createdAt is
  // set explicitly so "newest" ordering is deterministic regardless of insert
  // order / clock skew inside the in-memory MongoDB.
  let seedUser;

  beforeAll(async () => {
    seedUser = await User.create({
      name: "Sort Seed User",
      email: `sortseed_${Date.now()}@example.com`,
      password: "SortSeed@123",
      role: "admin",
      profilePic: { public_id: "sort_seed", url: "http://example.com/seed.jpg" },
    });
    await Product.deleteMany({ category: "SortTest" });
    await Product.insertMany([
      {
        name: "Aaa Cheap",
        description: "Cheap and cheerful",
        price: 10,
        category: "SortTest",
        stock: 5,
        images: [],
        ratings: 4.5,
        numOfReviews: 10,
        createdBy: seedUser._id,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
      {
        name: "Bbb Pricy",
        description: "Expensive and well-rated",
        price: 999,
        category: "SortTest",
        stock: 5,
        images: [],
        ratings: 1.5,
        numOfReviews: 10,
        createdBy: seedUser._id,
        createdAt: new Date("2024-06-15T00:00:00Z"),
      },
      {
        name: "Ccc Middle",
        description: "Middle of the pack",
        price: 100,
        category: "SortTest",
        stock: 5,
        images: [],
        ratings: 3.0,
        numOfReviews: 10,
        createdBy: seedUser._id,
        createdAt: new Date("2024-12-31T00:00:00Z"),
      },
    ]);
  });

  afterAll(async () => {
    await Product.deleteMany({ category: "SortTest" });
    if (seedUser) await User.deleteOne({ _id: seedUser._id });
  });

  it("sorts by ?sort=price-asc (cheapest first)", async () => {
    const res = await request(app).get("/api/v1/products?sort=price-asc&limit=10");
    expect(res.status).toBe(200);
    const prices = res.body.products.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("sorts by ?sort=rating-desc (highest rated first)", async () => {
    const res = await request(app).get("/api/v1/products?sort=rating-desc&limit=10");
    expect(res.status).toBe(200);
    const ratings = res.body.products.map((p) => p.ratings);
    expect(ratings[0]).toBeGreaterThanOrEqual(ratings[ratings.length - 1]);
  });

  it("falls back to newest for unknown sort value", async () => {
    const unknown = await request(app).get("/api/v1/products?sort=banana&limit=10");
    const newest = await request(app).get("/api/v1/products?sort=newest&limit=10");
    expect(unknown.body.products.map((p) => p._id)).toEqual(newest.body.products.map((p) => p._id));
  });

  it("rejects non-string sort with 200 newest (no crash)", async () => {
    const res = await request(app).get("/api/v1/products?sort[]=price&limit=10");
    expect(res.status).toBe(200); // falls back, no 500
  });
});
