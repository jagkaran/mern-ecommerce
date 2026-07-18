// services/couponService.js
// DB-backed coupon store. Backwards-compatible surface — `lookupCoupon`,
// `previewDiscount`, and `COUPONS` stay synchronous and read from an
// in-memory cache that `seedDefaults()` hydrates at boot. Admin CRUD
// invalidates the cache so newly-created coupons surface to /validate
// without a server restart.
//
// New surface (async, DB-direct):
//   - evaluateForCart(code, ctx) — single-shot for order creation
//   - listAvailable(ctx)         — engine-filtered offers for cart preview
//   - bestDeal(ctx)              — top single coupon suggestion
//   - redeemInTransaction()      — atomic $inc under usageLimit precondition
//   - createCoupon / updateCoupon / toggleCoupon / deleteCoupon
//   - getCoupon / listAllCoupons / getAnalytics
//
// Pure rules live in couponEngine.js. This file is the only place that
// touches the database.

const Coupon = require("../models/couponModel");
const ErrorHandler = require("../utils/errorHandler");
const logger = require("../utils/logger");
const engine = require("./couponEngine");

// Module-level cache populated by seedDefaults / refreshCache. The synchronous
// public surface (lookupCoupon / previewDiscount) reads from this; the async
// surface (admin CRUD, evaluateForCart) goes straight to MongoDB so writes
// are immediately visible to themselves.
const codeIndex = new Map(); // code -> lean coupon object

// Mutable snapshot for back-compat with the original `COUPONS` export.
// Tests do `expect(lookupCoupon(...)).toEqual(COUPONS.WELCOME10)`, so this
// must mirror what's in codeIndex.
const COUPONS = {};

function snapshotIntoCoupons(leanCoupon) {
  COUPONS[leanCoupon.code] = {
    code: leanCoupon.code,
    discountType: leanCoupon.discountType,
    discountValue: leanCoupon.discountValue,
  };
}

async function refreshCache() {
  codeIndex.clear();
  for (const key of Object.keys(COUPONS)) delete COUPONS[key];
  const all = await Coupon.find({}).lean();
  for (const coupon of all) {
    codeIndex.set(coupon.code, coupon);
    snapshotIntoCoupons(coupon);
  }
  return codeIndex.size;
}

// ─── Back-compat: lookupCoupon / previewDiscount (sync) ─────────────────────

/**
 * Sync lookup. Returns a plain coupon object (matching the legacy shape:
 * `{code, discountType, discountValue, ...}`) or null. Throws for codes that
 * look like brute-force attempts so the controller can return 400 instead of
 * a silent "not found".
 */
function lookupCoupon(rawCode) {
  if (typeof rawCode !== "string") return null;
  const code = engine.normalizeCode(rawCode);
  if (!code) return null;
  if (!engine.isValidCodeFormat(code)) {
    throw new ErrorHandler("Invalid coupon code format", 400);
  }
  return codeIndex.get(code) || null;
}

/**
 * Sync preview for the /validate endpoint. Same shape as the legacy version:
 * `{valid, code, discountType, discountValue, discountAmount, freeShipping}`.
 * Item subtotal is informational — order creation recomputes authoritatively.
 */
function previewDiscount(rawCode, itemSubtotal) {
  const code = engine.normalizeCode(rawCode);
  if (!code) return { code: "", valid: false };
  if (!engine.isValidCodeFormat(code)) {
    throw new ErrorHandler("Invalid coupon code format", 400);
  }
  const coupon = codeIndex.get(code);
  if (!coupon || coupon.active === false) {
    return { code, valid: false };
  }
  const reward = engine.calculateReward(coupon, {
    subtotal: Number(itemSubtotal) || 0,
    itemCount: 0,
    lineItems: [],
  });
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount: reward.discountAmount,
    freeShipping: reward.freeShipping,
    valid: true,
  };
}

// ─── Async: cart-context evaluation ─────────────────────────────────────────

/**
 * Single-shot eligibility + reward for a specific code, used by orderService.
 * Hits the DB directly so an admin toggle is immediately reflected.
 */
