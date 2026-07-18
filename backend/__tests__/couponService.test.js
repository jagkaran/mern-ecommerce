// DB-backed tests for couponService.js — closes the branches not exercised
// by the pure couponEngine suite: bestDeal empty, createCoupon validation
// errors, and getAnalytics sort comparator.

const couponService = require("../services/couponService");
const Coupon = require("../models/couponModel");
const mongoose = require("mongoose");

const baseBody = (overrides = {}) => ({
  code: "PROMO10",
  name: "Promo 10% Off",
  discountType: "percentage",
  discountValue: 10,
  active: true,
  eligibility: {},
  stackPolicy: "best",
  ...overrides,
});

afterEach(async () => {
  await Coupon.deleteMany({ code: { $regex: /^(PROMO|NEW|VAL|ERR)/ } });
});

describe("couponService — bestDeal empty result", () => {
  it("returns null when no offers match the context", async () => {
    // No coupons seeded → listAvailable returns [] → bestDeal short-circuits
    const deal = await couponService.bestDeal({ subtotal: 50, itemCount: 1 });
    expect(deal).toBeNull();
  });
});

describe("couponService — createCoupon validation", () => {
  it("rejects an empty code with 400", async () => {
    await expect(couponService.createCoupon({ ...baseBody({ code: "" }) })).rejects.toMatchObject({
      message: expect.stringMatching(/code is required/i),
      statusCode: 400,
    });
  });

  it("rejects a code outside the allowed format with 400", async () => {
    // Lowercase / too short — engine.isValidCodeFormat returns false
    await expect(couponService.createCoupon(baseBody({ code: "ab" }))).rejects.toMatchObject({
      message: expect.stringMatching(/3-32 chars/i),
      statusCode: 400,
    });
  });

  it("rethrows non-duplicate errors from Coupon.create", async () => {
    // Force a schema validation error (missing discountType) — not 11000,
    // so the catch branch must rethrow the original error.
    const bad = baseBody();
    delete bad.discountType;
    await expect(couponService.createCoupon(bad)).rejects.toThrow();
  });
});

describe("couponService — evaluateForCart input validation", () => {
  it("rejects an empty code with a 'required' reason (no DB call)", async () => {
    const res = await couponService.evaluateForCart("", { subtotal: 50, itemCount: 1 });
    expect(res.valid).toBe(false);
    expect(res.reason).toMatch(/required/i);
  });

  it("rejects a malformed code with a 'format' reason (no DB call)", async () => {
    const res = await couponService.evaluateForCart("ab", { subtotal: 50, itemCount: 1 });
    expect(res.valid).toBe(false);
    expect(res.reason).toMatch(/format/i);
  });

  it("returns 'not found' when no coupon row matches a well-formed code", async () => {
    const res = await couponService.evaluateForCart("MISSING99", { subtotal: 50, itemCount: 1 });
    expect(res.valid).toBe(false);
    expect(res.reason).toMatch(/not found/i);
  });
});

describe("couponService — redeemInTransaction", () => {
  it("throws 400 when no code is supplied", async () => {
    await expect(
      couponService.redeemInTransaction({ code: "", orderId: new mongoose.Types.ObjectId() })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("increments usedCount and appends a redemption on the happy path", async () => {
    await Coupon.create(baseBody({ code: "VALRED1", discountValue: 10 }));
    const session = await mongoose.startSession();
    const orderId1 = new mongoose.Types.ObjectId();
    const orderId2 = new mongoose.Types.ObjectId();
    await couponService.redeemInTransaction({
      code: "VALRED1",
      orderId: orderId1,
      discountAmount: 5,
      session,
    });
    // Branch: Number(discountAmount) || 0 — pass 0 to hit the falsy-coalesce path
    await couponService.redeemInTransaction({
      code: "VALRED1",
      orderId: orderId2,
      discountAmount: 0,
      session,
    });
    const after = await Coupon.findOne({ code: "VALRED1" }).select("+redemptions");
    expect(after.usedCount).toBe(2);
    expect(after.redemptions).toHaveLength(2);
    expect(after.redemptions[0].orderId.toString()).toBe(orderId1.toString());
    expect(after.redemptions[1].orderId.toString()).toBe(orderId2.toString());
    expect(after.redemptions[1].discountAmount).toBe(0);
    await session.endSession();
  });

  it("throws 409 when the coupon is sold out (usageLimit reached)", async () => {
    await Coupon.create(
      baseBody({ code: "VALSOLD", discountValue: 10, usageLimit: 1, usedCount: 1 })
    );
    const session = await mongoose.startSession();
    await expect(
      couponService.redeemInTransaction({
        code: "VALSOLD",
        orderId: new mongoose.Types.ObjectId(),
        discountAmount: 1,
        session,
      })
    ).rejects.toMatchObject({ statusCode: 409 });
    await session.endSession();
  });
});

describe("couponService — getAnalytics sort", () => {
  it("sorts redemptionsByDay ascending and slices to 30 days", async () => {
    // Seed two coupons with redemptions on different days so the comparator
    // branch (a < b) is hit on both true and false paths.
    const c1 = await Coupon.create(
      baseBody({
        code: "VALA1",
        discountValue: 5,
        redemptions: [
          {
            orderId: new mongoose.Types.ObjectId(),
            at: new Date("2026-01-02T10:00:00Z"),
            discountAmount: 1,
          },
          {
            orderId: new mongoose.Types.ObjectId(),
            at: new Date("2026-01-01T10:00:00Z"),
            discountAmount: 1,
          },
        ],
      })
    );
    await Coupon.create(
      baseBody({
        code: "VALB2",
        discountValue: 5,
        redemptions: [
          {
            orderId: new mongoose.Types.ObjectId(),
            at: new Date("2026-01-03T10:00:00Z"),
            discountAmount: 1,
          },
        ],
      })
    );

    const analytics = await couponService.getAnalytics();
    expect(analytics.redemptionsByDay.length).toBeGreaterThan(1);
    // Ascending order: first day <= last day
    const days = analytics.redemptionsByDay.map((d) => d.day);
    expect(days).toEqual([...days].sort());
    // Capped at 30 entries
    expect(analytics.redemptionsByDay.length).toBeLessThanOrEqual(30);
  });
});
