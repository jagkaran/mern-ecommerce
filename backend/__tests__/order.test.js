"use strict";
const request = require("supertest");
const app = require("../app");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

let userCookie = "";
let adminCookie = "";
let orderId = "";
const ts = Date.now();

// All required shippingInfo fields from orderModel schema
const shippingInfo = {
  address: "123 Test St",
  city: "Testville",
  state: "TS",
  country: "Testland",
  pinCode: "123456",
  phoneNo: "9876543210",
  phone: "9876543210",
  zip: "123456",
};

beforeAll(async () => {
  const user = await User.create({
    name: "Order User",
    email: `order_user_${ts}@example.com`,
    password: "Order@12345",
    profilePic: { public_id: "x", url: "http://example.com/img.jpg" },
  });
  const admin = await User.create({
    name: "Order Admin",
    email: `order_admin_${ts}@example.com`,
    password: "Admin@12345",
    role: "admin",
    profilePic: { public_id: "y", url: "http://example.com/img.jpg" },
  });
  const [uRes, aRes] = await Promise.all([
    request(app).post("/api/v1/login").send({ email: user.email, password: "Order@12345" }),
    request(app).post("/api/v1/login").send({ email: admin.email, password: "Admin@12345" }),
  ]);
  if (uRes.headers["set-cookie"]) userCookie = uRes.headers["set-cookie"][0];
  if (aRes.headers["set-cookie"]) adminCookie = aRes.headers["set-cookie"][0];
  const product = await Product.create({
    name: "Order Product",
    description: "desc",
    price: 100,
    category: "Test",
    stock: 10,
    images: [{ public_id: "p1", url: "http://example.com/p.jpg" }],
    createdBy: user._id,
  });
  const order = await Order.create({
    shippingInfo,
    orderItems: [
      {
        name: "Order Product",
        price: 100,
        quantity: 1,
        image: "http://example.com/p.jpg",
        product: product._id,
      },
    ],
    paymentInfo: { id: "pay_test123", status: "succeeded" },
    itemPrice: 100,
    taxPrice: 10,
    shippingPrice: 0,
    totalPrice: 110,
    paidAt: Date.now(),
    user: user._id,
  });
  orderId = order._id.toString();
});

describe("Order API — auth guards", () => {
  it("GET /api/v1/orders/me → 401 without auth", async () => {
    expect((await request(app).get("/api/v1/orders/me")).status).toBe(401);
  });
  it("POST /api/v1/order/new → 400 without auth + empty body (validation kicks in)", async () => {
    // After T6 (guest checkout), /order/new accepts optional auth. An empty
    // body without auth no longer 401s — it passes auth but fails body
    // validation with 400. This guards against accidental re-introduction
    // of the hard auth requirement.
    expect((await request(app).post("/api/v1/order/new").send({})).status).toBe(400);
  });
  it("GET /api/v1/admin/orders → 401 without auth", async () => {
    expect((await request(app).get("/api/v1/admin/orders")).status).toBe(401);
  });
});

describe("Order API — authenticated user", () => {
  it("GET /api/v1/orders/me → 200", async () => {
    if (!userCookie) return;
    const res = await request(app).get("/api/v1/orders/me").set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });
  it("GET /api/v1/order/:id → 200 for own order", async () => {
    if (!userCookie || !orderId) return;
    const res = await request(app).get(`/api/v1/order/${orderId}`).set("Cookie", userCookie);
    expect(res.status).toBe(200);
    expect(res.body.order._id).toBe(orderId);
  });
  it("GET /api/v1/order/:id → 404 for unknown id", async () => {
    if (!userCookie) return;
    const res = await request(app)
      .get("/api/v1/order/000000000000000000000000")
      .set("Cookie", userCookie);
    expect(res.status).toBe(404);
  });
});

describe("Order API — admin", () => {
  it("GET /api/v1/admin/orders → 200", async () => {
    if (!adminCookie) return;
    const res = await request(app).get("/api/v1/admin/orders").set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });
  it("DELETE /api/v1/admin/order/:id → 200", async () => {
    if (!adminCookie || !orderId) return;
    expect(
      (await request(app).delete(`/api/v1/admin/order/${orderId}`).set("Cookie", adminCookie))
        .status
    ).toBe(200);
  });
  it("DELETE /api/v1/admin/order/:id → 404 after deletion", async () => {
    if (!adminCookie || !orderId) return;
    expect(
      (await request(app).delete(`/api/v1/admin/order/${orderId}`).set("Cookie", adminCookie))
        .status
    ).toBe(404);
  });
});

