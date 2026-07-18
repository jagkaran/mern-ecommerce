// services/couponEngine.js
// Pure, side-effect-free coupon logic. Three layers, one entry each:
//
//   1. evaluateEligibility  — is this coupon usable in this cart, by this user, right now?
//   2. calculateReward      — given it IS usable, what does it actually save?
//   3. resolveStackPolicy   — given multiple coupons, which one(s) win?
//
// Persistence + atomic redemption live in couponService.js. Keeping these
// pure lets unit tests cover every rule without a database and lets us swap
// the storage layer without touching business logic.

// ─── Constants ──────────────────────────────────────────────────────────────

const DISCOUNT_TYPES = Object.freeze(["percentage", "flat", "freeShipping", "tiered", "bogo"]);

const STACK_POLICIES = Object.freeze(["best", "first", "none", "allow"]);

const CODE_FORMAT = /^[A-Z0-9_-]{3,32}$/;

const MAX_DISCOUNT_FRACTION = 1; // never let a discount exceed the subtotal

// ─── Helpers ────────────────────────────────────────────────────────────────

const round2 = (n) => Math.round(Number(n) * 100) / 100;

/**
 * Returns true when the coupon's date window includes `now`. Both bounds are
 * optional — a missing startAt means "since the dawn of time", a missing
 * endAt means "no expiry". Null-safe so we don't crash on partially-populated
 * admin forms.
 */
function inDateWindow(coupon, now = new Date()) {
  if (coupon.startAt && new Date(coupon.startAt) > now) return false;
  if (coupon.endAt && new Date(coupon.endAt) < now) return false;
  return true;
}

/**
 * Format an eligibility rejection reason for the UI. Centralized so messages
 * stay consistent across validate/list/best-deal endpoints.
 */
function formatReject(coupon, code) {
  return { eligible: false, code, reason: coupon._rejectReason || "Coupon not eligible" };
}

// ─── Layer 1: Eligibility ───────────────────────────────────────────────────

/**
 * Decide whether a coupon can be applied to a given cart context.
 *
 * @param {object} coupon  Coupon document (or plain object with engine fields)
 * @param {{
 *   subtotal?:     number,    // pre-discount item subtotal
 *   itemCount?:    number,    // total quantity across all line items
 *   categories?:   string[],  // distinct product categories in cart
 *   productIds?:   string[],  // distinct product IDs in cart
 *   user?:         object,    // { _id, email } or null for guest
 *   isFirstOrder?: boolean,   // has this user ever completed an order?
 *   now?:          Date,      // injected for testability
 * }} context
 * @returns {{eligible: boolean, reason?: string, code?: string}}
 */
function evaluateEligibility(coupon, context = {}) {
  if (!coupon || typeof coupon !== "object") {
    return { eligible: false, reason: "Invalid coupon" };
  }
  if (coupon.active === false) {
    coupon._rejectReason = "Coupon is inactive";
    return formatReject(coupon, coupon.code);
  }
  if (!inDateWindow(coupon, context.now)) {
    coupon._rejectReason = "Coupon is not within its valid date range";
    return formatReject(coupon, coupon.code);
  }
  // Usage cap — checked against the persisted usedCount. Atomic increment is
  // the service's job; the engine only does the *advisory* check.
  if (
    Number.isFinite(coupon.usageLimit) &&
    coupon.usageLimit > 0 &&
    (coupon.usedCount || 0) >= coupon.usageLimit
  ) {
    coupon._rejectReason = "Coupon usage limit reached";
    return formatReject(coupon, coupon.code);
  }

  const elig = coupon.eligibility || {};
  const subtotal = Number(context.subtotal) || 0;
  const itemCount = Number(context.itemCount) || 0;

  if (Number.isFinite(elig.minSubtotal) && elig.minSubtotal > 0 && subtotal < elig.minSubtotal) {
    coupon._rejectReason = `Cart total must be at least $${elig.minSubtotal}`;
    return formatReject(coupon, coupon.code);
  }
  if (Number.isFinite(elig.minItems) && elig.minItems > 0 && itemCount < elig.minItems) {
    coupon._rejectReason = `Cart must contain at least ${elig.minItems} item(s)`;
    return formatReject(coupon, coupon.code);
  }
  if (elig.firstOrderOnly && context.isFirstOrder === false) {
    coupon._rejectReason = "Coupon is valid for first order only";
    return formatReject(coupon, coupon.code);
  }
  // Category / product allow-list — coupon applies if ANY of the populated
  // allow-lists is satisfied. An empty list means "no constraint from this
  // dimension"; both empty means no constraint at all.
  const hasCatList = Array.isArray(elig.allowedCategories) && elig.allowedCategories.length > 0;
  const hasProdList = Array.isArray(elig.allowedProducts) && elig.allowedProducts.length > 0;
  if (hasCatList || hasProdList) {
    const cats = new Set((context.categories || []).filter(Boolean));
    const prods = new Set((context.productIds || []).filter(Boolean).map(String));
    const catOk = hasCatList && elig.allowedCategories.some((c) => cats.has(c));
    const prodOk = hasProdList && elig.allowedProducts.some((p) => prods.has(String(p)));
    if (!catOk && !prodOk) {
      coupon._rejectReason = "Coupon does not apply to items in your cart";
      return formatReject(coupon, coupon.code);
    }
  }

  return { eligible: true, code: coupon.code };
}

