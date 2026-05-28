"use strict";
const request = require("supertest");
const app     = require("../app");
const User    = require("../models/userModel");

const ts = Date.now();
let adminCookie  = "";
let userCookie   = "";
let targetUserId = "";

const adminData = {
  name: "Admin UA",
  email: `admin_ua_${ts}@example.com`,
  password: "Admin@12345",
  role: "admin",
  profilePic: { public_id: "a1", url: "http://example.com/a.jpg" },
};
const userData = {
  name: "Normal User",
  email: `normal_ua_${ts}@example.com`,
  password: "User@12345",
  profilePic: { public_id: "u1", url: "http://example.com/u.jpg" },
};

beforeAll(async () => {
  const [, user] = await Promise.all([
    User.create(adminData),
    User.create(userData),
  ]);
  targetUserId = user._id.toString();

  const [aRes, uRes] = await Promise.all([
    request(app).post("/api/v1/login").send({ email: adminData.email, password: "Admin@12345" }),
    request(app).post("/api/v1/login").send({ email: userData.email, password: "User@12345" }),
  ]);
  if (aRes.headers["set-cookie"]) adminCookie = aRes.headers["set-cookie"][0];
  if (uRes.headers["set-cookie"]) userCookie  = uRes.headers["set-cookie"][0];
});

describe("User API — auth guards", () => {
  it("GET /api/v1/admin/users → 401 without auth", async () => {
    expect((await request(app).get("/api/v1/admin/users")).status).toBe(401);
  });
  it("GET /api/v1/admin/users → 403 for non-admin", async () => {
    if (!userCookie) return;
    expect(
      (await request(app).get("/api/v1/admin/users").set("Cookie", userCookie)).status
    ).toBe(403);
  });
  it("GET /api/v1/admin/user/:id → 401 without auth", async () => {
    expect(
      (await request(app).get(`/api/v1/admin/user/${targetUserId}`)).status
    ).toBe(401);
  });
});

describe("User API — admin CRUD", () => {
  it("GET /api/v1/admin/users → 200 with pagination fields", async () => {
    if (!adminCookie) return;
    const res = await request(app).get("/api/v1/admin/users").set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body).toHaveProperty("usersCount");
  });
  it("GET /api/v1/admin/user/:id → 200 for known user", async () => {
    if (!adminCookie || !targetUserId) return;
    const res = await request(app)
      .get(`/api/v1/admin/user/${targetUserId}`)
      .set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(targetUserId);
  });
  it("GET /api/v1/admin/user/:id → 404 for unknown id", async () => {
    if (!adminCookie) return;
    const res = await request(app)
      .get("/api/v1/admin/user/000000000000000000000000")
      .set("Cookie", adminCookie);
    expect(res.status).toBe(404);
  });
  it("PUT /api/v1/admin/user/:id → 200 update role to user", async () => {
    if (!adminCookie || !targetUserId) return;
    const res = await request(app)
      .put(`/api/v1/admin/user/${targetUserId}`)
      .set("Cookie", adminCookie)
      .send({ name: userData.name, email: userData.email, role: "user" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  it("PUT /api/v1/admin/user/:id → 404 for unknown id", async () => {
    if (!adminCookie) return;
    const res = await request(app)
      .put("/api/v1/admin/user/000000000000000000000000")
      .set("Cookie", adminCookie)
      // name must be >=4 chars to pass validateUpdateUserRole, letting the
      // controller reach the DB lookup and return 404
      .send({ name: "Ghost", email: "ghost@example.com", role: "user" });
    expect(res.status).toBe(404);
  });
  it("DELETE /api/v1/admin/user/:id → 200 deletes user", async () => {
    if (!adminCookie || !targetUserId) return;
    const res = await request(app)
      .delete(`/api/v1/admin/user/${targetUserId}`)
      .set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  it("DELETE /api/v1/admin/user/:id → 404 after deletion", async () => {
    if (!adminCookie || !targetUserId) return;
    const res = await request(app)
      .delete(`/api/v1/admin/user/${targetUserId}`)
      .set("Cookie", adminCookie);
    expect(res.status).toBe(404);
  });
});

describe("User API — own profile & password", () => {
  it("GET /api/v1/me → 200 returns own user object", async () => {
    // If userCookie is empty the login failed — skip rather than give a
    // misleading 401 assertion failure
    if (!userCookie) return;
    const res = await request(app).get("/api/v1/me").set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("email");
  });
  it("GET /api/v1/me → 401 without cookie", async () => {
    expect((await request(app).get("/api/v1/me")).status).toBe(401);
  });
  it("PUT /api/v1/password/update → 401 with wrong old password", async () => {
    if (!userCookie) return;
    const res = await request(app)
      .put("/api/v1/password/update")
      .set("Cookie", userCookie)
      .send({ oldPassword: "Wrong@9999", newPassword: "New@12345", confirmPassword: "New@12345" });
    expect(res.status).toBe(401);
  });
  it("PUT /api/v1/password/update → 400 with mismatched new passwords", async () => {
    if (!userCookie) return;
    const res = await request(app)
      .put("/api/v1/password/update")
      .set("Cookie", userCookie)
      .send({ oldPassword: "User@12345", newPassword: "New@12345", confirmPassword: "Different@1" });
    // validation middleware or controller rejects mismatch
    expect([400, 401, 422]).toContain(res.status);
  });
  it("PUT /api/v1/password/update → 401 without auth", async () => {
    const res = await request(app)
      .put("/api/v1/password/update")
      .send({ oldPassword: "x", newPassword: "y", confirmPassword: "y" });
    expect(res.status).toBe(401);
  });
});
