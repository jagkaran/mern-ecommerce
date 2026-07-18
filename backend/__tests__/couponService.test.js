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