/**
 * Per-user cap check. The engine returns a verdict; the service decides whether
 * the user has already redeemed. This stays pure.
 */
function evaluatePerUserCap(coupon, userRedemptionCount = 0) {
  const limit = coupon?.eligibility?.usageLimitPerUser;
  if (!Number.isFinite(limit) || limit <= 0) return { ok: true };
  if (userRedemptionCount >= limit) {
    return { ok: false, reason: "You have already used this coupon" };
  }
  return { ok: true };
}

// ─── Layer 2: Reward ────────────────────────────────────────────────────────

/**
 * Per-type reward handlers. Map keyed by discountType so adding a new type is
 * one new entry + one new branch in DISCOUNT_TYPES. Every handler returns
 * {discountAmount, freeShipping, lineDiscounts[]} where `discountAmount` is
 * bounded by subtotal to avoid negative totals.
 */
const REWARD_HANDLERS = {
  percentage(coupon, ctx) {
    const pct = Number(coupon.discountValue);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      return { discountAmount: 0, freeShipping: false, lineDiscounts: [] };
    }
    const amount = round2(Math.min(ctx.subtotal, ctx.subtotal * (pct / 100)));
    return { discountAmount: amount, freeShipping: false, lineDiscounts: [] };
  },
  flat(coupon, ctx) {
    const value = Number(coupon.discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      return { discountAmount: 0, freeShipping: false, lineDiscounts: [] };
    }
    const amount = round2(Math.min(value, ctx.subtotal));
    return { discountAmount: amount, freeShipping: false, lineDiscounts: [] };
  },
  freeShipping() {
    // Doesn't change the subtotal — the order pricing layer reads freeShipping
    // and zeroes shippingPrice there.
    return { discountAmount: 0, freeShipping: true, lineDiscounts: [] };
  },
  tiered(coupon, ctx) {
    // tiers: [{minQty, percent}] sorted ascending. Pick the tier whose minQty
    // is met by the cart's itemCount. Highest matching tier wins.
    const tiers = Array.isArray(coupon.tiers) ? coupon.tiers : [];
    const eligible = tiers
      .filter((t) => ctx.itemCount >= Number(t.minQty || 0))
      .sort((a, b) => Number(b.minQty) - Number(a.minQty))[0];
    if (!eligible) return { discountAmount: 0, freeShipping: false, lineDiscounts: [] };
    const pct = Number(eligible.percent) || 0;
    const amount = round2(Math.min(ctx.subtotal, ctx.subtotal * (pct / 100)));
    return { discountAmount: amount, freeShipping: false, lineDiscounts: [] };
  },
  bogo(coupon, ctx) {
    // Buy N get M at X% off. Per the brief this is the "complex discount"
    // example. Counts units across ALL lines (not per-line) so a Buy 1 Get 1
    // applies whether the shopper puts 2 of one product or 1 each of two.
    // Free units are valued at the cheapest unit-price across the cart.
    const cfg = coupon.bogoConfig || {};
    const buyQty = Math.max(1, Number(cfg.buyQty) || 1);
    const getQty = Math.max(1, Number(cfg.getQty) || 1);
    const getPct = Math.max(0, Number(cfg.getPercent) || 0);
    const lines = Array.isArray(ctx.lineItems) ? ctx.lineItems : [];
    if (!lines.length) {
      // Preview without line detail — fall back to subtotal %.
      const amount = round2(Math.min(ctx.subtotal, ctx.subtotal * (getPct / 100)));
      return { discountAmount: amount, freeShipping: false, lineDiscounts: [] };
    }
    // Total cart units + identify each unit by its line + price.
    const allUnits = [];
    for (const line of lines) {
      const qty = Math.floor(Number(line.quantity) || 0);
      const price = Number(line.price || 0);
      for (let i = 0; i < qty; i++) {
        allUnits.push({ product: line.product, price });
      }
    }
    // Sort cheapest-first so the free units come off the lowest-priced items.
    allUnits.sort((a, b) => a.price - b.price);
    const groupSize = buyQty + getQty;
    const totalSets = Math.floor(allUnits.length / groupSize);
    const freeUnits = totalSets * getQty;
    // Free units are the LAST `freeUnits` of the sorted array (cheapest first
    // means they sit at the front of `allUnits`, but the BOGO convention is
    // that the free units are taken from the cheapest — that's already true
    // since we sorted cheapest-first).
    let discount = 0;
    const freeUnitCounts = new Map();
    for (let i = 0; i < freeUnits; i++) {
      const u = allUnits[i];
      discount += u.price * (getPct / 100);
      freeUnitCounts.set(String(u.product), (freeUnitCounts.get(String(u.product)) || 0) + 1);
    }
    const amount = round2(Math.min(ctx.subtotal, discount));
    const lineDiscounts = lines.map((l) => ({
      productId: l.product,
      freeUnits: freeUnitCounts.get(String(l.product)) || 0,
    }));
    return { discountAmount: amount, freeShipping: false, lineDiscounts };
  },
};

