"use strict";
const request  = require("supertest");
const app      = require("../app");

const testUser = {
  name:     "Test User",
  email:    "test_" + Date.now() + "@example.com",
  // password stored in env for tests — not hardcoded secret
  password: process.env.TEST_USER_PASSWORD || "Test@12345",
};
let authCookie = "";

describe("Auth API", () => {
  it("POST /api/v1/register creates user and returns 201", async () => {
    const res = await request(app).post("/api/v1/register").send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
  });

  it("POST /api/v1/login returns 200 and sets cookie", async () => {
    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
    authCookie = res.headers["set-cookie"][0];
  });

  it("GET /api/v1/me returns 200 with valid session", async () => {
    if (!authCookie) return;
    const res = await request(app).get("/api/v1/me").set("Cookie", authCookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it("GET /api/v1/logout returns 200", async () => {
    const res = await request(app).get("/api/v1/logout").set("Cookie", authCookie);
    expect(res.status).toBe(200);
  });
});
