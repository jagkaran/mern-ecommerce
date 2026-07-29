import axios from "axios";

// Module-level dedupe: every mounted useWishlist() consumer (one per
// ProductCard on PLP) used to dispatch its own GET /wishlist on mount —
// ~12 cards = 12 calls, blowing the 300/15min globalLimiter on session
// open. Share the inflight promise so N dispatches = 1 network call.
let _wishlistInflight = null;
export function _resetWishlistInflight() {
  _wishlistInflight = null;
}

// GET /api/v1/wishlist
export const fetchWishlist = () => async (dispatch) => {
  if (_wishlistInflight) return _wishlistInflight;
  _wishlistInflight = (async () => {
    try {
      dispatch({ type: "GetWishlistRequest" });
      const { data } = await axios.get("/api/v1/wishlist");
      dispatch({ type: "GetWishlistSuccess", payload: data });
    } catch (error) {
      // 401 for anon users is expected — silently clear state, don't toast
      if (error.response?.status === 401) {
        dispatch({ type: "GetWishlistSuccess", payload: { items: [], count: 0 } });
        return;
      }
      dispatch({
        type: "GetWishlistFailure",
        payload: error.response?.data?.message || error.message,
      });
    } finally {
      _wishlistInflight = null;
    }
  })();
  return _wishlistInflight;
};

// PUT /api/v1/wishlist/:productId  (idempotent add)
export const addToWishlist = (productId) => async (dispatch) => {
  try {
    dispatch({ type: "AddToWishlistRequest", payload: productId });
    await axios.put(`/api/v1/wishlist/${productId}`);
    // Reducer optimistically adds the id; the next fetchWishlist (triggered
    // by the auth-flip / first-mount guard in useWishlist) will hydrate
    // items metadata. Skipping the dispatch here cuts add-path fetch count
    // in half — the cascade source.
    dispatch({ type: "AddToWishlistSuccess" });
  } catch (error) {
    dispatch({
      type: "AddToWishlistFailure",
      payload: productId,
      meta: { arg: productId },
    });
    throw error;
  }
};

// DELETE /api/v1/wishlist/:productId  (idempotent remove)
export const removeFromWishlist = (productId) => async (dispatch) => {
  try {
    dispatch({ type: "RemoveFromWishlistRequest", payload: productId });
    await axios.delete(`/api/v1/wishlist/${productId}`);
    dispatch({ type: "RemoveFromWishlistSuccess", payload: productId });
  } catch (error) {
    dispatch({
      type: "RemoveFromWishlistFailure",
      payload: productId,
      meta: { arg: productId },
    });
    throw error;
  }
};
