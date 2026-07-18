// models/couponModel.js
// Engine-backed promotion. Lives in its own collection so admins can manage
// offers without redeploys. The service layer (couponService.js) wraps this
// model in atomic transactions; the engine (couponEngine.js) does the pure
// rules math.
//
// Important: `redemptions` is a growing embedded array. For very high-volume
// stores you'd promote this to a sibling collection, but at the scale we
// expect (thousands of orders, not millions) the array stays cheap to query
// and gives us order-level attribution without a join.

const mongoose = require("mongoose");

const tierSchema = new mongoose.Schema(
  {
    minQty: { type: Number, required: true, min: 1 },
    percent: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const bogoSchema = new mongoose.Schema(
  {
    buyQty: { type: Number, required: true, min: 1 },
    getQty: { type: Number, required: true, min: 1 },
    getPercent: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const eligibilitySchema = new mongoose.Schema(
  {
    minSubtotal: { type: Number, default: null, min: 0 },
    minItems: { type: Number, default: null, min: 1 },
    firstOrderOnly: { type: Boolean, default: false },
    allowedCategories: { type: [String], default: [] },
    allowedProducts: { type: [mongoose.Schema.Types.ObjectId], default: [], ref: "Product" },
    usageLimitPerUser: { type: Number, default: null, min: 1 },
  },
  { _id: false }
);

const redemptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User", default: null },
    email: { type: String, default: null, lowercase: true, trim: true },
    orderId: { type: mongoose.Schema.ObjectId, ref: "Order", required: true },
    discountAmount: { type: Number, required: true, min: 0 },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      match: /^[A-Z0-9_-]{3,32}$/,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", maxlength: 280 },

    discountType: {
      type: String,
      required: true,
      enum: ["percentage", "flat", "freeShipping", "tiered", "bogo"],
    },
    discountValue: { type: Number, default: null, min: 0 },
    tiers: { type: [tierSchema], default: [] },
    bogoConfig: { type: bogoSchema, default: null },

    eligibility: { type: eligibilitySchema, default: () => ({}) },

    // Global caps. `usedCount` is incremented atomically by couponService
    // during order creation; never trust client-supplied values.
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },

    // Validity window. Both optional; engine treats missing as "always".
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },

    active: { type: Boolean, default: true, index: true },
    stackPolicy: { type: String, enum: ["best", "first", "none", "allow"], default: "best" },

    // Per-coupon redemption log. select:false keeps it out of list payloads.
    redemptions: { type: [redemptionSchema], default: [], select: false },

    createdBy: { type: mongoose.Schema.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Compound index for the "what's available now?" query used by /available
// and /best-deal — avoids a collection scan once we have many coupons.
couponSchema.index({ active: 1, startAt: 1, endAt: 1 });

// Strip server-only fields (redemptions, internal flags) when sending to the
// client. Wire-format safety: callers should never receive what we mark here.
couponSchema.methods.toClientJSON = function toClientJSON() {
  const obj = this.toObject({ versionKey: false });
  delete obj.redemptions;
  return obj;
};

module.exports = mongoose.model("Coupon", couponSchema);
