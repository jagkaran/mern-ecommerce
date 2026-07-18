"use strict";
/**
 * Unit tests for backend/services/orderService.js.
 *
 * Covers every branch of createOrder that the rest of the suite bypassed
 * (existing order tests call Order.create directly, never invoking the
 * service). AAA pattern throughout.
 *
 * Branches covered:
 *   - empty orderItems → 400
 *   - invalid couponCode format → 400 (lookupCoupon throws)
 *   - unknown couponCode → 400 "Coupon not found"
 *   - PaymentIntent already used by another order → 409 (double-spend guard)
 *   - retrievePaymentIntent throws → 402 (invalid intent)
 *   - intent.status !== "succeeded" → 402 (payment not completed)
 *   - intent.amount ≠ computed total → 400 (tamper guard)
 *   - happy path → returns persisted order with stock deducted
 *   - happy path with valid coupon → discount persisted in coupon snapshot
 */
const stripeSdk = require("stripe");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const orderService = require("../services/orderService");
const paymentService = require("../services/paymentService");

// Mock the transactional wrapper — mongodb-memory-server runs single-node
// (no replica set), so multi-document transactions can't start. We swap in a
// wrapper that opens a real ClientSession but skips startTransaction, so
// Mongoose's driver sees a valid session object while skipping the commit/
// abort calls. The happy path still verifies stock deduction.
jest.mock("../utils/transaction", () => ({
  __esModule: false,
  withTransaction: async (fn) => {
    // eslint-disable-next-line global-require
    const mongoose = require("mongoose");
    const session = await mongoose.startSession();
    try {
      return await fn(session);
    } finally {
      await session.endSession();
    }
  },
}));

const testUserId = new (require("mongoose").Types.ObjectId)();
const couponService = require("../services/couponService");

let user, product;

// Minimum shippingInfo required by orderModel schema. The schema requires
// `phone` (not phoneNo) — the extra fields are tolerated because Mongoose
// ignores unknown keys by default.
const shippingInfo = {
  address: "123 Test St",
  city: "Testville",
  state: "TS",
  country: "Testland",
  phoneNo: 9876543210,
  phone: 9876543210,
  zip: 123456,
};

// Helper — orderItems passed to orderService.createOrder must be fully
// denormalized (name, price, image, product, quantity) because the Order
// schema requires those fields and the service does not enrich them.
function buildOrderItem(qty = 1) {
  return {
    name: product.name,
    price: product.price,
    image: product.images[0].url,
    product: product._id.toString(),
    quantity: qty,
  };
}

beforeAll(async () => {
  user = await User.create({
    name: "OrderSvc User",
    email: `ordersvc_${Date.now()}@example.com`,
    password: "Order@12345",
    profilePic: { public_id: "x", url: "http://example.com/img.jpg" },
  });
  product = await Product.create({
    name: "OrderSvc Product",
    description: "for createOrder tests",
    price: 100,
    category: "Test",
    stock: 10,
    images: [{ public_id: "p1", url: "http://example.com/p.jpg" }],
    createdBy: testUserId,
  });
  // Seed default coupons so the engine has WELCOME10 etc. available.
  await couponService.seedDefaults();
});

// Mock state for paymentService.retrievePaymentIntent must be reset between
// tests — an unconsumed mockResolvedValueOnce from a failed test would leak
// into the next test's payment verification, causing a phantom
// "amount mismatch" failure. The new orderService calls retrievePaymentIntent
// later than the old code (after the coupon lookup), so this used to be
// hidden behind an earlier throw.
afterEach(() => {
  jest.restoreAllMocks();
});

