import { createReducer } from "@reduxjs/toolkit";

/**
 * Cart reducer.
 *
 * cartItems: persisted to localStorage. The payload (product id, name, price,
 * image URL, stock, quantity) contains NO PII — only product metadata — so
 * localStorage is safe and the cart survives a page refresh.
 *
 * shippingInfo: in-memory only. Address / phone / name / email are PII; we
 * do not write them to disk or session storage. They live only as long as
 * the SPA session (cleared by ClearCart or tab close).
 *
 * coupon: in-memory only. Discount state is ephemeral and should not be
 * cached between visits.
 *
 * Note: the audit #S3 fix removed ALL persistence, which broke cart-on-
 * refresh and several E2E tests that navigate via page.goto (a hard reload).
 * We restore cartItems persistence here; shippingInfo stays in-memory per
 * the audit's PII concern.
 */
const STORAGE_KEY = "cartItems";

function loadCartItems() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCartItems(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full / disabled — silent. Cart still works in-memory.
  }
}

function clearStoredCart() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

const initialState = {
  cartItems: loadCartItems(),
  shippingInfo: {}, // PII — in-memory only
  coupon: null,
};

export const cartReducer = createReducer(initialState, (builder) => {
  builder
    .addCase("AddToCart", (state = { cartItems: [] }, action) => {
      const item = action.payload;
      const isItemExist = state.cartItems.find((i) => i.product === item.product);
      if (isItemExist) {
        state.cartItems = state.cartItems.map((i) =>
          i.product === isItemExist.product ? item : i
        );
      } else {
        state.cartItems = [...state.cartItems, item];
      }
      saveCartItems(state.cartItems);
    })
    .addCase("RemoveFromCart", (state, action) => {
      state.cartItems = state.cartItems.filter((i) => i.product !== action.payload);
      saveCartItems(state.cartItems);
    })
    .addCase("SaveShippingInfo", (state, action) => {
      state.shippingInfo = action.payload;
    })
    .addCase("ApplyCoupon", (state, action) => {
      state.coupon = action.payload;
    })
    .addCase("RemoveCoupon", (state) => {
      state.coupon = null;
    })
    .addCase("ClearCart", (state) => {
      state.cartItems = [];
      state.shippingInfo = {};
      state.coupon = null;
      clearStoredCart();
    });
});
