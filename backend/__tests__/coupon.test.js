// __tests__/coupon.test.js
// Service-layer tests (sync + async paths) + supertest integration. The
// engine's pure logic is exercised in couponEngine.test.js; here we focus
// on the DB-backed surface, caching, admin CRUD, and the atomic
// redemption race.
//
// `dbSetup.js` wires Mongo + the global teardown; we additionally seed
// default coupons so the in-memory cache the sync surface reads is hot.

const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../app");
const couponService = require("../services/couponService");
const Coupon = require("../models/couponModel");
const { lookupCoupon, previewDiscount } = require("../services/couponService");
// dbSetup.js installs beforeAll/afterAll hooks; require it for those side effects.
require("./dbSetup");

beforeAll(async () => {
  await couponService.seedDefaults();
});

afterAll(async () => {
  // Clean up any extras created during admin CRUD tests.
  await Coupon.deleteMany({ code: { $nin: ["WELCOME10", "SAVE20", "FLAT25", "FREESHIP"] } });
});

describe("couponService — sync surface", () => {
  describe("lookupCoupon", () => {
    it("returns null for empty / null / non-string input", () => {
      expect(lookupCoupon("")).toBeNull();
      expect(lookupCoupon("   ")).toBeNull();
      expect(lookupCoupon(null)).toBeNull();
      expect(lookupCoupon(undefined)).toBeNull();
      expect(lookupCoupon(123)).toBeNull();
    });

    it("returns null for unknown code", () => {
      expect(lookupCoupon("NOTREAL")).toBeNull();
    });

    it("matches case-insensitively and trims whitespace", () => {
      const coupon = lookupCoupon("  welcome10  ");
      expect(coupon).toBeTruthy();
      expect(coupon.code).toBe("WELCOME10");
      expect(coupon.discountType).toBe("percentage");
    });

    it("throws for malformed codes", () => {
      expect(() => lookupCoupon("hi")).toThrow(/Invalid coupon code format/);
      expect(() => lookupCoupon("a".repeat(40))).toThrow(/Invalid coupon code format/);
      expect(() => lookupCoupon("bad code!")).toThrow(/Invalid coupon code format/);
    });

    it("returns the registered coupon for valid codes", () => {
      const coupon = lookupCoupon("WELCOME10");
      expect(coupon).toBeTruthy();
      expect(coupon.code).toBe("WELCOME10");
      expect(coupon.discountType).toBe("percentage");
      expect(coupon.discountValue).toBe(10);
      expect(lookupCoupon("FLAT25").discountType).toBe("flat");
      expect(lookupCoupon("FREESHIP").discountType).toBe("freeShipping");
    });
  });

  describe("previewDiscount", () => {
    it("returns valid:false for unknown code", () => {
      const r = previewDiscount("NOPE", 100);
      expect(r.valid).toBe(false);
      expect(r.code).toBe("NOPE");
    });

    it("computes percentage discount against subtotal", () => {
      const r = previewDiscount("WELCOME10", 200);
      expect(r.valid).toBe(true);
      expect(r.discountType).toBe("percentage");
      expect(r.discountAmount).toBe(20); // 10% of 200
      expect(r.freeShipping).toBe(false);
    });

    it("computes flat discount (no negative)", () => {
      expect(previewDiscount("FLAT25", 10).discountAmount).toBe(10); // capped at subtotal
      expect(previewDiscount("FLAT25", 100).discountAmount).toBe(25);
    });

    it("flags freeShipping coupons", () => {
      const r = previewDiscount("FREESHIP", 100);
      expect(r.valid).toBe(true);
      expect(r.freeShipping).toBe(true);
      expect(r.discountAmount).toBe(0);
    });
  });
});

describe("POST /api/v1/coupon/validate", () => {
  it("rejects missing code with 400", async () => {
    const r = await request(app).post("/api/v1/coupon/validate").send({ itemSubtotal: 100 });
    expect(r.status).toBe(400);
    expect(r.body.success).toBe(false);
  });

  it("returns valid:false for unknown code (200, not 404)", async () => {
    const r = await request(app)
      .post("/api/v1/coupon/validate")
      .send({ code: "NOTREAL", itemSubtotal: 100 });
    expect(r.status).toBe(200);
    expect(r.body.valid).toBe(false);
  });

  it("returns discount preview for valid percentage coupon", async () => {
    const r = await request(app)
      .post("/api/v1/coupon/validate")
      .send({ code: "save20", itemSubtotal: 500 });
    expect(r.status).toBe(200);
    expect(r.body.valid).toBe(true);
    expect(r.body.coupon.code).toBe("SAVE20");
    expect(r.body.coupon.discountAmount).toBe(100); // 20% of 500
  });

  it("returns 400 for malformed codes", async () => {
    const r = await request(app)
      .post("/api/v1/coupon/validate")
      .send({ code: "hi", itemSubtotal: 100 });
    expect(r.status).toBe(400);
  });

  it("works anonymously (no auth required)", async () => {
    const r = await request(app)
      .post("/api/v1/coupon/validate")
      .send({ code: "WELCOME10", itemSubtotal: 200 });
    expect(r.status).toBe(200);
    expect(r.body.valid).toBe(true);
  });
});

describe("couponService — eligibility rules (evaluateForCart)", () => {
  it("rejects an unknown code", async () => {
    const r = await couponService.evaluateForCart("NOPE", { subtotal: 100 });
    expect(r.valid).toBe(false);
  });

  it("rejects an inactive coupon", async () => {
    const c = await couponService.createCoupon({
      code: "INACTIVE10",
      name: "Inactive 10%",
      discountType: "percentage",
      discountValue: 10,
      active: false,
    });
    const r = await couponService.evaluateForCart("INACTIVE10", { subtotal: 100 });
    expect(r.valid).toBe(false);
    await couponService.deleteCoupon(c._id.toString());
  });

  it("rejects when cart total is below minSubtotal", async () => {
    const c = await couponService.createCoupon({
      code: "MIN50",
      name: "Min $50",
      discountType: "percentage",
      discountValue: 10,
      eligibility: { minSubtotal: 50 },
    });
    const r = await couponService.evaluateForCart("MIN50", { subtotal: 30 });
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/at least \$50/);
    await couponService.deleteCoupon(c._id.toString());
  });
});

describe("couponService — atomic redemption", () => {
  it("refuses the second redemption when usageLimit=1", async () => {
    const c = await couponService.createCoupon({
      code: "ONESIE",
      name: "One-time",
      discountType: "percentage",
      discountValue: 10,
      usageLimit: 1,
    });
    const fakeOrderId = new mongoose.Types.ObjectId();
    await couponService.redeemInTransaction({
      code: "ONESIE",
      userId: null,
      email: "a@b.com",
      orderId: fakeOrderId,
      discountAmount: 5,
      session: undefined,
    });
    let threw = false;
    try {
      await couponService.redeemInTransaction({
        code: "ONESIE",
        userId: null,
        email: "c@b.com",
        orderId: new mongoose.Types.ObjectId(),
        discountAmount: 5,
        session: undefined,
      });
    } catch (err) {
      threw = true;
      expect(err.message).toMatch(/no longer available/);
    }
    expect(threw).toBe(true);
    const after = await Coupon.findOne({ code: "ONESIE" });
    expect(after.usedCount).toBe(1);
    await couponService.deleteCoupon(c._id.toString());
  });
});
