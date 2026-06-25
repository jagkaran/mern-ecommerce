"use strict";
/**
 * Pricing engine — guards every server-side price computed for an order.
 * Anything that lets a request sneak past pricing.js lets the client set
 * the price of their own order.
 *
 * These tests pin the behaviour the controllers depend on (orderController
 * + paymentController):
 *  - Bad/missing items → throws ErrorHandler with the right status
 *  - Product not in DB → 404
 *  - Stock check before pricing (does NOT silently let you order out-of-stock)
 *  - Quantity must be a positive integer (no float, no zero)
 *  - Tax = 15%, free shipping > $1000, flat $50 otherwise, total computed
 *  - RETURNED price uses the DB price, NOT any client-supplied field
 *    (this is the whole point — a price-tamper test)
 */
const Product = require("../models/productModel");
const {
  computeOrderPricing,
  TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT,
} = require("../utils/pricing");

let cheap, expensive;
let testUserId;

beforeAll(async () => {
  // Product schema requires createdBy — use ObjectID directly (no User needed).
  testUserId = new (require("mongoose").Types.ObjectId)();

  cheap = await Product.create({
    name: "Cheap", description: "for free-shipping math",
    price: 200, category: "Test", stock: 5,
    images: [{ public_id: "cheap", url: "http://example.com/c.jpg" }],
    createdBy: testUserId,
  });
  expensive = await Product.create({
    name: "Expensive", description: "for free-shipping threshold",
    price: 600, category: "Test", stock: 5,
    images: [{ public_id: "exp", url: "http://example.com/e.jpg" }],
    createdBy: testUserId,
  });
});

describe("computeOrderPricing — input validation", () => {
  it("empty array → 400", async () => {
    await expect(computeOrderPricing([])).rejects.toMatchObject({
      statusCode: 400,
      message:    expect.stringMatching(/at least one/i),
    });
  });

  it("non-array input → 400", async () => {
    await expect(computeOrderPricing(null)).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(computeOrderPricing("nope")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("unknown product id → 404", async () => {
    await expect(
      computeOrderPricing([{ product: "000000000000000000000000", quantity: 1 }])
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("zero / non-integer / negative quantity → 400", async () => {
    for (const q of [0, -1, 1.5, "two", NaN]) {
      await expect(
        computeOrderPricing([{ product: cheap._id.toString(), quantity: q }])
      ).rejects.toMatchObject({ statusCode: 400 });
    }
  });

  it("quantity exceeds stock → 400", async () => {
    await expect(
      computeOrderPricing([
        { product: cheap._id.toString(), quantity: cheap.stock + 1 },
      ])
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("computeOrderPricing — math", () => {
  it("flat shipping when subtotal ≤ threshold; tax = 0.15; total = sum", async () => {
    // subtotal = 200 * 2 = 400. shipping = 50 (below 1000). tax = 60.
    const r = await computeOrderPricing([
      { product: cheap._id.toString(), quantity: 2 },
    ]);
    expect(r.itemPrice).toBe(400);
    expect(r.shippingPrice).toBe(SHIPPING_FLAT);
    expect(r.taxPrice).toBe(Number((400 * TAX_RATE).toFixed(2)));
    expect(r.totalPrice).toBe(
      Number((400 + SHIPPING_FLAT + 400 * TAX_RATE).toFixed(2))
    );
  });

  it("free shipping when subtotal > 1000", async () => {
    // 600 * 2 = 1200 → shipping = 0, tax = 180, total = 1380.
    const r = await computeOrderPricing([
      { product: expensive._id.toString(), quantity: 2 },
    ]);
    expect(r.itemPrice).toBe(1200);
    expect(r.shippingPrice).toBe(0);
    expect(r.taxPrice).toBe(Number((1200 * TAX_RATE).toFixed(2)));
    expect(r.totalPrice).toBe(
      Number((1200 + 0 + 1200 * TAX_RATE).toFixed(2))
    );
  });

  it("multi-item subtotals add correctly", async () => {
    // 200 + 600 = 800. shipping = 50. tax = 120. total = 970.
    const r = await computeOrderPricing([
      { product: cheap._id.toString(), quantity: 1 },
      { product: expensive._id.toString(), quantity: 1 },
    ]);
    expect(r.itemPrice).toBe(800);
    expect(r.shippingPrice).toBe(50);
    expect(r.taxPrice).toBe(Number((800 * TAX_RATE).toFixed(2)));
    expect(r.validatedItems.length).toBe(2);
  });
});

describe("computeOrderPricing — price-tamper proof", () => {
  it("returned price is the DB price, never the client-supplied price field", async () => {
    const r = await computeOrderPricing([
      // Client says quantity 1 + price 99999 — must be ignored.
      {
        product:    cheap._id.toString(),
        quantity:   1,
        price:      99999,
        name:       "FAKE",
        image:      "http://evil.example/x",
      },
    ]);
    // DB cheap.price is 200. math is exact for qty=1: 200 + 50 + 30 = 280.
    expect(r.itemPrice).toBe(200);
    expect(r.totalPrice).toBe(280);
    // the validated item shrinks back to the DB product, dropping client
    // fields — controllers re-use this for the persisted order.
    expect(r.validatedItems[0].product.price).toBe(200);
    expect(r.validatedItems[0].product.name).toBe("Cheap");
  });
});

describe("Pricing constants", () => {
  it("exports expected scalars", () => {
    expect(TAX_RATE).toBe(0.15);
    expect(FREE_SHIPPING_THRESHOLD).toBe(1000);
    expect(SHIPPING_FLAT).toBe(50);
  });
});