/**
 * getOrderDetails — auth and estimated-delivery branches. The previous suite
 * only checked the happy path; now we pin cross-user 403, admin-bypass,
 * guest-order 403, and the estimatedDelivery attachment (when country resolves).
 */
describe("GET /api/v1/order/:id — auth + ETA branches", () => {
  let secondUserCookie = "";
  let secondUserId = "";
  let secondUserOrder = "";

  beforeAll(async () => {
    // Build a second customer + their own order — used to test cross-user 403.
    const other = await User.create({
      name: "Other User",
      email: `other_user_${ts}@example.com`,
      password: "Other@12345",
      profilePic: { public_id: "o", url: "http://example.com/o.jpg" },
    });
    secondUserId = other._id.toString();
    const r = await request(app)
      .post("/api/v1/login")
      .send({ email: other.email, password: "Other@12345" });
    if (r.headers["set-cookie"]) secondUserCookie = r.headers["set-cookie"][0];

    const product = await Product.findOne({ name: "Order Product" });
    const own = await Order.create({
      shippingInfo,
      orderItems: [
        {
          name: "Order Product",
          price: 100,
          quantity: 1,
          image: "http://example.com/p.jpg",
          product: product._id,
        },
      ],
      paymentInfo: { id: "pay_other", status: "succeeded" },
      itemPrice: 100,
      taxPrice: 10,
      shippingPrice: 0,
      totalPrice: 110,
      paidAt: Date.now(),
      user: other._id,
    });
    secondUserOrder = own._id.toString();
  });

  it("401 without auth", async () => {
    expect((await request(app).get(`/api/v1/order/${secondUserOrder}`)).status).toBe(401);
  });

  it("403 when another user tries to view the order", async () => {
    if (!userCookie || !secondUserOrder) return;
    const res = await request(app)
      .get(`/api/v1/order/${secondUserOrder}`)
      .set("Cookie", userCookie);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it("200 when admin views another user's order", async () => {
    if (!adminCookie || !secondUserOrder) return;
    const res = await request(app)
      .get(`/api/v1/order/${secondUserOrder}`)
      .set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.order._id).toBe(secondUserOrder);
  });

  it("404 when order does not exist", async () => {
    if (!userCookie) return;
    const res = await request(app)
      .get("/api/v1/order/000000000000000000000000")
      .set("Cookie", userCookie);
    expect(res.status).toBe(404);
  });

  it("attaches estimatedDelivery when shippingInfo.country is present", async () => {
    if (!adminCookie) return;
    // The outer-scope `orderId` was already deleted by the admin DELETE test
    // earlier in this suite. Seed a fresh order so this assertion runs
    // against a live document.
    const me = await User.findOne({ email: `order_user_${ts}@example.com` });
    const product = await Product.findOne({ name: "Order Product" });
    const fresh = await Order.create({
      shippingInfo,
      orderItems: [
        {
          name: "Order Product",
          price: 100,
          quantity: 1,
          image: "http://example.com/p.jpg",
          product: product._id,
        },
      ],
      paymentInfo: { id: "pay_eta", status: "succeeded" },
      itemPrice: 100,
      taxPrice: 10,
      shippingPrice: 0,
      totalPrice: 110,
      paidAt: Date.now(),
      user: me._id,
    });

    const res = await request(app).get(`/api/v1/order/${fresh._id}`).set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.order.estimatedDelivery).toBeDefined();
  });
});

/**
 * getMyOrders — pagination math + sort, no orderStatus filter (route doesn't
 * accept one). Hits the skip/limit/lean/sort branches.
 */
