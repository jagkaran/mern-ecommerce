"use strict";
const request = require("supertest");
const app     = require("../app");
const User    = require("../models/userModel");
const Product = require("../models/productModel");

const ts = Date.now();
let userCookie  = "";
let user2Cookie = "";
let productId   = "";
let reviewId    = "";

beforeAll(async () => {
  const [u1, u2] = await Promise.all([
    User.create({
      name: "Reviewer One",
      email: `reviewer1_${ts}@example.com`,
      password: "Review@12345",
      profilePic: { public_id: "rv1", url: "http://example.com/rv1.jpg" },
    }),
    User.create({
      name: "Reviewer Two",
      email: `reviewer2_${ts}@example.com`,
      password: "Review@12345",
      profilePic: { public_id: "rv2", url: "http://example.com/rv2.jpg" },
    }),
  ]);

  const product = await Product.create({
    name:        "Reviewable Product",
    description: "A product for review tests",
    price:       50,
    category:    "Test",
    stock:       5,
    images:      [{ public_id: "rp1", url: "http://example.com/rp.jpg" }],
    createdBy:   u1._id,
  });
  productId = product._id.toString();

  const [r1, r2] = await Promise.all([
    request(app).post("/api/v1/login").send({ email: u1.email, password: "Review@12345" }),
    request(app).post("/api/v1/login").send({ email: u2.email, password: "Review@12345" }),
  ]);
  if (r1.headers["set-cookie"]) userCookie  = r1.headers["set-cookie"][0];
  if (r2.headers["set-cookie"]) user2Cookie = r2.headers["set-cookie"][0];
});

describe("Review API — auth guards", () => {
  it("PUT /api/v1/review → 401 without auth", async () => {
    const res = await request(app)
      .put("/api/v1/review")
      .send({ rating: 4, comment: "looks nice", productId });
    expect(res.status).toBe(401);
  });
  it("GET /api/v1/reviews → 401 without auth", async () => {
    const res = await request(app).get(`/api/v1/reviews?id=${productId}`);
    expect(res.status).toBe(401);
  });
  it("DELETE /api/v1/review → 401 without auth", async () => {
    const res = await request(app)
      .delete(`/api/v1/review?id=000000000000000000000000&productId=${productId}`);
    expect(res.status).toBe(401);
  });
});

describe("Review API — create & fetch", () => {
  it("PUT /api/v1/review → 200 creates a new review", async () => {
    if (!userCookie || !productId) return;
    const res = await request(app)
      .put("/api/v1/review")
      .set("Cookie", userCookie)
      .send({ rating: 5, comment: "Excellent product!", productId });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // capture review id for later tests
    const prod = await Product.findById(productId);
    reviewId = prod.reviews[0]?._id?.toString();
  });

  it("PUT /api/v1/review → 200 second user adds review", async () => {
    if (!user2Cookie || !productId) return;
    const res = await request(app)
      .put("/api/v1/review")
      .set("Cookie", user2Cookie)
      .send({ rating: 3, comment: "Average product", productId });
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/reviews → 200 returns reviews array", async () => {
    if (!userCookie || !productId) return;
    const res = await request(app)
      .get(`/api/v1/reviews?id=${productId}`)
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reviews)).toBe(true);
    expect(res.body.reviews.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/v1/reviews → 404 for unknown product", async () => {
    if (!userCookie) return;
    const res = await request(app)
      .get("/api/v1/reviews?id=000000000000000000000000")
      .set("Cookie", userCookie);
    expect(res.status).toBe(404);
  });
});

describe("Review API — update existing review", () => {
  it("PUT /api/v1/review → 200 updates own review in-place", async () => {
    if (!userCookie || !productId) return;
    const res = await request(app)
      .put("/api/v1/review")
      .set("Cookie", userCookie)
      .send({ rating: 2, comment: "Actually not that good", productId });
    expect(res.status).toBe(200);
    // verify numOfReviews did NOT increase (update, not insert)
    const prod = await Product.findById(productId);
    // we have exactly 2 users who reviewed, so count should stay at 2
    expect(prod.reviews.length).toBe(2);
  });

  it("PUT /api/v1/review → 404 for unknown product", async () => {
    if (!userCookie) return;
    const res = await request(app)
      .put("/api/v1/review")
      .set("Cookie", userCookie)
      // comment is >=5 chars so validation passes; unknown productId reaches controller → 404
      .send({ rating: 3, comment: "no good at all", productId: "000000000000000000000000" });
    expect(res.status).toBe(404);
  });
});

describe("Review API — delete", () => {
  it("DELETE /api/v1/review → 200 removes a review", async () => {
    if (!userCookie || !reviewId || !productId) return;
    const res = await request(app)
      .delete(`/api/v1/review?id=${reviewId}&productId=${productId}`)
      .set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // verify the review is actually gone
    const prod = await Product.findById(productId);
    const stillExists = prod.reviews.some((r) => r._id.toString() === reviewId);
    expect(stillExists).toBe(false);
  });

  it("DELETE /api/v1/review → 404 for unknown product", async () => {
    if (!userCookie) return;
    const res = await request(app)
      .delete("/api/v1/review?id=000000000000000000000000&productId=000000000000000000000000")
      .set("Cookie", userCookie);
    expect(res.status).toBe(404);
  });
});
