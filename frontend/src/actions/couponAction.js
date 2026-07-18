// Coupon actions — public preview + admin CRUD. Follows the same thunk
// pattern as productAction.js: dispatch *Request → axios → *Success/*Failure.

import axios from "axios";

// ─── Public ────────────────────────────────────────────────────────────────

export const getAvailableCoupons =
  (subtotal = 0, itemCount = 0) =>
  async (dispatch) => {
    try {
      dispatch({ type: "AvailableCouponsRequest" });
      const { data } = await axios.get(
        `/api/v1/coupon/available?subtotal=${subtotal}&itemCount=${itemCount}`
      );
      dispatch({
        type: "AvailableCouponsSuccess",
        payload: data.coupons || [],
      });
    } catch (error) {
      dispatch({
        type: "AvailableCouponsFailure",
        payload: error?.response?.data?.message || "Failed to load offers",
      });
    }
  };

export const getBestDeal =
  (subtotal = 0, itemCount = 0) =>
  async (dispatch) => {
    try {
      dispatch({ type: "BestDealRequest" });
      const { data } = await axios.get(
        `/api/v1/coupon/best-deal?subtotal=${subtotal}&itemCount=${itemCount}`
      );
      dispatch({ type: "BestDealSuccess", payload: data.best || null });
    } catch (error) {
      dispatch({
        type: "BestDealFailure",
        payload: error?.response?.data?.message || "Failed to fetch best deal",
      });
    }
  };

// ─── Admin ──────────────────────────────────────────────────────────────────

export const getAdminCoupons = () => async (dispatch) => {
  try {
    dispatch({ type: "AdminCouponsRequest" });
    const { data } = await axios.get("/api/v1/admin/coupons");
    dispatch({ type: "AdminCouponsSuccess", payload: data.coupons || [] });
  } catch (error) {
    dispatch({
      type: "AdminCouponsFailure",
      payload: error?.response?.data?.message || "Failed to load coupons",
    });
  }
};

export const createCoupon = (payload) => async (dispatch) => {
  try {
    dispatch({ type: "NewCouponRequest" });
    const { data } = await axios.post("/api/v1/admin/coupon/new", payload);
    dispatch({ type: "NewCouponSuccess", payload: data.coupon });
    return { ok: true, coupon: data.coupon };
  } catch (error) {
    dispatch({
      type: "NewCouponFailure",
      payload: error?.response?.data?.message || "Failed to create coupon",
    });
    return { ok: false, error: error?.response?.data?.message };
  }
};

export const updateCoupon = (id, payload) => async (dispatch) => {
  try {
    dispatch({ type: "UpdateCouponRequest" });
    const { data } = await axios.put(`/api/v1/admin/coupon/${id}`, payload);
    dispatch({ type: "UpdateCouponSuccess", payload: data.coupon });
    return { ok: true };
  } catch (error) {
    dispatch({
      type: "UpdateCouponFailure",
      payload: error?.response?.data?.message || "Failed to update coupon",
    });
    return { ok: false, error: error?.response?.data?.message };
  }
};

export const toggleCoupon = (id) => async (dispatch) => {
  try {
    dispatch({ type: "ToggleCouponRequest" });
    const { data } = await axios.patch(`/api/v1/admin/coupon/${id}/toggle`);
    dispatch({ type: "ToggleCouponSuccess", payload: data.coupon });
  } catch (error) {
    dispatch({
      type: "ToggleCouponFailure",
      payload: error?.response?.data?.message || "Failed to toggle coupon",
    });
  }
};

export const deleteCoupon = (id) => async (dispatch) => {
  try {
    dispatch({ type: "DeleteCouponRequest" });
    await axios.delete(`/api/v1/admin/coupon/${id}`);
    dispatch({ type: "DeleteCouponSuccess", payload: id });
  } catch (error) {
    dispatch({
      type: "DeleteCouponFailure",
      payload: error?.response?.data?.message || "Failed to delete coupon",
    });
  }
};

export const getCouponAnalytics = () => async (dispatch) => {
  try {
    dispatch({ type: "CouponAnalyticsRequest" });
    const { data } = await axios.get("/api/v1/admin/coupons/analytics");
    dispatch({ type: "CouponAnalyticsSuccess", payload: data.analytics });
  } catch (error) {
    dispatch({
      type: "CouponAnalyticsFailure",
      payload: error?.response?.data?.message || "Failed to load analytics",
    });
  }
};

export const clearCouponErrors = () => ({ type: "ClearCouponErrors" });