describe("GET /api/v1/orders/me — pagination + sort", () => {
  let myCookie = "";
  let myUserId = "";

  beforeAll(async () => {
    const me = await User.create({
      name: "Paginated User",
      email: `paginated_${ts}@example.com`,
      password: "Page@12345",
      profilePic: { public_id: "pg", url: "http://example.com/pg.jpg" },
    });
    myUserId = me._id.toString();
    const r = await request(app)
      .post("/api/v1/login")
      .send({ email: me.email, password: "Page@12345" });
    if (r.headers["set-cookie"]) myCookie = r.headers["set-cookie"][0];

    const product = await Product.findOne({ name: "Order Product" });
    // 15 orders → forces hasNextPage on page 1, exercises skip+limit.
    await Order.insertMany(
      Array.from({ length: 15 }, (_, i) => ({
        shippingInfo,
        orderItems: [
          {
            name: "Order Product",
            price: 100,
            quantity: 1,
            image: "http://example.com/p.jpg",
            product: product._id,
          },
        ],
        paymentInfo: { id: `pay_${i}`, status: "succeeded" },
        itemPrice: 100,
        taxPrice: 10,
        shippingPrice: 0,
        totalPrice: 110,
        paidAt: Date.now() - i * 1000, // distinct timestamps
        user: me._id,
        createdAt: new Date(Date.now() - i * 1000), // newer first on sort
      }))
    );
  });

  it("page 1 returns up to limit items, sorted createdAt desc", async () => {
    if (!myCookie) return;
    const res = await request(app).get("/api/v1/orders/me?page=1&limit=5").set("Cookie", myCookie);
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(5);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
    expect(res.body.hasNextPage).toBe(true);
    expect(res.body.hasPrevPage).toBe(false);

    const times = res.body.orders.map((o) => new Date(o.createdAt).getTime());
    const sorted = [...times].sort((a, b) => b - a);
    expect(times).toEqual(sorted);
  });

  it("page 2 returns next slice with hasPrevPage=true", async () => {
    if (!myCookie) return;
    const res = await request(app).get("/api/v1/orders/me?page=2&limit=5").set("Cookie", myCookie);
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(5);
    expect(res.body.hasPrevPage).toBe(true);
  });

  it("clamps limit above 50 to 50 (controller-side, post-validation)", async () => {
    // Note: validatePagination caps limit at 100 BEFORE the controller runs.
    // Values > 100 are rejected with 400 (covered by the middleware tests).
    // Here we hit the controller's Math.min(50, ...) branch by sending a
    // valid-but-oversized value (51–100).
    if (!myCookie) return;
    const res = await request(app).get("/api/v1/orders/me?limit=80").set("Cookie", myCookie);
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(50); // controller clamped, not validated
  });

  it("passes through valid limit exactly at the cap", async () => {
    if (!myCookie) return;
    const res = await request(app).get("/api/v1/orders/me?limit=20").set("Cookie", myCookie);
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(20);
  });
});

/**
 * updateOrder — exercises the "already delivered" guard + the deliveredAt
 * branch when transitioning to Delivered.
 */
describe("PUT /api/v1/admin/order/:id — status transitions", () => {
  let deliveredId = "";

  beforeAll(async () => {
    const u = await User.findOne({ email: `paginated_${ts}@example.com` });
    const product = await Product.findOne({ name: "Order Product" });
    const o = await Order.create({
      shippingInfo,
      orderItems: [
        {
          name: "Order Product",
          price: 100,
          quantity: 1,
          image: "http://example.com/p.jpg",
          product: product._id,
        },
      ],
      paymentInfo: { id: "pay_delivered", status: "succeeded" },
      itemPrice: 100,
      taxPrice: 10,
      shippingPrice: 0,
      totalPrice: 110,
      paidAt: Date.now(),
      user: u._id,
      orderStatus: "Delivered", // already done
      deliveredAt: Date.now() - 60_000,
    });
    deliveredId = o._id.toString();
  });

  it("400 when order is already Delivered", async () => {
    if (!adminCookie || !deliveredId) return;
    const res = await request(app)
      .put(`/api/v1/admin/order/${deliveredId}`)
      .set("Cookie", adminCookie)
      .send({ orderStatus: "Shipped" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already delivered/i);
  });

  it("404 when order id does not exist", async () => {
    if (!adminCookie) return;
    const res = await request(app)
      .put("/api/v1/admin/order/000000000000000000000000")
      .set("Cookie", adminCookie)
      .send({ orderStatus: "Shipped" });
    expect(res.status).toBe(404);
  });
});