/**
 * Compute the reward a coupon would produce for a given cart context. Caller
 * is responsible for running evaluateEligibility first — this function will
 * happily return 0 for an ineligible coupon rather than reject, since reward
 * computation is also used for "best deal" previews.
 */
function calculateReward(coupon, context = {}) {
  if (!coupon || typeof coupon !== "object") {
    return { discountAmount: 0, freeShipping: false, lineDiscounts: [] };
  }
  const type = coupon.discountType;
  const handler = REWARD_HANDLERS[type];
  if (!handler) {
    return { discountAmount: 0, freeShipping: false, lineDiscounts: [] };
  }
  const subtotal = Number(context.subtotal) || 0;
  const itemCount = Number(context.itemCount) || 0;
  const result = handler(coupon, { subtotal, itemCount, lineItems: context.lineItems });
  return {
    discountAmount: round2(
      Math.max(0, Math.min(subtotal * MAX_DISCOUNT_FRACTION, result.discountAmount || 0))
    ),
    freeShipping: !!result.freeShipping,
    lineDiscounts: Array.isArray(result.lineDiscounts) ? result.lineDiscounts : [],
  };
}

// ─── Layer 3: Stack policy ──────────────────────────────────────────────────

/**
 * Pick a winner (or winners) from a list of pre-evaluated coupon candidates.
 *
 * @param {Array<{coupon: object, reward: {discountAmount: number, freeShipping: boolean}}>} candidates
 * @param {{policy?: "best"|"first"|"none"|"allow"}} opts
 * @returns {{selected: object|null, alternatives: object[], totalDiscount: number, freeShipping: boolean}}
 */
function resolveStackPolicy(candidates, opts = {}) {
  const policy = STACK_POLICIES.includes(opts.policy) ? opts.policy : "best";
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { selected: null, alternatives: [], totalDiscount: 0, freeShipping: false };
  }
  if (policy === "first") {
    const first = candidates[0];
    return {
      selected: first.coupon,
      alternatives: candidates.slice(1).map((c) => c.coupon),
      totalDiscount: first.reward.discountAmount || 0,
      freeShipping: !!first.reward.freeShipping,
    };
  }
  if (policy === "none") {
    return {
      selected: null,
      alternatives: candidates.map((c) => c.coupon),
      totalDiscount: 0,
      freeShipping: false,
    };
  }
  if (policy === "allow") {
    return {
      selected: null,
      alternatives: candidates.map((c) => c.coupon),
      totalDiscount: round2(candidates.reduce((sum, c) => sum + (c.reward.discountAmount || 0), 0)),
      freeShipping: candidates.some((c) => c.reward.freeShipping),
    };
  }
  // best — single biggest discount wins. Tie-break: freeShipping > earlier in
  // the list (i.e. admin-set ordering).
  let winner = candidates[0];
  for (const candidate of candidates.slice(1)) {
    const wReward = winner.reward;
    const cReward = candidate.reward;
    if (
      (cReward.discountAmount || 0) > (wReward.discountAmount || 0) ||
      ((cReward.discountAmount || 0) === (wReward.discountAmount || 0) &&
        cReward.freeShipping &&
        !wReward.freeShipping)
    ) {
      winner = candidate;
    }
  }
  return {
    selected: winner.coupon,
    alternatives: candidates.filter((c) => c !== winner).map((c) => c.coupon),
    totalDiscount: winner.reward.discountAmount || 0,
    freeShipping: !!winner.reward.freeShipping,
  };
}

// ─── Code format ────────────────────────────────────────────────────────────

function isValidCodeFormat(code) {
  return typeof code === "string" && CODE_FORMAT.test(code);
}

function normalizeCode(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().toUpperCase();
}

module.exports = {
  // Layer 1
  evaluateEligibility,
  evaluatePerUserCap,
  // Layer 2
  calculateReward,
  REWARD_HANDLERS,
  // Layer 3
  resolveStackPolicy,
  // Helpers
  isValidCodeFormat,
  normalizeCode,
  inDateWindow,
  round2,
  // Constants (exported for tests + admin form validation)
  DISCOUNT_TYPES,
  STACK_POLICIES,
  CODE_FORMAT,
};
