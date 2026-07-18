// controllers/couponController.js
// Two surfaces:
//   - public: validate, listAvailable, bestDeal
//   - admin:  createCoupon, listAllCoupons, getCoupon, updateCoupon,
//             toggleCoupon, deleteCoupon, getAnalytics
//
// The admin CRUD is a thin pass-through to couponService. The public surface
// translates engine/service output into the shape the FE cart expects.

const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const couponService = require("../services/couponService");
const logger = require("../utils/logger");
const Order = require("../models/orderModel");

// Compute whether the given user has ever completed an order. Used by the
// eligibility engine for firstOrderOnly coupons — without this, every
// returning user would see WELCOME10 in /available and could apply it,
// because the engine treats isFirstOrder=undefined as "no constraint".
async function resolveIsFirstOrder(userId) {
  if (!userId) return true; // anonymous = treat as first-time (most permissive)
  const priorCount = await Order.countDocuments({
    user: userId,
    paidAt: { $exists: true },
  });
  return priorCount === 0;
}

// ─── Public ─────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/coupon/validate
 * Body: { code: string, itemSubtotal?: number, itemCount?: number, categories?: string[], productIds?: string[] }
 * Returns: { success, valid, code?, message?, coupon?: { ... } }
 *
 * When cart context (itemCount / categories / productIds) is provided the
 * endpoint runs the full engine eligibility check — same path the order
 * service uses — so the UI never shows a "success" for a coupon the cart
 * can't actually redeem. Without context the response falls back to the
 * legacy reward-only preview (kept for back-compat with callers that
 * haven't been updated yet).
 */
exports.validateCoupon = catchAsyncErrors(async (req, res, next) => {
  const { code, itemSubtotal, itemCount, categories, productIds } = req.body || {};

  if (typeof code !== "string" || !code.trim()) {
    return next(new ErrorHandler("Coupon code is required", 400));
  }

  // Full eligibility path when cart context is supplied. /available always
  // sends it; the manual entry box on the cart does too (now that the
  // applyCoupon caller passes itemCount). The legacy reward-only path
  // stays as a fallback for callers that haven't been updated.
  const hasContext =
    Number.isFinite(Number(itemCount)) || Array.isArray(categories) || Array.isArray(productIds);

  if (hasContext) {
    const isFirstOrder = await resolveIsFirstOrder(req.user?._id);
    const verdict = await couponService.evaluateForCart(code, {
      subtotal: Number(itemSubtotal) || 0,
      itemCount: Number(itemCount) || 0,
      categories: Array.isArray(categories) ? categories : [],
      productIds: Array.isArray(productIds) ? productIds : [],
      user: req.user?._id || null,
      isFirstOrder,
    });
    if (!verdict.valid) {
      return res.status(200).json({
        success: true,
        valid: false,
        code: verdict.code,
        message: verdict.reason || "Coupon not eligible for this cart",
      });
    }
    const coupon = verdict.coupon;
    return res.status(200).json({
      success: true,
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: verdict.reward.discountAmount,
        freeShipping: verdict.reward.freeShipping,
      },
    });
  }

  // Legacy reward-only preview — kept so existing callers (and the
  // cart's manual-entry fallback) don't break before they get updated.
  let preview;
  try {
    preview = couponService.previewDiscount(code, Number(itemSubtotal) || 0);
  } catch (err) {
    return next(err);
  }

  if (!preview.valid) {
    return res.status(200).json({
      success: true,
      valid: false,
      code: preview.code,
      message: "Coupon not found",
    });
  }

  return res.status(200).json({
    success: true,
    valid: true,
    coupon: {
      code: preview.code,
      discountType: preview.discountType,
      discountValue: preview.discountValue,
      discountAmount: preview.discountAmount,
      freeShipping: preview.freeShipping,
    },
  });
});

/**
 * GET /api/v1/coupon/available
 * Query: ?subtotal=&itemCount=
 * Returns the offers a customer is eligible for in the current cart.
 */
exports.getAvailableCoupons = catchAsyncErrors(async (req, res) => {
  const subtotal = Number(req.query.subtotal) || 0;
  const itemCount = Number(req.query.itemCount) || 0;
  const isFirstOrder = await resolveIsFirstOrder(req.user?._id);
  const coupons = await couponService.listAvailable({
    subtotal,
    itemCount,
    isFirstOrder,
    user: req.user?._id || null,
  });
  res.status(200).json({ success: true, coupons });
});

/**
 * GET /api/v1/coupon/best-deal
 * Query: ?subtotal=&itemCount=
 * Returns the single best coupon for the cart, or null when none qualify.
 */
exports.getBestDeal = catchAsyncErrors(async (req, res) => {
  const subtotal = Number(req.query.subtotal) || 0;
  const itemCount = Number(req.query.itemCount) || 0;
  const isFirstOrder = await resolveIsFirstOrder(req.user?._id);
  const best = await couponService.bestDeal({
    subtotal,
    itemCount,
    isFirstOrder,
    user: req.user?._id || null,
  });
  res.status(200).json({ success: true, best });
});

// ─── Admin ──────────────────────────────────────────────────────────────────

exports.createCoupon = catchAsyncErrors(async (req, res, next) => {
  try {
    const coupon = await couponService.createCoupon(req.body, req.user?._id);
    logger.info(`Coupon created: ${coupon.code} by ${req.user?._id}`);
    res.status(201).json({ success: true, coupon: coupon.toClientJSON() });
  } catch (err) {
    return next(err);
  }
});

exports.listAllCoupons = catchAsyncErrors(async (req, res) => {
  const coupons = await couponService.listAllCoupons();
  res.status(200).json({
    success: true,
    coupons: coupons.map((c) => c.toClientJSON()),
  });
});

exports.getCoupon = catchAsyncErrors(async (req, res, next) => {
  try {
    const coupon = await couponService.getCoupon(req.params.id);
    res.status(200).json({ success: true, coupon: coupon.toClientJSON() });
  } catch (err) {
    return next(err);
  }
});

exports.updateCoupon = catchAsyncErrors(async (req, res, next) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    logger.info(`Coupon updated: ${coupon.code} by ${req.user?._id}`);
    res.status(200).json({ success: true, coupon: coupon.toClientJSON() });
  } catch (err) {
    return next(err);
  }
});

exports.toggleCoupon = catchAsyncErrors(async (req, res, next) => {
  try {
    const coupon = await couponService.toggleCoupon(req.params.id);
    logger.info(`Coupon toggled: ${coupon.code} active=${coupon.active}`);
    res.status(200).json({ success: true, coupon: coupon.toClientJSON() });
  } catch (err) {
    return next(err);
  }
});

exports.deleteCoupon = catchAsyncErrors(async (req, res, next) => {
  try {
    await couponService.deleteCoupon(req.params.id);
    logger.info(`Coupon deleted: ${req.params.id} by ${req.user?._id}`);
    res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
});

exports.getCouponAnalytics = catchAsyncErrors(async (req, res) => {
  const analytics = await couponService.getAnalytics();
  res.status(200).json({ success: true, analytics });
});
