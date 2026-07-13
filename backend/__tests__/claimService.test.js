"use strict";
const crypto = require("crypto");

// Mock the transactional wrapper — mongodb-memory-server runs single-node
// (no replica set), so multi-document transactions can't start. We swap in a
// wrapper that opens a real ClientSession but skips startTransaction, so
// Mongoose's driver sees a valid session object while skipping the commit/
// abort calls. This matches the pattern used by orderService.test.js.
// jest.mock factories cannot reference out-of-scope variables — use the
// `mock`-prefix allowlist and lazy-require mongoose inside the factory.
jest.mock("../utils/transaction", () => ({
  __esModule: false,
  withTransaction: async (fn) => {
    // eslint-disable-next-line global-require
    const mockMongoose = require("mongoose");
    const session = await mockMongoose.startSession();
    try {
      return await fn(session);
    } finally {
      await session.endSession();
    }
  },
}));

const mongoose = require("mongoose");
const { mintClaimToken, claimGuestOrder } = require("../services/claimService");
const Order = require("../models/orderModel");
const User  = require("../models/userModel");
const Product = require("../models/productModel");

let productId;
beforeAll(async () => {
  const p = await Product.create({
    name: "Claim Prod", description: "d", price: 50, category: "Test", stock: 10,
    images: [{ public_id: "cp", url: "http://e.com/c.jpg" }],
    createdBy: new mongoose.Types.ObjectId(),
  });
  productId = p._id;
});

describe("claimService — HMAC + lifecycle", () => {
  it("mintClaimToken returns 64-char hex", () => {
    const t = mintClaimToken(new mongoose.Types.ObjectId().toString(), "x@y.io");
    expect(t).toMatch(/^[0-9a-f]{64}$/);
  });

  it("claimGuestOrder rejects token that does not match an order", async () => {
    const fake = mintClaimToken(new mongoose.Types.ObjectId().toString(), "no@order.io");
    await expect(claimGuestOrder({ claimToken: fake, password: "passw0rd!" }))
      .rejects.toThrow(/Invalid claim token/i);
  });

  it("claimGuestOrder rejects replayed token", async () => {
    // Create a guest order with an orderId/email pair, then claim twice
    const order = await Order.create({
      shippingInfo: { address: "1 St", city: "C", state: "S", country: "X", zip: 12345, phone: 1234567890 },
      orderItems: [{ name: "x", price: 1, quantity: 1, image: "i", product: productId }],
      paymentInfo: { id: "pi_x", status: "succeeded" },
      itemPrice: 1, taxPrice: 0, shippingPrice: 0, totalPrice: 1,
      paidAt: Date.now(), guestEmail: "r1@y.io",
    });
    // Mint valid token for that orderId + email, then store its hash
    const token = mintClaimToken(order._id.toString(), "r1@y.io");
    order.claimTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await order.save();
    const first = await claimGuestOrder({ claimToken: token, password: "passw0rd!" });
    expect(first.user.email).toBe("r1@y.io");
    await expect(claimGuestOrder({ claimToken: token, password: "passw0rd!" }))
      .rejects.toThrow(/already claimed/i);
  });

  it("claimGuestOrder signals ACCOUNT_EXISTS when email has User", async () => {
    await User.create({ name: "Dup User", email: "dup@y.io", password: "Existing1!", profilePic: { public_id:"d", url:"http://e.com/d.jpg" } });
    // Create a guest order w/ that email. Pin _id so the HMAC computed
    // from oid.toString() matches the HMAC the service recomputes from
    // the persisted order's _id at lookup time.
    const oid = new mongoose.Types.ObjectId();
    const token = mintClaimToken(oid.toString(), "dup@y.io");
    await Order.create({
      _id: oid,
      shippingInfo: { address: "1 St", city: "C", state: "S", country: "X", zip: 12345, phone: 1234567890 },
      orderItems: [{ name: "x", price: 1, quantity: 1, image: "i", product: productId }],
      paymentInfo: { id: "pi_dup", status: "succeeded" },
      itemPrice: 1, taxPrice: 0, shippingPrice: 0, totalPrice: 1,
      paidAt: Date.now(), guestEmail: "dup@y.io",
      claimTokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    });
    await expect(claimGuestOrder({ claimToken: token, password: "passw0rd!" }))
      .rejects.toMatchObject({ statusCode: 409, message: expect.stringMatching(/account exists/i) });
  });
});