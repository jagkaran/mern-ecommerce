const request = require("supertest");
const app = require("../app");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const { optionalAuth } = require("../middleware/auth");

describe("Order model — guest fields", () => {
  it("accepts order without user when guestEmail provided", async () => {
    const o = await Order.create({
      shippingInfo: { address: "1 St", city: "C", state: "S", country: "X", zip: 12345, phone: 1234567890 },
      orderItems: [{ name: "x", price: 1, quantity: 1, image: "i", product: "64a000000000000000000000" }],
      paymentInfo: { id: "pi_test", status: "succeeded" },
      itemPrice: 1, taxPrice: 0, shippingPrice: 0, totalPrice: 1,
      paidAt: Date.now(),
      guestEmail: "guest@example.com",
      claimTokenHash: "abc123",
    });
    expect(o.guestEmail).toBe("guest@example.com");
    expect(o.user).toBeUndefined();
    expect(o.claimTokenHash).toBe("abc123");
  });
});

describe("GET /order/:id — guest-order access (C5 fix)", () => {
  let guestOrderId, regularUserId, regularUserCookie, adminCookie;

  beforeAll(async () => {
    // Set up a guest order — no `user` set.
    const guest = await Order.create({
      shippingInfo: { address: "1 St", city: "C", state: "S", country: "X", zip: 12345, phone: 1234567890 },
      orderItems: [{ name: "x", price: 1, quantity: 1, image: "i", product: "64a000000000000000000000" }],
      paymentInfo: { id: "pi_guest", status: "succeeded" },
      itemPrice: 1, taxPrice: 0, shippingPrice: 0, totalPrice: 1,
      paidAt: Date.now(),
      guestEmail: "guest-order-access@example.com",
    });
    guestOrderId = guest._id.toString();

    // A regular user (NOT the owner of guest order).
    const u = await User.create({
      name: "Stranger User", email: `stranger_${Date.now()}@example.com`,
      password: "Stranger1!", profilePic: { public_id: "s", url: "http://e.com/s.jpg" },
    });
    regularUserId = u._id;
    const r = await request(app).post("/api/v1/login").send({ email: u.email, password: "Stranger1!" });
    if (r.headers["set-cookie"]) regularUserCookie = r.headers["set-cookie"][0];

    // An admin user — should be able to view the guest order for support.
    const a = await User.create({
      name: "Admin User", email: `admin_${Date.now()}@example.com`,
      password: "Admin@1234", role: "admin",
      profilePic: { public_id: "a", url: "http://e.com/a.jpg" },
    });
    const ar = await request(app).post("/api/v1/login").send({ email: a.email, password: "Admin@1234" });
    if (ar.headers["set-cookie"]) adminCookie = ar.headers["set-cookie"][0];
  });

  it("returns 403 (not 500) when a non-admin authed user requests a guest order (C5 NPE guard)", async () => {
    if (!regularUserCookie) return;
    const res = await request(app).get(`/api/v1/order/${guestOrderId}`).set("Cookie", regularUserCookie);
    // Crucially this is NOT 500 — the C5 null-guard returns a friendly 403.
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/claim|authorized/i);
  });

  it("returns 200 for admin viewing the same guest order", async () => {
    if (!adminCookie) return;
    const res = await request(app).get(`/api/v1/order/${guestOrderId}`).set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.order.guestEmail).toBe("guest-order-access@example.com");
  });
});

describe("optionalAuth middleware", () => {
  // Mount optionalAuth on a tiny inline app so the probe in backend/app.js
  // is not required — T6 will remove that probe (and the live /whoami route)
  // when guest-ordering ships.
  const probeApp = require("express")();
  probeApp.use(require("cookie-parser")());
  probeApp.get("/whoami", optionalAuth, (req, res) =>
    res.json({ user: req.user ? { email: req.user.email } : null })
  );

  it("yields req.user=null when no cookie (no 401)", async () => {
    const res = await request(probeApp).get("/whoami");
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
  it("hydrates req.user from valid cookie", async () => {
    const u = await User.create({
      name: "OA Test",
      email: `oa_${Date.now()}@x.io`,
      password: "Passw0rd!",
      profilePic: { public_id: "a", url: "http://e.com/i.jpg" },
    });
    const login = await request(app).post("/api/v1/login").send({ email: u.email, password: "Passw0rd!" });
    const cookie = login.headers["set-cookie"][0];
    const res = await request(probeApp).get("/whoami").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(u.email);
  });
  it("treats garbage token as anonymous (no 401)", async () => {
    const res = await request(probeApp).get("/whoami").set("Cookie", "token=garbage");
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
});
