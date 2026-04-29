"use strict";
const request  = require("supertest");
const app      = require("../app");
const User     = require("../models/userModel");
const Product  = require("../models/productModel");
const Order    = require("../models/orderModel");

let userCookie  = "";
let adminCookie = "";
let orderId     = "";
const ts = Date.now();

// All required shippingInfo fields from orderModel schema
const shippingInfo = {
  address:  "123 Test St",
  city:     "Testville",
  state:    "TS",
  country:  "Testland",
  pinCode:  "123456",
  phoneNo:  "9876543210",
  phone:    "9876543210",
  zip:      "123456",
};

beforeAll(async () => {
  const user = await User.create({
    name: "Order User", email: `order_user_${ts}@example.com`, password: "Order@12345",
    profilePic: { public_id: "x", url: "http://example.com/img.jpg" },
  });
  const admin = await User.create({
    name: "Order Admin", email: `order_admin_${ts}@example.com`, password: "Admin@12345",
    role: "admin", profilePic: { public_id: "y", url: "http://example.com/img.jpg" },
  });
  const [uRes, aRes] = await Promise.all([
    request(app).post("/api/v1/login").send({ email: user.email,  password: "Order@12345" }),
    request(app).post("/api/v1/login").send({ email: admin.email, password: "Admin@12345" }),
  ]);
  if (uRes.headers["set-cookie"])  userCookie  = uRes.headers["set-cookie"][0];
  if (aRes.headers["set-cookie"])  adminCookie = aRes.headers["set-cookie"][0];
  const product = await Product.create({
    name: "Order Product", description: "desc", price: 100, category: "Test", stock: 10,
    images: [{ public_id: "p1", url: "http://example.com/p.jpg" }], createdBy: user._id,
  });
  const order = await Order.create({
    shippingInfo,
    orderItems: [{ name: "Order Product", price: 100, quantity: 1,
                   image: "http://example.com/p.jpg", product: product._id }],
    paymentInfo: { id: "pay_test123", status: "succeeded" },
    itemPrice: 100, taxPrice: 10, shippingPrice: 0, totalPrice: 110,
    paidAt: Date.now(), user: user._id,
  });
  orderId = order._id.toString();
});

describe("Order API — auth guards", () => {
  it("GET /api/v1/orders/me → 401 without auth", async () => {
    expect((await request(app).get("/api/v1/orders/me")).status).toBe(401);
  });
  it("POST /api/v1/order/new → 401 without auth", async () => {
    expect((await request(app).post("/api/v1/order/new").send({})).status).toBe(401);
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
    const res = await request(app).get("/api/v1/order/000000000000000000000000").set("Cookie", userCookie);
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
    expect((await request(app).delete(`/api/v1/admin/order/${orderId}`).set("Cookie", adminCookie)).status).toBe(200);
  });
  it("DELETE /api/v1/admin/order/:id → 404 after deletion", async () => {
    if (!adminCookie || !orderId) return;
    expect((await request(app).delete(`/api/v1/admin/order/${orderId}`).set("Cookie", adminCookie)).status).toBe(404);
  });
});
