// routes/couponRoute.js
// Two surfaces exposed as separate routers so the mount paths line up
// with the existing /api/v1/coupon and /api/v1/admin/coupons conventions:
//
//   publicRouter  — POST /validate, GET /available, GET /best-deal
//                   mounted at /api/v1/coupon
//   adminRouter   — CRUD + analytics under /admin/coupons[/...]
//                   mounted at /api/v1/

const express = require("express");
const {
  validateCoupon,
  getAvailableCoupons,
  getBestDeal,
  createCoupon,
  listAllCoupons,
  getCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
  getCouponAnalytics,
} = require("../controllers/couponController");
const { couponLimiter } = require("../middleware/couponLimiter");
const { isAuthenticatedUser, authorizeRoles, optionalAuth } = require("../middleware/auth");
const { cache, invalidateCache } = require("../middleware/cache");
const {
  validateCreateCoupon,
  validateUpdateCoupon,
  validateCouponId,
} = require("../middleware/validation");

// Pattern matches the URL segment "coupon" (singular) — the public route
// lives at /api/v1/coupon/available, NOT /api/v1/coupons. Using the plural
// silently never invalidates (String.includes is exact, not a prefix).
const invalidateCouponCache = invalidateCache("coupon");

// ─── Public ────────────────────────────────────────────────────────────────
// `optionalAuth` lets the engine resolve `isFirstOrder` for logged-in
// shoppers while keeping the routes open to anonymous users. Without it,
// WELCOME10 (firstOrderOnly) would leak into /available for returning
// users because the engine treats isFirstOrder=undefined as "no constraint".
const publicRouter = express.Router();
publicRouter.post("/validate", couponLimiter, optionalAuth, validateCoupon);
publicRouter.get("/available", optionalAuth, cache("coupons", 60), getAvailableCoupons);
publicRouter.get("/best-deal", optionalAuth, cache("coupons", 60), getBestDeal);

// ─── Admin ──────────────────────────────────────────────────────────────────
const adminRouter = express.Router();

adminRouter.get("/admin/coupons", isAuthenticatedUser, authorizeRoles("admin"), listAllCoupons);

adminRouter.get(
  "/admin/coupons/analytics",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getCouponAnalytics
);

adminRouter.get(
  "/admin/coupon/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  validateCouponId,
  getCoupon
);

adminRouter.post(
  "/admin/coupon/new",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  validateCreateCoupon,
  invalidateCouponCache,
  createCoupon
);

adminRouter.put(
  "/admin/coupon/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  validateCouponId,
  validateUpdateCoupon,
  invalidateCouponCache,
  updateCoupon
);

adminRouter.patch(
  "/admin/coupon/:id/toggle",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  validateCouponId,
  invalidateCouponCache,
  toggleCoupon
);

adminRouter.delete(
  "/admin/coupon/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  validateCouponId,
  invalidateCouponCache,
  deleteCoupon
);

module.exports = { publicRouter, adminRouter };
