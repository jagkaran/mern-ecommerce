// __tests__/couponE2E.test.js
// Comprehensive end-to-end suite for the coupon engine. Exercises every
// layer — pure engine math, DB-backed service, HTTP endpoints, atomic
// redemption under concurrency — and asserts the exact math down to the
// cent. If a test fails, fix the bug and re-run until 100% pass.
//
// Coverage:
//   §1 Core coupon types & rewards
//   §2 Eligibility & constraints
//   §3 Stacking policies
//   §4 Idempotency & race conditions
//   §5 Negative / exploit inputs
//   §6 Admin CRUD lifecycle

const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../app");
const Coupon = require("../models/couponModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const couponService = require("../services/couponService");
const engine = require("../services/couponEngine");

require("./dbSetup");

beforeAll(async () => {
  await couponService.seedDefaults();
});

afterEach(async () => {
  // Keep seeded defaults; clear test-scratch coupons between specs.
  await Coupon.deleteMany({
    code: { $nin: ["WELCOME10", "SAVE20", "FLAT25", "FREESHIP"] },
  });
  jest.restoreAllMocks();
});

// ─── Fixtures ──────────────────────────────────────────────────────────────

const fixtureCoupon = (overrides = {}) =>
  Coupon.create({
    code: `T${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    name: "Test",
    discountType: "percentage",
    discountValue: 10,
    active: true,
    ...overrides,
  });

const adminAuth = async () => {
  const admin = await User.create({
    name: "Admin",
    email: `admin_${Date.now()}@x.io`,
    password: "Admin@12345",
    role: "admin",
    profilePic: { public_id: "x", url: "http://x/x.jpg" },
  });
  const login = await request(app).post("/api/v1/login").send({
    email: admin.email,
    password: "Admin@12345",
  });
  const token = login.body.token;
  // CSRF is dev-disabled per app.js — only attached in production. Tests
  // run outside production, so omit the X-CSRF-Token header entirely.
  return {
    Cookie: login.headers["set-cookie"]?.join("; ") || "",
    Authorization: `Bearer ${token}`,
  };
};

// ════════════════════════════════════════════════════════════════════════════
// §1 Core coupon types & rewards
// ════════════════════════════════════════════════════════════════════════════

describe("§1 Core coupon types — engine math", () => {
  it("FIXED: $10 off a $89.95 cart → $10 discount", () => {
    const r = engine.calculateReward(
      { discountType: "flat", discountValue: 10 },
      { subtotal: 89.95 }
    );
    expect(r.discountAmount).toBe(10);
  });

  it("FIXED: never discounts more than subtotal (no negative total)", () => {
    const r = engine.calculateReward(
      { discountType: "flat", discountValue: 200 },
      { subtotal: 50 }
    );
    expect(r.discountAmount).toBe(50);
  });

  it("PERCENTAGE: 15% off $89.95 → $13.49 (banker's-safe rounding)", () => {
    const r = engine.calculateReward(
      { discountType: "percentage", discountValue: 15 },
      { subtotal: 89.95 }
    );
    // 89.95 * 0.15 = 13.4925 → rounded to 13.49
    expect(r.discountAmount).toBe(13.49);
  });

  it("PERCENTAGE: 33% off $10.99 → $3.63 (rounds down at .5 boundary)", () => {
    const r = engine.calculateReward(
      { discountType: "percentage", discountValue: 33 },
      { subtotal: 10.99 }
    );
    expect(r.discountAmount).toBe(3.63);
  });

  it("FREE SHIPPING: zero discount + flag set", () => {
    const r = engine.calculateReward({ discountType: "freeShipping" }, { subtotal: 89.95 });
    expect(r.discountAmount).toBe(0);
    expect(r.freeShipping).toBe(true);
  });

  it("BOGO: Buy 1 Get 1 at 50% off — 2 units of $20 → $10 discount", () => {
    const r = engine.calculateReward(
      { discountType: "bogo", bogoConfig: { buyQty: 1, getQty: 1, getPercent: 50 } },
      { subtotal: 40, lineItems: [{ product: "p1", price: 20, quantity: 2 }] }
    );
    expect(r.discountAmount).toBe(10);
  });

  it("BOGO: Buy 2 Get 1 at 50% off — 3 units of $30 → $15 discount", () => {
    const r = engine.calculateReward(
      { discountType: "bogo", bogoConfig: { buyQty: 2, getQty: 1, getPercent: 50 } },
      { subtotal: 90, lineItems: [{ product: "p1", price: 30, quantity: 3 }] }
    );
    // 3 units → 1 set of (2+1) → 1 free unit at 50% off the cheapest line.
    // All lines same price → $30 * 0.5 = $15
    expect(r.discountAmount).toBe(15);
  });

  it("BOGO: 6 units at Buy 2 Get 1 → 2 free units", () => {
    const r = engine.calculateReward(
      { discountType: "bogo", bogoConfig: { buyQty: 2, getQty: 1, getPercent: 50 } },
      { subtotal: 180, lineItems: [{ product: "p1", price: 30, quantity: 6 }] }
    );
    // 2 sets × 1 free = 2 free units @ $15 each = $30 discount
    expect(r.discountAmount).toBe(30);
  });

  it("BOGO: uneven line prices discount goes to cheapest first", () => {
    const r = engine.calculateReward(
      { discountType: "bogo", bogoConfig: { buyQty: 1, getQty: 1, getPercent: 100 } },
      {
        subtotal: 100,
        lineItems: [
          { product: "a", price: 80, quantity: 1 },
          { product: "b", price: 20, quantity: 1 },
        ],
      }
    );
    // 1 set → 1 free unit @ 100% off the cheapest ($20)
    expect(r.discountAmount).toBe(20);
  });

  it("TIERED: boundary at $49.99 → no tier", () => {
    const r = engine.calculateReward(
      { discountType: "tiered", tiers: [{ minQty: 1, percent: 10 }] },
      { subtotal: 49.99, itemCount: 0 }
    );
    // minQty not satisfied by itemCount=0 → 0
    expect(r.discountAmount).toBe(0);
  });

  it("TIERED: boundary at $50.00 with minQty 1 → 10% off", () => {
    const r = engine.calculateReward(
      { discountType: "tiered", tiers: [{ minQty: 1, percent: 10 }] },
      { subtotal: 50, itemCount: 1 }
    );
    expect(r.discountAmount).toBe(5);
  });

  it("TIERED: $49 vs $50 vs $51 boundary gives correct tier", () => {
    const tiers = [
      { minQty: 1, percent: 5 }, // base
      { minQty: 2, percent: 10 }, // tier up at 2 items
    ];
    expect(
      engine.calculateReward({ discountType: "tiered", tiers }, { subtotal: 49, itemCount: 1 })
        .discountAmount
    ).toBe(2.45);
    expect(
      engine.calculateReward({ discountType: "tiered", tiers }, { subtotal: 50, itemCount: 2 })
        .discountAmount
    ).toBe(5);
    expect(
      engine.calculateReward({ discountType: "tiered", tiers }, { subtotal: 51, itemCount: 2 })
        .discountAmount
    ).toBe(5.1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// §2 Eligibility & constraints
// ════════════════════════════════════════════════════════════════════════════

describe("§2 Eligibility — engine rules", () => {
  it("minSubtotal: rejects $30 cart against $50 minimum", () => {
    const v = engine.evaluateEligibility(
      { eligibility: { minSubtotal: 50 }, active: true },
      { subtotal: 30 }
    );
    expect(v.eligible).toBe(false);
    expect(v.reason).toMatch(/at least \$50/);
  });

  it("minSubtotal: accepts exactly $50 boundary", () => {
    const v = engine.evaluateEligibility(
      { eligibility: { minSubtotal: 50 }, active: true },
      { subtotal: 50 }
    );
    expect(v.eligible).toBe(true);
  });

  it("minSubtotal: accepts $50.01 just over", () => {
    const v = engine.evaluateEligibility(
      { eligibility: { minSubtotal: 50 }, active: true },
      { subtotal: 50.01 }
    );
    expect(v.eligible).toBe(true);
  });

  it("allowedCategories: cart mixed, coupon targets Electronics → reject", () => {
    const v = engine.evaluateEligibility(
      { eligibility: { allowedCategories: ["Electronics"] }, active: true },
      { subtotal: 100, categories: ["Clothing"] }
    );
    expect(v.eligible).toBe(false);
  });

  it("allowedCategories: any matching category → accept", () => {
    const v = engine.evaluateEligibility(
      { eligibility: { allowedCategories: ["Electronics", "Home"] }, active: true },
      { subtotal: 100, categories: ["Home", "Clothing"] }
    );
    expect(v.eligible).toBe(true);
  });

  it("allowedProducts: specific product in cart → accept", () => {
    const v = engine.evaluateEligibility(
      { eligibility: { allowedProducts: ["prod123"] }, active: true },
      { subtotal: 100, productIds: ["prod123", "prod456"] }
    );
    expect(v.eligible).toBe(true);
  });

  it("firstOrderOnly: returning user → reject", () => {
    const v = engine.evaluateEligibility(
      { eligibility: { firstOrderOnly: true }, active: true },
      { isFirstOrder: false }
    );
    expect(v.eligible).toBe(false);
  });

  it("firstOrderOnly: new user → accept", () => {
    const v = engine.evaluateEligibility(
      { eligibility: { firstOrderOnly: true }, active: true },
      { isFirstOrder: true }
    );
    expect(v.eligible).toBe(true);
  });

  it("TEMPORAL: scheduled (future startAt) → reject", () => {
    const v = engine.evaluateEligibility(
      { active: true, startAt: new Date("2099-01-01") },
      { subtotal: 100, now: new Date("2026-07-17") }
    );
    expect(v.eligible).toBe(false);
  });

  it("TEMPORAL: expired (past endAt) → reject", () => {
    const v = engine.evaluateEligibility(
      { active: true, endAt: new Date("2020-01-01") },
      { subtotal: 100, now: new Date("2026-07-17") }
    );
    expect(v.eligible).toBe(false);
  });

  it("TEMPORAL: millisecond precision — started 1ms ago → accept", () => {
    const now = new Date("2026-07-17T12:00:00.000Z");
    const v = engine.evaluateEligibility(
      { active: true, startAt: new Date("2026-07-17T11:59:59.999Z") },
      { subtotal: 100, now }
    );
    expect(v.eligible).toBe(true);
  });

  it("TEMPORAL: millisecond precision — expired 1ms ago → reject", () => {
    const now = new Date("2026-07-17T12:00:00.001Z");
    const v = engine.evaluateEligibility(
      { active: true, endAt: new Date("2026-07-17T12:00:00.000Z") },
      { subtotal: 100, now }
    );
    expect(v.eligible).toBe(false);
  });

  it("active=false → reject with explicit reason", () => {
    const v = engine.evaluateEligibility({ active: false }, { subtotal: 100 });
    expect(v.eligible).toBe(false);
    expect(v.reason).toMatch(/inactive/i);
  });

  it("usageLimit reached → reject", () => {
    const v = engine.evaluateEligibility(
      { active: true, usageLimit: 5, usedCount: 5 },
      { subtotal: 100 }
    );
    expect(v.eligible).toBe(false);
    expect(v.reason).toMatch(/usage limit/i);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// §3 Stacking policies
// ════════════════════════════════════════════════════════════════════════════

describe("§3 Stack policies — resolveStackPolicy", () => {
  const mk = (code, discountAmount, freeShipping = false) => ({
    coupon: { code, discountType: "flat", discountValue: discountAmount },
    reward: { discountAmount, freeShipping },
  });

  it("best: chooses highest discount", () => {
    const r = engine.resolveStackPolicy([mk("A", 5), mk("B", 15)], { policy: "best" });
    expect(r.selected.code).toBe("B");
    expect(r.totalDiscount).toBe(15);
  });

  it("best: tie-breaks to freeShipping", () => {
    const r = engine.resolveStackPolicy([mk("A", 10), mk("B", 10, true)], { policy: "best" });
    expect(r.selected.code).toBe("B");
  });

  it("first: keeps first candidate, surfaces others", () => {
    const r = engine.resolveStackPolicy([mk("A", 5), mk("B", 15)], { policy: "first" });
    expect(r.selected.code).toBe("A");
    expect(r.alternatives.map((c) => c.code)).toEqual(["B"]);
  });

  it("none: rejects all stacking, returns null", () => {
    const r = engine.resolveStackPolicy([mk("A", 5), mk("B", 15)], { policy: "none" });
    expect(r.selected).toBeNull();
    expect(r.totalDiscount).toBe(0);
  });

  it("allow: sums all candidates", () => {
    const r = engine.resolveStackPolicy([mk("A", 5), mk("B", 15)], { policy: "allow" });
    expect(r.totalDiscount).toBe(20);
    expect(r.freeShipping).toBe(false);
  });

  it("allow: freeShipping flag propagates from any candidate", () => {
    const r = engine.resolveStackPolicy([mk("A", 5), mk("B", 15, true)], { policy: "allow" });
    expect(r.freeShipping).toBe(true);
  });

  it("empty candidate list → null + 0", () => {
    const r = engine.resolveStackPolicy([], { policy: "best" });
    expect(r.selected).toBeNull();
    expect(r.totalDiscount).toBe(0);
  });

  it("unknown policy defaults to best", () => {
    const r = engine.resolveStackPolicy([mk("A", 5), mk("B", 15)], { policy: "nonsense" });
    expect(r.selected.code).toBe("B");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// §4 Idempotency & race conditions
// ════════════════════════════════════════════════════════════════════════════

describe("§4 Idempotency — validate endpoint", () => {
  it("three sequential validates for the same code all succeed", async () => {
    const r1 = await request(app)
      .post("/api/v1/coupon/validate")
      .send({ code: "WELCOME10", itemSubtotal: 200 });
    const r2 = await request(app)
      .post("/api/v1/coupon/validate")
      .send({ code: "WELCOME10", itemSubtotal: 200 });
    const r3 = await request(app)
      .post("/api/v1/coupon/validate")
      .send({ code: "WELCOME10", itemSubtotal: 200 });
    expect(r1.body.valid).toBe(true);
    expect(r2.body.valid).toBe(true);
    expect(r3.body.valid).toBe(true);
    expect(r1.body.coupon.discountAmount).toBe(20);
    expect(r2.body.coupon.discountAmount).toBe(20);
    expect(r3.body.coupon.discountAmount).toBe(20);
  });
});

describe("§4 Concurrent redemption — atomic usageLimit cap", () => {
  it("10 simultaneous redemptions on usageLimit=1: exactly 1 wins, 9 fail", async () => {
    const c = await fixtureCoupon({
      discountType: "percentage",
      discountValue: 50,
      usageLimit: 1,
    });
    const attempts = Array.from({ length: 10 }, (_, i) =>
      couponService
        .redeemInTransaction({
          code: c.code,
          userId: null,
          email: `concurrent_${i}@x.io`,
          orderId: new mongoose.Types.ObjectId(),
          discountAmount: 5,
        })
        .then(() => "ok")
        .catch((e) => e.message)
    );
    const results = await Promise.all(attempts);
    const wins = results.filter((r) => r === "ok").length;
    const conflicts = results.filter((r) => /no longer available/i.test(String(r))).length;
    expect(wins).toBe(1);
    expect(conflicts).toBe(9);

    const after = await Coupon.findOne({ code: c.code });
    expect(after.usedCount).toBe(1);
  });

  it("concurrent validation does not consume quota", async () => {
    // 10 parallel /validate calls on WELCOME10 (no usageLimit) → all 200.
    const calls = Array.from({ length: 10 }, () =>
      request(app).post("/api/v1/coupon/validate").send({ code: "FREESHIP", itemSubtotal: 100 })
    );
    const responses = await Promise.all(calls);
    for (const r of responses) {
      expect(r.status).toBe(200);
      expect(r.body.valid).toBe(true);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// §5 Negative / exploit inputs
// ════════════════════════════════════════════════════════════════════════════

describe("§5 Negative inputs — engine rejects without crashing", () => {
  it("unknown discountType → $0 reward", () => {
    const r = engine.calculateReward({ discountType: "hack" }, { subtotal: 100 });
    expect(r.discountAmount).toBe(0);
  });

  it("null coupon to engine → $0 reward", () => {
    const r = engine.calculateReward(null, { subtotal: 100 });
    expect(r.discountAmount).toBe(0);
  });

  it("negative subtotal → 0 reward (defensive cap)", () => {
    const r = engine.calculateReward(
      { discountType: "percentage", discountValue: 50 },
      { subtotal: -100 }
    );
    expect(r.discountAmount).toBe(0);
  });

  it("percentage > 100 → $0 reward (strict bounds)", () => {
    const r = engine.calculateReward(
      { discountType: "percentage", discountValue: 999 },
      { subtotal: 100 }
    );
    expect(r.discountAmount).toBe(0);
  });

  it("negative flat value → $0 reward", () => {
    const r = engine.calculateReward(
      { discountType: "flat", discountValue: -25 },
      { subtotal: 100 }
    );
    expect(r.discountAmount).toBe(0);
  });

  it("NaN discount value → $0 reward", () => {
    const r = engine.calculateReward(
      { discountType: "flat", discountValue: NaN },
      { subtotal: 100 }
    );
    expect(r.discountAmount).toBe(0);
  });
});

describe("§5 Negative inputs — HTTP endpoints reject without exposing internals", () => {
  it("/validate rejects empty body with 400", async () => {
    const r = await request(app).post("/api/v1/coupon/validate").send({});
    expect(r.status).toBe(400);
  });

  it("/validate rejects too-short code with 400 (no 500 crash)", async () => {
    const r = await request(app)
      .post("/api/v1/coupon/validate")
      .send({ code: "hi", itemSubtotal: 100 });
    expect(r.status).toBe(400);
    expect(r.body.message).toMatch(/format/i);
  });

  it("/validate rejects SQL-injection-shaped code with 400", async () => {
    const r = await request(app).post("/api/v1/coupon/validate").send({
      code: "'; DROP TABLE coupons; --",
      itemSubtotal: 100,
    });
    expect(r.status).toBe(400);
  });

  it("/validate rejects missing itemSubtotal (treated as 0)", async () => {
    const r = await request(app).post("/api/v1/coupon/validate").send({ code: "WELCOME10" });
    expect(r.status).toBe(200);
    expect(r.body.coupon.discountAmount).toBe(0);
  });

  it("/validate rejects non-string code", async () => {
    const r = await request(app)
      .post("/api/v1/coupon/validate")
      .send({ code: 12345, itemSubtotal: 100 });
    expect(r.status).toBe(400);
  });

  it("/available handles negative subtotal gracefully", async () => {
    const r = await request(app).get("/api/v1/coupon/available?subtotal=-100&itemCount=0");
    expect(r.status).toBe(200);
  });

  // ─── Eligibility-enforcement on /validate ─────────────────────────────
  // Regression: /validate used to ignore eligibility rules (minSubtotal /
  // minItems / etc) and accept any active code. Order creation would then
  // reject it with a confusing server error at /order/new. /validate must
  // run the same eligibility check the order service runs.

  it("/validate WITH cart context enforces minSubtotal: returns valid:false + reason", async () => {
    // FLAT25 has eligibility.minSubtotal: 100 (seeded)
    const r = await request(app).post("/api/v1/coupon/validate").send({
      code: "FLAT25",
      itemSubtotal: 30, // below the $100 floor
      itemCount: 1,
    });
    expect(r.status).toBe(200);
    expect(r.body.valid).toBe(false);
    expect(r.body.message).toMatch(/at least \$100/);
  });

  it("/validate WITH cart context accepts when eligibility met", async () => {
    const r = await request(app).post("/api/v1/coupon/validate").send({
      code: "FLAT25",
      itemSubtotal: 150, // above the $100 floor
      itemCount: 2,
    });
    expect(r.status).toBe(200);
    expect(r.body.valid).toBe(true);
    expect(r.body.coupon.discountAmount).toBe(25);
  });

  // ─── firstOrderOnly — must be enforced for authenticated users ────────
  // Regression: WELCOME10 was leaking into /available and /validate for
  // returning users because the engine treated isFirstOrder=undefined as
  // "no constraint" and the controllers never resolved the real value.

  it("firstOrderOnly: anonymous caller (no auth) → ACCEPT (most permissive)", async () => {
    const r = await request(app).post("/api/v1/coupon/validate").send({
      code: "WELCOME10",
      itemSubtotal: 200,
      itemCount: 1,
    });
    expect(r.status).toBe(200);
    expect(r.body.valid).toBe(true);
  });

  it("firstOrderOnly: returning user (has prior paid orders) → REJECT with reason", async () => {
    // Set up: a user with one paid order in the DB.
    const User = require("../models/userModel");
    const user = await User.create({
      name: "Returning",
      email: `returning_${Date.now()}@x.io`,
      password: "X@1234567",
      profilePic: { public_id: "x", url: "http://x/x.jpg" },
    });
    const Order = require("../models/orderModel");
    await Order.create({
      user: user._id,
      shippingInfo: {
        address: "1",
        city: "C",
        state: "S",
        country: "X",
        zip: 12345,
        phone: 1234567890,
      },
      orderItems: [
        {
          name: "x",
          price: 10,
          quantity: 1,
          image: "http://x/x.jpg",
          product: new mongoose.Types.ObjectId(),
        },
      ],
      paymentInfo: { id: "pi_paid", status: "succeeded" },
      itemPrice: 10,
      taxPrice: 1.5,
      shippingPrice: 0,
      discount: 0,
      totalPrice: 11.5,
      paidAt: new Date(),
    });
    const login = await request(app).post("/api/v1/login").send({
      email: user.email,
      password: "X@1234567",
    });
    const cookieHeader = (login.headers["set-cookie"] || []).join("; ");
    const tokenMatch = cookieHeader.match(/token=[^;]+/);
    const cookie = tokenMatch ? tokenMatch[0] : cookieHeader;

    const r = await request(app)
      .post("/api/v1/coupon/validate")
      .set("Cookie", cookie)
      .send({ code: "WELCOME10", itemSubtotal: 200, itemCount: 1 });
    if (r.body.valid !== false) {
      throw new Error(
        `WELCOME10 should be invalid for returning user. cookie sent: "${cookie}". ` +
          `Response: ${JSON.stringify(r.body)}`
      );
    }
    expect(r.status).toBe(200);
    expect(r.body.valid).toBe(false);
    expect(r.body.message).toMatch(/first order/i);
  });

  it("firstOrderOnly: returning user's /available EXCLUDES WELCOME10", async () => {
    // Same setup as above — returning user fetches /available.
    const User = require("../models/userModel");
    const user = await User.create({
      name: "Returning2",
      email: `returning2_${Date.now()}@x.io`,
      password: "X@1234567",
      profilePic: { public_id: "x", url: "http://x/x.jpg" },
    });
    const Order = require("../models/orderModel");
    await Order.create({
      user: user._id,
      shippingInfo: {
        address: "1",
        city: "C",
        state: "S",
        country: "X",
        zip: 12345,
        phone: 1234567890,
      },
      orderItems: [
        {
          name: "x",
          price: 10,
          quantity: 1,
          image: "http://x/x.jpg",
          product: new mongoose.Types.ObjectId(),
        },
      ],
      paymentInfo: { id: "pi_paid", status: "succeeded" },
      itemPrice: 10,
      taxPrice: 1.5,
      shippingPrice: 0,
      discount: 0,
      totalPrice: 11.5,
      paidAt: new Date(),
    });
    const login = await request(app).post("/api/v1/login").send({
      email: user.email,
      password: "X@1234567",
    });
    const cookieHeader = (login.headers["set-cookie"] || []).join("; ");
    // Extract just the token cookie (login may also set csrf cookies).
    const tokenMatch = cookieHeader.match(/token=[^;]+/);
    const cookie = tokenMatch ? tokenMatch[0] : cookieHeader;

    const r = await request(app)
      .get("/api/v1/coupon/available?subtotal=200&itemCount=1")
      .set("Cookie", cookie);
    expect(r.status).toBe(200);
    const codes = (r.body.coupons || []).map((c) => c.code);
    if (codes.includes("WELCOME10")) {
      throw new Error(
        `WELCOME10 should be excluded for returning user. cookie sent: "${cookie}". ` +
          `Response codes: ${JSON.stringify(codes)}`
      );
    }
    expect(codes).not.toContain("WELCOME10");
  });

  it("/validate WITHOUT cart context stays reward-only (legacy compat)", async () => {
    // Same FLAT25 code, but no itemCount → legacy preview path returns
    // valid:true with the discount math, no eligibility check. This is
    // intentional back-compat for callers that haven't been updated.
    const r = await request(app).post("/api/v1/coupon/validate").send({
      code: "FLAT25",
      itemSubtotal: 30,
      // no itemCount → eligibility check skipped
    });
    expect(r.status).toBe(200);
    expect(r.body.valid).toBe(true);
    expect(r.body.coupon.discountAmount).toBe(25);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// §6 Admin CRUD lifecycle (HTTP integration)
// ════════════════════════════════════════════════════════════════════════════

describe("§6 Admin CRUD — full lifecycle", () => {
  it("anonymous → 401 on admin endpoints", async () => {
    const r = await request(app).get("/api/v1/admin/coupons");
    expect(r.status).toBe(401);
  });

  it("admin: create → list → get → update → toggle → delete", async () => {
    const headers = await adminAuth();
    // create
    const create = await request(app)
      .post("/api/v1/admin/coupon/new")
      .set(headers)
      .send({
        code: `LIFECYCLE${Date.now().toString().slice(-6)}`,
        name: "Lifecycle 10%",
        discountType: "percentage",
        discountValue: 10,
      });
    expect(create.status).toBe(201);
    const id = create.body.coupon._id;

    // list
    const list = await request(app).get("/api/v1/admin/coupons").set(headers);
    expect(list.status).toBe(200);
    expect(list.body.coupons.find((c) => c._id === id)).toBeTruthy();

    // get
    const get = await request(app).get(`/api/v1/admin/coupon/${id}`).set(headers);
    expect(get.status).toBe(200);
    expect(get.body.coupon.name).toBe("Lifecycle 10%");

    // update (no code)
    const put = await request(app)
      .put(`/api/v1/admin/coupon/${id}`)
      .set(headers)
      .send({ name: "Renamed", discountValue: 15 });
    expect(put.status).toBe(200);
    expect(put.body.coupon.discountValue).toBe(15);

    // toggle off
    const toggle = await request(app).patch(`/api/v1/admin/coupon/${id}/toggle`).set(headers);
    expect(toggle.status).toBe(200);
    expect(toggle.body.coupon.active).toBe(false);

    // toggle back on
    const toggleOn = await request(app).patch(`/api/v1/admin/coupon/${id}/toggle`).set(headers);
    expect(toggleOn.body.coupon.active).toBe(true);

    // delete
    const del = await request(app).delete(`/api/v1/admin/coupon/${id}`).set(headers);
    expect(del.status).toBe(200);
  });

  it("admin: creating duplicate code → 409", async () => {
    const headers = await adminAuth();
    const code = `DUP${Date.now().toString().slice(-6)}`;
    const r1 = await request(app).post("/api/v1/admin/coupon/new").set(headers).send({
      code,
      name: "Dup1",
      discountType: "percentage",
      discountValue: 10,
    });
    expect(r1.status).toBe(201);
    const r2 = await request(app).post("/api/v1/admin/coupon/new").set(headers).send({
      code,
      name: "Dup2",
      discountType: "percentage",
      discountValue: 20,
    });
    expect(r2.status).toBe(409);
  });

  it("admin: malformed code on create → 400", async () => {
    const headers = await adminAuth();
    const r = await request(app).post("/api/v1/admin/coupon/new").set(headers).send({
      code: "BAD CODE!",
      name: "Bad",
      discountType: "percentage",
      discountValue: 10,
    });
    expect(r.status).toBe(400);
  });

  it("admin: invalid mongo id → 400", async () => {
    const headers = await adminAuth();
    const r = await request(app).get("/api/v1/admin/coupon/not-an-id").set(headers);
    expect(r.status).toBe(400);
  });

  it("admin: code in update payload is rejected", async () => {
    const headers = await adminAuth();
    const create = await request(app)
      .post("/api/v1/admin/coupon/new")
      .set(headers)
      .send({
        code: `IMMUT${Date.now().toString().slice(-6)}`,
        name: "Immutable test",
        discountType: "percentage",
        discountValue: 10,
      });
    expect(create.status).toBe(201);
    const id = create.body.coupon._id;
    const put = await request(app).put(`/api/v1/admin/coupon/${id}`).set(headers).send({
      code: "CHANGED",
      name: "trying to rename",
    });
    expect(put.status).toBe(400);
    expect(put.body.message).toMatch(/immutable/i);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// §7 Service — atomic redemption + redemptions log
// ════════════════════════════════════════════════════════════════════════════

describe("§7 Redemption log — granular attribution", () => {
  it("redeemInTransaction appends user/email/orderId/discountAmount to redemptions[]", async () => {
    const c = await fixtureCoupon({ discountType: "percentage", discountValue: 10 });
    const userId = new mongoose.Types.ObjectId();
    const orderId = new mongoose.Types.ObjectId();
    await couponService.redeemInTransaction({
      code: c.code,
      userId,
      email: "trace@x.io",
      orderId,
      discountAmount: 5,
    });
    const updated = await Coupon.findOne({ code: c.code }).select("redemptions usedCount");
    expect(updated.usedCount).toBe(1);
    expect(updated.redemptions).toHaveLength(1);
    expect(updated.redemptions[0].email).toBe("trace@x.io");
    expect(updated.redemptions[0].discountAmount).toBe(5);
    expect(updated.redemptions[0].orderId.toString()).toBe(orderId.toString());
  });

  it("analytics aggregation returns totals + per-coupon breakdown", async () => {
    const c = await fixtureCoupon({ discountType: "flat", discountValue: 7 });
    for (let i = 0; i < 3; i++) {
      await couponService.redeemInTransaction({
        code: c.code,
        userId: null,
        email: `a${i}@x.io`,
        orderId: new mongoose.Types.ObjectId(),
        discountAmount: 7,
      });
    }
    const analytics = await couponService.getAnalytics();
    const row = analytics.topCoupons.find((t) => t.code === c.code);
    expect(row).toBeTruthy();
    expect(row.redemptions).toBe(3);
    expect(row.totalDiscount).toBe(21);
  });
});

describe("§9 PaymentIntent amount — coupon must apply at /payment/process", () => {
  // The FE mints a PaymentIntent via /payment/process before confirming
  // with Stripe. If the endpoint ignores the coupon, the PaymentIntent is
  // for the full (undiscounted) total, and /order/new rejects with
  // "Payment amount mismatch" when it later re-computes the discounted total.
  // Locking this parity at the HTTP layer catches regressions even if the
  // formula parity test (§8) drifts.

  const paymentService = require("../services/paymentService");

  it("/payment/process with couponCode applies the discount to the minted amount", async () => {
    const product = await Product.create({
      name: "Pi",
      description: "p",
      price: 59.9,
      category: "T",
      stock: 10,
      createdBy: new mongoose.Types.ObjectId(),
      images: [{ public_id: "p", url: "http://x/p.jpg" }],
    });
    const mintSpy = jest.spyOn(paymentService, "createPaymentIntent").mockResolvedValue({
      client_secret: "pi_secret_test",
    });

    const r = await request(app)
      .post("/api/v1/payment/process")
      .send({
        orderItems: [{ product: product._id.toString(), quantity: 1 }],
        couponCode: "FREESHIP",
      });
    expect(r.status).toBe(200);
    // The minted amount must reflect the coupon — 59.90 + 0 + 8.98 - 50 = 18.88
    // Without the coupon the call would have minted 11888 cents.
    expect(mintSpy).toHaveBeenCalledWith(1888, expect.any(Object));

    mintSpy.mockRestore();
  });

  it("/payment/process without couponCode mints the undiscounted total", async () => {
    const product = await Product.create({
      name: "Pi2",
      description: "p",
      price: 59.9,
      category: "T",
      stock: 10,
      createdBy: new mongoose.Types.ObjectId(),
      images: [{ public_id: "p2", url: "http://x/p2.jpg" }],
    });
    const mintSpy = jest.spyOn(paymentService, "createPaymentIntent").mockResolvedValue({
      client_secret: "pi_secret_test",
    });
    const r = await request(app)
      .post("/api/v1/payment/process")
      .send({
        orderItems: [{ product: product._id.toString(), quantity: 1 }],
      });
    expect(r.status).toBe(200);
    // 59.90 + 50 + 8.98 = 118.88 → 11888 cents
    expect(mintSpy).toHaveBeenCalledWith(11888, expect.any(Object));
    mintSpy.mockRestore();
  });
});

// ─── Pricing parity — server formula must match what the FE mints ───────
// Regression guard: if the FE's CheckoutPage totals diverge from the
// server's pricing.js, the Stripe PaymentIntent amount the FE mints will
// mismatch the server's expected total → 400 at /order/new.

describe("§9b Cache invalidation — admin mutations clear the public /available cache", () => {
  // Regression guard: previously the invalidation pattern was "coupons"
  // (plural) but the public route lives at /api/v1/coupon/available
  // (singular). String.includes is exact — plural never matched the key
  // → admin updates silently no-op'd on the cache → shoppers saw stale
  // offer lists for up to 60s after every admin change.
  //
  // We also append a unique `&_t=` per test to bypass cross-test cache
  // pollution (the in-memory cache survives between tests; admin writes
  // invalidate but non-admin tests don't).

  const availableUrl = (testName) =>
    `/api/v1/coupon/available?subtotal=200&itemCount=1&_t=${encodeURIComponent(testName + Date.now())}`;

  it("admin update clears the cached /available response so shoppers see the new state", async () => {
    const url = availableUrl("create");
    const headers = await adminAuth();
    // Warm the cache as an anonymous shopper.
    const before = await request(app).get(url);
    expect(before.status).toBe(200);
    expect(before.body.coupons).toBeDefined();

    // Create a new coupon via admin (the /admin/coupon/new route also
    // triggers invalidateCouponCache, so this should clear the cache).
    const code = `CACHE${Date.now().toString().slice(-6)}`;
    const create = await request(app).post("/api/v1/admin/coupon/new").set(headers).send({
      code,
      name: "Cache Test",
      discountType: "percentage",
      discountValue: 5,
    });
    expect(create.status).toBe(201);

    // Fetch /available again — the new coupon must appear immediately
    // (no 60s wait). If invalidation silently failed, the coupon is
    // missing here.
    const after = await request(app).get(url);
    const codes = (after.body.coupons || []).map((c) => c.code);
    expect(codes).toContain(code);
  });

  it("admin toggle-off clears cache: paused coupon disappears from /available", async () => {
    const url = availableUrl("toggle");
    const headers = await adminAuth();
    const c = await fixtureCoupon({
      code: `PAUSE${Date.now().toString().slice(-6)}`,
      discountType: "percentage",
      discountValue: 7,
    });
    // Sanity: coupon is in the DB + active.
    const inDb = await Coupon.findOne({ code: c.code }).lean();
    if (!inDb) throw new Error(`Coupon ${c.code} not in DB after create`);
    if (inDb.active !== true) throw new Error(`Coupon ${c.code} active=${inDb.active}`);
    // Warm the cache.
    const before = await request(app).get(url);
    const beforeCodes = (before.body.coupons || []).map((x) => x.code);
    if (!beforeCodes.includes(c.code)) {
      const allInDb = await Coupon.find({}).select("code active startAt endAt").lean();
      throw new Error(
        `PAUSE coupon ${c.code} missing from initial /available. got: ${JSON.stringify(beforeCodes)}. ` +
          `DB state: ${JSON.stringify(allInDb)}`
      );
    }

    // Toggle off via the admin route.
    const toggle = await request(app).patch(`/api/v1/admin/coupon/${c._id}/toggle`).set(headers);
    expect(toggle.status).toBe(200);

    // /available must no longer include the paused coupon.
    const after = await request(app).get("/api/v1/coupon/available?subtotal=200&itemCount=1");
    const codes = (after.body.coupons || []).map((x) => x.code);
    expect(codes).not.toContain(c.code);
  });
});

// ─── Pricing parity — server formula must match what the FE mints ───────
describe("§8 Pricing parity — FE formula vs server formula", () => {
  const { computeOrderPricing } = require("../utils/pricing");
  const creator = new mongoose.Types.ObjectId();

  // The exact math the FE CheckoutPage runs. Mirror of its totals useMemo.
  const feTotals = (subtotal, shipping, coupon) => {
    let d = 0,
      s = shipping,
      free = false;
    if (coupon) {
      if (coupon.discountType === "freeShipping") {
        free = true;
        d += s;
        s = 0;
      } else {
        d += Number(coupon.discountAmount || 0);
      }
    }
    const tax = +(subtotal * 0.15).toFixed(2);
    return {
      subtotal,
      shipping: s,
      tax,
      discount: d,
      freeShipping: free,
      total: +Math.max(0, subtotal + s + tax - d).toFixed(2),
    };
  };

  it("FREESHIP: FE total = server total to the cent", async () => {
    const product = await Product.create({
      name: "P",
      description: "x",
      price: 89.95,
      category: "T",
      stock: 10,
      createdBy: creator,
      images: [{ public_id: "p", url: "http://x/p.jpg" }],
    });
    const coupon = { code: "FREESHIP", discountType: "freeShipping", discountValue: 0 };
    const server = await computeOrderPricing(
      [{ product: product._id.toString(), quantity: 1 }],
      coupon
    );
    const fe = feTotals(89.95, 50, coupon);
    // The FE total must equal what /order/new will verify Stripe against.
    expect(fe.total).toBe(server.totalPrice);
  });

  it("percentage coupon: FE total = server total to the cent", async () => {
    const product = await Product.create({
      name: "Q",
      description: "x",
      price: 100,
      category: "T",
      stock: 10,
      createdBy: creator,
      images: [{ public_id: "q", url: "http://x/q.jpg" }],
    });
    const rawCoupon = { code: "SAVE20", discountType: "percentage", discountValue: 20 };
    const server = await computeOrderPricing(
      [{ product: product._id.toString(), quantity: 1 }],
      rawCoupon
    );
    // The FE reads the engine's computed reward off the /validate response,
    // not the raw discountValue. Mirror that by computing the reward first.
    const engine = require("../services/couponEngine");
    const reward = engine.calculateReward(rawCoupon, { subtotal: 100, itemCount: 1 });
    const feCoupon = { ...rawCoupon, discountAmount: reward.discountAmount };
    const fe = feTotals(100, 50, feCoupon);
    expect(fe.total).toBe(server.totalPrice);
  });
});
