// Coupons reducer — one slice with three buckets (available, best deal,
// admin). Mirrors the productReducer shape so the admin pages can drop in
// without learning a new pattern.

import { createReducer } from "@reduxjs/toolkit";

const initial = {
  // Public
  availableCoupons: [],
  bestDeal: null,
  // Admin
  allCoupons: [],
  newCoupon: null,
  analytics: null,
  // Flags
  loading: false,
  error: null,
  isCreated: false,
  isUpdated: false,
  isDeleted: false,
  isToggled: false,
};

export const couponReducer = createReducer(initial, (builder) => {
  builder
    // ─── Public ────────────────────────────────────────────────────────
    .addCase("AvailableCouponsRequest", (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase("AvailableCouponsSuccess", (state, action) => {
      state.loading = false;
      state.availableCoupons = action.payload;
    })
    .addCase("AvailableCouponsFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("BestDealRequest", (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase("BestDealSuccess", (state, action) => {
      state.loading = false;
      state.bestDeal = action.payload;
    })
    .addCase("BestDealFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    // ─── Admin list ────────────────────────────────────────────────────
    .addCase("AdminCouponsRequest", (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase("AdminCouponsSuccess", (state, action) => {
      state.loading = false;
      state.allCoupons = action.payload;
    })
    .addCase("AdminCouponsFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    // ─── Create ────────────────────────────────────────────────────────
    .addCase("NewCouponRequest", (state) => {
      state.loading = true;
      state.error = null;
      state.isCreated = false;
    })
    .addCase("NewCouponSuccess", (state, action) => {
      state.loading = false;
      state.newCoupon = action.payload;
      state.isCreated = true;
    })
    .addCase("NewCouponFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isCreated = false;
    })
    // ─── Update ────────────────────────────────────────────────────────
    .addCase("UpdateCouponRequest", (state) => {
      state.loading = true;
      state.error = null;
      state.isUpdated = false;
    })
    .addCase("UpdateCouponSuccess", (state) => {
      state.loading = false;
      state.isUpdated = true;
    })
    .addCase("UpdateCouponFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    // ─── Toggle ────────────────────────────────────────────────────────
    .addCase("ToggleCouponRequest", (state) => {
      state.loading = true;
      state.isToggled = false;
    })
    .addCase("ToggleCouponSuccess", (state) => {
      state.loading = false;
      state.isToggled = true;
    })
    .addCase("ToggleCouponFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    // ─── Delete ────────────────────────────────────────────────────────
    .addCase("DeleteCouponRequest", (state) => {
      state.loading = true;
      state.isDeleted = false;
    })
    .addCase("DeleteCouponSuccess", (state) => {
      state.loading = false;
      state.isDeleted = true;
    })
    .addCase("DeleteCouponFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    // ─── Analytics ─────────────────────────────────────────────────────
    .addCase("CouponAnalyticsRequest", (state) => {
      state.loading = true;
    })
    .addCase("CouponAnalyticsSuccess", (state, action) => {
      state.loading = false;
      state.analytics = action.payload;
    })
    .addCase("CouponAnalyticsFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    // ─── Shared ────────────────────────────────────────────────────────
    .addCase("ClearCouponErrors", (state) => {
      state.error = null;
    })
    .addCase("ResetCouponFlags", (state) => {
      state.isCreated = false;
      state.isUpdated = false;
      state.isDeleted = false;
      state.isToggled = false;
    });
});