async function evaluateForCart(code, context = {}) {
  const normalized = engine.normalizeCode(code);
  if (!normalized) return { valid: false, reason: "Coupon code is required" };
  if (!engine.isValidCodeFormat(normalized)) {
    return { valid: false, reason: "Invalid coupon code format" };
  }
  const coupon = await Coupon.findOne({ code: normalized, active: true }).lean();
  if (!coupon) return { valid: false, code: normalized, reason: "Coupon not found" };
  const verdict = engine.evaluateEligibility(coupon, context);
  if (!verdict.eligible) {
    return { valid: false, code: coupon.code, reason: verdict.reason };
  }
  const reward = engine.calculateReward(coupon, context);
  return { valid: true, code: coupon.code, coupon, reward };
}

/**
 * Enumerate coupons that pass eligibility for a cart context. Each entry
 * includes the engine-estimated reward so the UI can render
 * "Save $12 with WELCOME10" without recomputing client-side.
 */
async function listAvailable(context = {}) {
  const now = context.now || new Date();
  const candidates = await Coupon.find({
    active: true,
    $and: [
      { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
      { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
    ],
  }).lean();
  const evaluated = [];
  for (const coupon of candidates) {
    const verdict = engine.evaluateEligibility(coupon, context);
    if (!verdict.eligible) continue;
    const reward = engine.calculateReward(coupon, context);
    evaluated.push({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      stackPolicy: coupon.stackPolicy,
      estimatedDiscount: reward.discountAmount,
      freeShipping: reward.freeShipping,
    });
  }
  evaluated.sort((a, b) => {
    if (b.estimatedDiscount !== a.estimatedDiscount) {
      return b.estimatedDiscount - a.estimatedDiscount;
    }
    return Number(b.freeShipping) - Number(a.freeShipping);
  });
  return evaluated;
}

async function bestDeal(context = {}) {
  const offers = await listAvailable(context);
  return offers.length ? offers[0] : null;
}

// ─── Atomic redemption ──────────────────────────────────────────────────────

/**
 * Atomically increment `usedCount` and append a redemption record. The
 * usageLimit precondition prevents two concurrent orders from both succeeding
 * once the cap is reached.
 */
async function redeemInTransaction({ code, userId, email, orderId, discountAmount, session }) {
  if (!code) throw new ErrorHandler("Coupon code required for redemption", 400);
  const result = await Coupon.findOneAndUpdate(
    {
      code,
      active: true,
      $or: [
        { usageLimit: null },
        { usageLimit: { $exists: false } },
        { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
      ],
    },
    {
      $inc: { usedCount: 1 },
      $push: {
        redemptions: {
          user: userId || null,
          email: email || null,
          orderId,
          discountAmount: Number(discountAmount) || 0,
          at: new Date(),
        },
      },
    },
    { new: true, session }
  );
  if (!result) {
    throw new ErrorHandler("Coupon is no longer available (sold out or expired)", 409);
  }
  return result;
}

// ─── Admin CRUD ─────────────────────────────────────────────────────────────

const WRITABLE_COUPON_FIELDS = [
  "name",
  "description",
  "discountType",
  "discountValue",
  "tiers",
  "bogoConfig",
  "eligibility",
  "usageLimit",
  "startAt",
  "endAt",
  "active",
  "stackPolicy",
];

const WRITABLE_CREATE_FIELDS = ["code", ...WRITABLE_COUPON_FIELDS];

function pickFields(body, fields) {
  return fields.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});
}

async function createCoupon(body, createdBy = null) {
  const fields = pickFields(body, WRITABLE_CREATE_FIELDS);
  fields.code = engine.normalizeCode(fields.code);
  if (!fields.code) throw new ErrorHandler("Coupon code is required", 400);
  if (!engine.isValidCodeFormat(fields.code)) {
    throw new ErrorHandler("Coupon code must be 3-32 chars [A-Z0-9_-]", 400);
  }
  fields.createdBy = createdBy;
  try {
    const coupon = await Coupon.create(fields);
    await refreshCache();
    return coupon;
  } catch (err) {
    if (err && err.code === 11000) {
      throw new ErrorHandler("Coupon code already exists", 409);
    }
    throw err;
  }
}

async function updateCoupon(id, body) {
  const fields = pickFields(body, WRITABLE_COUPON_FIELDS);
  const updated = await Coupon.findByIdAndUpdate(id, fields, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ErrorHandler("Coupon not found", 404);
  await refreshCache();
  return updated;
}

async function toggleCoupon(id) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new ErrorHandler("Coupon not found", 404);
  coupon.active = !coupon.active;
  await coupon.save();
  await refreshCache();
  return coupon;
}

async function deleteCoupon(id) {
  const deleted = await Coupon.findByIdAndDelete(id);
  if (!deleted) throw new ErrorHandler("Coupon not found", 404);
  await refreshCache();
  return deleted;
}

async function getCoupon(id) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new ErrorHandler("Coupon not found", 404);
  return coupon;
}

