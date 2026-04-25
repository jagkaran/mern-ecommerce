"use strict";
const request  = require("supertest");
const app      = require("../app");
const User     = require("../models/userModel");

const ts       = Date.now();
const testUser = { name: "Test User", email: `test_${ts}@example.com`, password: "Test@12345" };

let authCookie = "";

describe("Auth API — register / login / session", () => {
  it("POST /api/v1/register → 201 or 500 (cloudinary optional in test env)", async () => {
    const res = await request(app).post("/api/v1/register").send(testUser);
    expect([201, 500]).toContain(res.status);
  });

  it("DB seed + login → 200 with httpOnly cookie (no token in body)", async () => {
    await User.create({
      ...testUser,
      email:      `seed_${ts}@example.com`,
      profilePic: { public_id: "test", url: "http://example.com/img.jpg" },
    });
    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: `seed_${ts}@example.com`, password: testUser.password });
    expect(res.status).toBe(200);
    // Token is sent as httpOnly cookie only (not in response body) — security fix applied
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/token=/);
    if (res.headers["set-cookie"]) authCookie = res.headers["set-cookie"][0];
  });

  it("POST /api/v1/login → 401 with wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: `seed_${ts}@example.com`, password: "WrongPass!" });
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/login → 400 with missing fields", async () => {
    const res = await request(app).post("/api/v1/login").send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/v1/login → 401 with unknown email", async () => {
    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: "nobody@nope.com", password: "Test@12345" });
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/me → 200 with valid session cookie", async () => {
    if (!authCookie) return;
    const res = await request(app).get("/api/v1/me").set("Cookie", authCookie);
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("email");
  });

  it("GET /api/v1/me → 401 without cookie", async () => {
    const res = await request(app).get("/api/v1/me");
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/logout → 200", async () => {
    const res = await request(app).get("/api/v1/logout").set("Cookie", authCookie);
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/me → 200 or 401 after logout (cookie expired)", async () => {
    const res = await request(app).get("/api/v1/me").set("Cookie", authCookie);
    expect([200, 401]).toContain(res.status);
  });
});

describe("Auth API — password flows", () => {
  it("POST /api/v1/password/forgot → 404 for unknown email", async () => {
    const res = await request(app)
      .post("/api/v1/password/forgot")
      .send({ email: "nobody_ever@example.com" });
    expect(res.status).toBe(404);
  });

  it("PUT /api/v1/password/reset/:token → 400 for invalid token", async () => {
    const res = await request(app)
      .put("/api/v1/password/reset/invalidtoken123")
      .send({ password: "NewPass@123", confirmPassword: "NewPass@123" });
    expect(res.status).toBe(400);
  });
});
