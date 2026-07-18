import { createReducer } from "@reduxjs/toolkit";

/**
 * Wishlist slice.
 * items: Array<{ _id, name, price, ...productFields, addedAt }>
 * ids:   Set-like Array<string> for O(1) membership checks.
 */
const initialState = {
  items: [],
  ids: [],
  loading: false,
  error: null,
};

const wishlistReducer = createReducer(initialState, (builder) => {
  builder
    // GET /api/v1/wishlist
    .addCase("GetWishlistRequest", (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase("GetWishlistSuccess", (state, action) => {
      state.loading = false;
      state.items = action.payload.items || [];
      state.ids = (action.payload.items || []).map((p) => String(p._id));
      state.error = null;
    })
    .addCase("GetWishlistFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    // Optimistic add
    .addCase("AddToWishlistRequest", (state, action) => {
      const id = String(action.payload);
      if (!state.ids.includes(id)) state.ids.push(id);
    })
    .addCase("AddToWishlistSuccess", (state, _action) => {
      // success: count from server is in payload.items but we keep ids sync
      state.error = null;
    })
    .addCase("AddToWishlistFailure", (state, action) => {
      // Roll back optimistic insert
      const id = String(action.meta?.arg || "");
      if (id) state.ids = state.ids.filter((x) => x !== id);
      state.error = action.payload;
    })

    // Optimistic remove
    .addCase("RemoveFromWishlistRequest", (state, action) => {
      const id = String(action.payload);
      state.ids = state.ids.filter((x) => x !== id);
      state.items = state.items.filter((p) => String(p._id) !== id);
    })
    .addCase("RemoveFromWishlistSuccess", (state) => {
      state.error = null;
    })
    .addCase("RemoveFromWishlistFailure", (state, action) => {
      // Restore — server is source of truth
      const id = String(action.meta?.arg || "");
      if (id && !state.ids.includes(id)) state.ids.push(id);
      state.error = action.payload;
    })

    // Reset on logout
    .addCase("LogoutUserSuccess", (state) => {
      state.items = [];
      state.ids = [];
      state.loading = false;
      state.error = null;
    });
});

export { wishlistReducer };
export default wishlistReducer;