async function listAllCoupons() {
  return Coupon.find().sort({ createdAt: -1 });
}

// ─── Analytics ──────────────────────────────────────────────────────────────

async function getAnalytics() {
  const coupons = await Coupon.find()
    .select("code name discountType usedCount redemptions active")
    .lean();
  let totalRedeemed = 0;
  let totalDiscountCents = 0;
  const byDay = new Map();
  const byCode = [];

  for (const coupon of coupons) {
    const redeemed = coupon.redemptions || [];
    totalRedeemed += redeemed.length;
    let codeDiscount = 0;
    for (const r of redeemed) {
      const cents = Math.round(Number(r.discountAmount || 0) * 100);
      totalDiscountCents += cents;
      codeDiscount += cents;
      const day = new Date(r.at).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + 1);
    }
    byCode.push({
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      redemptions: redeemed.length,
      usedCount: coupon.usedCount,
      totalDiscount: codeDiscount / 100,
    });
  }

  byCode.sort((a, b) => b.redemptions - a.redemptions);

  const redemptionsByDay = Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-30)
    .map(([day, count]) => ({ day, count }));

  return {
    totalRedeemed,
    totalDiscount: totalDiscountCents / 100,
    activeCoupons: coupons.filter((c) => c.active).length,
    topCoupons: byCode.slice(0, 5),
    redemptionsByDay,
  };
}

// ─── Seed: idempotent upsert of the 4 legacy codes ──────────────────────────

const DEFAULT_SEED = Object.freeze([
  {
    code: "WELCOME10",
    name: "Welcome 10% Off",
    discountType: "percentage",
    discountValue: 10,
    eligibility: { firstOrderOnly: true },
  },
  { code: "SAVE20", name: "Save 20%", discountType: "percentage", discountValue: 20 },
  {
    code: "FLAT25",
    name: "Flat $25 Off",
    discountType: "flat",
    discountValue: 25,
    eligibility: { minSubtotal: 100 },
  },
  { code: "FREESHIP", name: "Free Shipping", discountType: "freeShipping", discountValue: 0 },
]);

async function seedDefaults() {
  let upserted = 0;
  for (const seed of DEFAULT_SEED) {
    const result = await Coupon.findOneAndUpdate(
      { code: seed.code },
      { $setOnInsert: { ...seed, active: true } },
      { upsert: true, new: false, setDefaultsOnInsert: true }
    );
    if (!result) upserted += 1;
  }
  if (upserted > 0) {
    logger.info(`seeded ${upserted} default coupon(s)`);
  }
  await refreshCache();
  return { upserted, cached: codeIndex.size };
}

module.exports = {
  // Back-compat (sync)
  lookupCoupon,
  previewDiscount,
  COUPONS,
  // Engine front-end (async)
  evaluateForCart,
  listAvailable,
  bestDeal,
  // Atomic
  redeemInTransaction,
  // Admin CRUD
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
  getCoupon,
  listAllCoupons,
  getAnalytics,
  // Boot + cache
  seedDefaults,
  refreshCache,
};
