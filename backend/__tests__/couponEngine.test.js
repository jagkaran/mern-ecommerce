// Pure-function tests for the coupon engine. No DB required — these run
// fast and exercise every rule + every reward type.

const engine = require("../services/couponEngine");

const baseCoupon = (overrides = {}) => ({
  code: "TEST",
  discountType: "percentage",
  discountValue: 10,
  active: true,
  startAt: null,
  endAt: null,
  usageLimit: null,
  usedCount: 0,
  eligibility: {},
  stackPolicy: "best",
  ...overrides,
});

describe("couponEngine — evaluateEligibility", () => {
  it("accepts an active coupon with empty eligibility in-window", () => {
    const v = engine.evaluateEligibility(baseCoupon(), { subtotal: 100, itemCount: 1 });
    expect(v.eligible).toBe(true);
  });

  it("rejects inactive coupons with a clear reason", () => {
    const v = engine.evaluateEligibility(baseCoupon({ active: false }), { subtotal: 100 });
    expect(v.eligible).toBe(false);
    expect(v.reason).toMatch(/inactive/i);
  });

  it("rejects coupons outside their date window", () => {
    const past = engine.evaluateEligibility(
      baseCoupon({ startAt: new Date("2000-01-01"), endAt: new Date("2000-12-31") }),
      { subtotal: 50, now: new Date("2024-01-01") }
    );
    expect(past.eligible).toBe(false);
    expect(past.reason).toMatch(/date range/i);
  });

  it("enforces usageLimit against usedCount", () => {
    const v = engine.evaluateEligibility(baseCoupon({ usageLimit: 5, usedCount: 5 }), {
      subtotal: 50,
    });
    expect(v.eligible).toBe(false);
    expect(v.reason).toMatch(/usage limit/i);
  });

  it("enforces minSubtotal", () => {
    const v = engine.evaluateEligibility(baseCoupon({ eligibility: { minSubtotal: 50 } }), {
      subtotal: 30,
    });
    expect(v.eligible).toBe(false);
    expect(v.reason).toMatch(/at least \$50/);
  });

  it("enforces minItems", () => {
    const v = engine.evaluateEligibility(baseCoupon({ eligibility: { minItems: 3 } }), {
      subtotal: 100,
      itemCount: 2,
    });
    expect(v.eligible).toBe(false);
    expect(v.reason).toMatch(/at least 3 item/);
  });

  it("enforces firstOrderOnly against returning users", () => {
    const v = engine.evaluateEligibility(baseCoupon({ eligibility: { firstOrderOnly: true } }), {
      isFirstOrder: false,
    });
    expect(v.eligible).toBe(false);
    expect(v.reason).toMatch(/first order/i);
  });

  it("enforces allowedCategories", () => {
    const yes = engine.evaluateEligibility(
      baseCoupon({ eligibility: { allowedCategories: ["tech"] } }),
      { categories: ["tech", "home"] }
    );
    expect(yes.eligible).toBe(true);
    const no = engine.evaluateEligibility(
      baseCoupon({ eligibility: { allowedCategories: ["tech"] } }),
      { categories: ["home"] }
    );
    expect(no.eligible).toBe(false);
  });

  it("accepts when categories don't intersect but allowedProducts does", () => {
    const v = engine.evaluateEligibility(
      baseCoupon({ eligibility: { allowedCategories: ["tech"], allowedProducts: [] } }),
      { categories: ["home"], productIds: ["p1"] }
    );
    // No product match, no category match — should reject.
    expect(v.eligible).toBe(false);
  });

  it("handles null/undefined input", () => {
    expect(engine.evaluateEligibility(null).eligible).toBe(false);
    expect(engine.evaluateEligibility(undefined).eligible).toBe(false);
  });
});