describe("orderService.createOrder — input validation", () => {
  it("rejects empty orderItems with 400", async () => {
    // Arrange
    const data = { shippingInfo, orderItems: [], paymentInfo: { id: "pi_x", status: "succeeded" } };

    // Act + Assert
    await expect(orderService.createOrder(data, user._id)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringMatching(/at least one/i),
    });
  });

  it("rejects non-array orderItems with 400", async () => {
    const data = {
      shippingInfo,
      orderItems: "not-an-array",
      paymentInfo: { id: "pi_x", status: "succeeded" },
    };
    await expect(orderService.createOrder(data, user._id)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe("orderService.createOrder — coupon validation", () => {
  it("rejects malformed couponCode format with 400", async () => {
    // Arrange
    const data = {
      shippingInfo,
      orderItems: [buildOrderItem()],
      paymentInfo: { id: "pi_c1", status: "succeeded" },
      couponCode: "BAD CODE!", // contains space and bang → format fail
    };

    // Act + Assert
    await expect(orderService.createOrder(data, user._id)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringMatching(/coupon code format/i),
    });
  });

  it("rejects unknown but well-formed couponCode with 400 'Coupon not found'", async () => {
    // Arrange — "NOTREAL" passes format regex but is not in the registry
    const data = {
      shippingInfo,
      orderItems: [buildOrderItem()],
      paymentInfo: { id: "pi_c2", status: "succeeded" },
      couponCode: "NOTREAL",
    };

    // Act + Assert
    await expect(orderService.createOrder(data, user._id)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringMatching(/coupon not found/i),
    });
  });
});

describe("orderService.createOrder — payment verification", () => {
  // Arrange — a pre-existing order that already used a specific intent ID
  const usedIntentId = "pi_already_used";
  beforeAll(async () => {
    await Order.create({
      shippingInfo,
      orderItems: [{ name: "x", price: 1, quantity: 1, image: "x", product: product._id }],
      paymentInfo: { id: usedIntentId, status: "succeeded" },
      itemPrice: 1,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 1,
      paidAt: Date.now(),
      user: user._id,
    });
  });

  it("rejects re-use of an existing PaymentIntent with 409 (double-spend guard)", async () => {
    // Arrange
    const data = {
      shippingInfo,
      orderItems: [buildOrderItem()],
      paymentInfo: { id: usedIntentId, status: "succeeded" },
    };

    // Act + Assert
    await expect(orderService.createOrder(data, user._id)).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringMatching(/already used/i),
    });
  });

  it("rejects intent that cannot be retrieved with 402 'Invalid PaymentIntent ID'", async () => {
    // Arrange
    jest
      .spyOn(paymentService, "retrievePaymentIntent")
      .mockRejectedValueOnce(new Error("No such payment_intent"));
    const data = {
      shippingInfo,
      orderItems: [buildOrderItem()],
      paymentInfo: { id: "pi_invalid_404", status: "succeeded" },
    };

    // Act + Assert
    await expect(orderService.createOrder(data, user._id)).rejects.toMatchObject({
      statusCode: 402,
      message: expect.stringMatching(/invalid paymentintent/i),
    });
  });

  it("rejects intent with status !== 'succeeded' with 402 'Payment not completed'", async () => {
    // Arrange
    jest.spyOn(paymentService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_pending",
      status: "processing",
      amount: 165, // amount: 100 + 50 + 15 = 165
    });
    const data = {
      shippingInfo,
      orderItems: [buildOrderItem()],
      paymentInfo: { id: "pi_pending", status: "processing" },
    };

    // Act + Assert
    await expect(orderService.createOrder(data, user._id)).rejects.toMatchObject({
      statusCode: 402,
      message: expect.stringMatching(/payment not completed/i),
    });
  });

  it("rejects intent whose amount does not match computed total with 400 (tamper guard)", async () => {
    // Arrange — server computes total = 100 + 50 + 15 = 165.00 → 16500 cents.
    // Intent claims 9999 cents → mismatch.
    jest.spyOn(paymentService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_tamper",
      status: "succeeded",
      amount: 9999,
    });
    const data = {
      shippingInfo,
      orderItems: [buildOrderItem()],
      paymentInfo: { id: "pi_tamper", status: "succeeded" },
    };

    // Act + Assert
    await expect(orderService.createOrder(data, user._id)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringMatching(/amount mismatch/i),
    });
  });
});

describe("orderService.createOrder — happy path", () => {
  it("persists the order, deducts stock, and returns the document", async () => {
    // Arrange
    const intentId = `pi_ok_${Date.now()}`;
    // itemPrice = 100, shipping = 50, tax = 15, total = 165.00 → 16500 cents
    jest.spyOn(paymentService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: intentId,
      status: "succeeded",
      amount: 16500,
    });
    const stockBefore = product.stock;
    const data = {
      shippingInfo,
      orderItems: [buildOrderItem()],
      paymentInfo: { id: intentId, status: "succeeded" },
    };

    // Act
    const order = await orderService.createOrder(data, user._id);

    // Assert
    expect(order).toBeDefined();
    expect(order._id).toBeDefined();
    expect(order.itemPrice).toBe(100);
    expect(order.taxPrice).toBe(15);
    expect(order.shippingPrice).toBe(50);
    expect(order.totalPrice).toBe(165);
    expect(order.paidAt).toBeInstanceOf(Date);

    // Stock was deducted transactionally
    const reloaded = await Product.findById(product._id);
    expect(reloaded.stock).toBe(stockBefore - 1);
  });

  it("persists the coupon snapshot when a valid coupon is supplied", async () => {
    // Arrange — SAVE20 = 20% off (no first-order / min-subtotal constraints,
    // so it applies to this repeat customer on a $100 cart).
    // itemPrice 100, shipping 50, tax 15, discount 20 → total 145 → 14500 cents.
    const intentId = `pi_coupon_${Date.now()}`;
    jest.spyOn(paymentService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: intentId,
      status: "succeeded",
      amount: 14500,
    });
    const data = {
      shippingInfo,
      orderItems: [buildOrderItem()],
      paymentInfo: { id: intentId, status: "succeeded" },
      couponCode: "SAVE20",
    };

    // Act
    const order = await orderService.createOrder(data, user._id);

    // Assert
    expect(order.coupon.code).toBe("SAVE20");
    expect(order.coupon.discountType).toBe("percentage");
    expect(order.coupon.discountValue).toBe(20);
    expect(order.coupon.discountAmount).toBe(20);
    expect(order.discount).toBe(20);
    expect(order.totalPrice).toBe(145);
  });

  it("stores currency metadata when supplied", async () => {
    // Arrange
    const intentId = `pi_eur_${Date.now()}`;
    jest.spyOn(paymentService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: intentId,
      status: "succeeded",
      amount: 16500,
    });
    const data = {
      shippingInfo,
      orderItems: [buildOrderItem()],
      paymentInfo: { id: intentId, status: "succeeded" },
      currency: "EUR",
      currencyRate: 0.92,
    };

    // Act
    const order = await orderService.createOrder(data, user._id);

    // Assert
    expect(order.currency).toBe("EUR");
    expect(order.currencyRate).toBe(0.92);
  });

  it("defaults to USD when caller omits currency (legacy / non-FX orders)", async () => {
    const intentId = `pi_usd_default_${Date.now()}`;
    jest.spyOn(paymentService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: intentId,
      status: "succeeded",
      amount: 16500,
    });
    const data = {
      shippingInfo,
      orderItems: [buildOrderItem()],
      paymentInfo: { id: intentId, status: "succeeded" },
    };
    const order = await orderService.createOrder(data, user._id);
    expect(order.currency).toBe("USD");
    expect(order.currencyRate).toBe(1);
  });
});
