import { createReducer } from "@reduxjs/toolkit";

// shippingInfo uses sessionStorage (not localStorage) so PII is never
// persisted across browser sessions. cartItems stays in localStorage so
// the cart survives a page refresh but is wiped on tab/window close for
// shipping details.
const initialState = {
  cartItems: localStorage.getItem("cartItems")
    ? JSON.parse(localStorage.getItem("cartItems"))
    : [],
  shippingInfo: sessionStorage.getItem("shippingInfo")
    ? JSON.parse(sessionStorage.getItem("shippingInfo"))
    : {},
};

export const cartReducer = createReducer(initialState, {
  AddToCart: (state = { cartItems: [] }, action) => {
    const item = action.payload;
    const isItemExist = state.cartItems.find((i) => i.product === item.product);
    if (isItemExist) {
      state.cartItems = state.cartItems.map((i) =>
        i.product === isItemExist.product ? item : i
      );
    } else {
      state.cartItems = [...state.cartItems, item];
    }
    localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
  },

  RemoveFromCart: (state, action) => {
    state.cartItems = state.cartItems.filter(
      (i) => i.product !== action.payload
    );
    localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
  },

  SaveShippingInfo: (state, action) => {
    state.shippingInfo = action.payload;
    // sessionStorage: cleared automatically when the tab closes.
    // Prevents address/phone from persisting on shared/public devices.
    sessionStorage.setItem("shippingInfo", JSON.stringify(action.payload));
  },

  // Dispatched on logout — wipes cart items and shipping PII from all storage.
  ClearCart: (state) => {
    state.cartItems   = [];
    state.shippingInfo = {};
    localStorage.removeItem("cartItems");
    sessionStorage.removeItem("shippingInfo");
  },
});