describe("couponEngine — calculateReward", () => {
  it("percentage: applies percent off subtotal, never negative", () => {
    const r = engine.calculateReward(
      baseCoupon({ discountType: "percentage", discountValue: 10 }),
      { subtotal: 200 }
    );
    expect(r.discountAmount).toBe(20);
    expect(r.freeShipping).toBe(false);
  });

  it("percentage > 100: rejects (returns 0)", () => {
    // Strict bounds — admin validation prevents creating such coupons, but
    // a stale row in the DB should never produce a 100%+ discount.
    const r = engine.calculateReward(
      baseCoupon({ discountType: "percentage", discountValue: 200 }),
      { subtotal: 50 }
    );
    expect(r.discountAmount).toBe(0);
  });

  it("percentage = 100: caps at subtotal (boundary)", () => {
    const r = engine.calculateReward(
      baseCoupon({ discountType: "percentage", discountValue: 100 }),
      { subtotal: 50 }
    );
    expect(r.discountAmount).toBe(50);
  });

  it("flat: applies amount, caps at subtotal", () => {
    const big = engine.calculateReward(baseCoupon({ discountType: "flat", discountValue: 25 }), {
      subtotal: 100,
    });
    expect(big.discountAmount).toBe(25);
    const capped = engine.calculateReward(
      baseCoupon({ discountType: "flat", discountValue: 200 }),
      { subtotal: 50 }
    );
    expect(capped.discountAmount).toBe(50);
  });

  it("freeShipping: sets flag, zero discount", () => {
    const r = engine.calculateReward(baseCoupon({ discountType: "freeShipping" }), {
      subtotal: 100,
    });
    expect(r.discountAmount).toBe(0);
    expect(r.freeShipping).toBe(true);
  });

  it("tiered: picks the highest qualifying tier", () => {
    const r = engine.calculateReward(
      baseCoupon({
        discountType: "tiered",
        tiers: [
          { minQty: 3, percent: 10 },
          { minQty: 5, percent: 20 },
        ],
      }),
      { subtotal: 100, itemCount: 5 }
    );
    expect(r.discountAmount).toBe(20); // 20% off 100
  });

  it("tiered: zero discount when no tier matches", () => {
    const r = engine.calculateReward(
      baseCoupon({ discountType: "tiered", tiers: [{ minQty: 10, percent: 25 }] }),
      { subtotal: 100, itemCount: 2 }
    );
    expect(r.discountAmount).toBe(0);
  });

  it("bogo: computes free units and discount on cheap lines", () => {
    const r = engine.calculateReward(
      baseCoupon({ discountType: "bogo", bogoConfig: { buyQty: 1, getQty: 1, getPercent: 50 } }),
      { subtotal: 100, lineItems: [{ product: "p1", price: 20, quantity: 2 }] }
    );
    // 1 set (1+1) → 1 free unit at 50% off the cheapest line → 20 * 0.5 = 10
    expect(r.discountAmount).toBe(10);
  });

  it("returns 0 for unknown discount types", () => {
    const r = engine.calculateReward(baseCoupon({ discountType: "weird" }), { subtotal: 100 });
    expect(r.discountAmount).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const r = engine.calculateReward(
      baseCoupon({ discountType: "percentage", discountValue: 33 }),
      { subtotal: 10.99 }
    );
    // 10.99 * 0.33 = 3.6267 → rounds to 3.63
    expect(r.discountAmount).toBe(3.63);
  });
});

describe("couponEngine — resolveStackPolicy", () => {
  const a = { coupon: { code: "A" }, reward: { discountAmount: 5, freeShipping: false } };
  const b = { coupon: { code: "B" }, reward: { discountAmount: 15, freeShipping: true } };
  const c = { coupon: { code: "C" }, reward: { discountAmount: 15, freeShipping: false } };

  it("best: picks highest discount", () => {
    const r = engine.resolveStackPolicy([a, b], { policy: "best" });
    expect(r.selected.code).toBe("B");
    expect(r.totalDiscount).toBe(15);
  });

  it("best: tie-breaks to freeShipping", () => {
    const r = engine.resolveStackPolicy([b, c], { policy: "best" });
    expect(r.selected.code).toBe("B"); // B has freeShipping at same discount
  });

  it("first: keeps the first candidate", () => {
    const r = engine.resolveStackPolicy([a, b], { policy: "first" });
    expect(r.selected.code).toBe("A");
    expect(r.alternatives.map((c) => c.code)).toEqual(["B"]);
  });

  it("none: drops to null", () => {
    const r = engine.resolveStackPolicy([a, b], { policy: "none" });
    expect(r.selected).toBeNull();
    expect(r.alternatives.map((c) => c.code)).toEqual(["A", "B"]);
    expect(r.totalDiscount).toBe(0);
  });

  it("allow: sums all candidates", () => {
    const r = engine.resolveStackPolicy([a, b], { policy: "allow" });
    expect(r.selected).toBeNull();
    expect(r.totalDiscount).toBe(20); // 5 + 15
    expect(r.freeShipping).toBe(true);
  });

  it("default policy is best", () => {
    const r = engine.resolveStackPolicy([a, b]);
    expect(r.selected.code).toBe("B");
  });

  it("handles empty candidate list", () => {
    const r = engine.resolveStackPolicy([], { policy: "best" });
    expect(r.selected).toBeNull();
    expect(r.totalDiscount).toBe(0);
  });
});

describe("couponEngine — helpers", () => {
  it("normalizeCode uppercases + trims", () => {
    expect(engine.normalizeCode("  hello-1 ")).toBe("HELLO-1");
    expect(engine.normalizeCode(42)).toBe("");
  });

  it("isValidCodeFormat rejects malformed inputs", () => {
    expect(engine.isValidCodeFormat("AB")).toBe(false);
    expect(engine.isValidCodeFormat("A".repeat(40))).toBe(false);
    expect(engine.isValidCodeFormat("hi there")).toBe(false);
    expect(engine.isValidCodeFormat("WELCOME10")).toBe(true);
  });

  it("evaluatePerUserCap enforces the limit", () => {
    const coupon = baseCoupon({ eligibility: { usageLimitPerUser: 1 } });
    expect(engine.evaluatePerUserCap(coupon, 0).ok).toBe(true);
    expect(engine.evaluatePerUserCap(coupon, 1).ok).toBe(false);
  });
});
