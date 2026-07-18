import axios from "axios";

// GET /api/v1/wishlist
export const fetchWishlist = () => async (dispatch) => {
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
  }
};

// PUT /api/v1/wishlist/:productId  (idempotent add)
export const addToWishlist = (productId) => async (dispatch) => {
  try {
    dispatch({ type: "AddToWishlistRequest", payload: productId });
    await axios.put(`/api/v1/wishlist/${productId}`);
    // Re-fetch the full list so items metadata (price, images) stays fresh
    dispatch({ type: "AddToWishlistSuccess" });
    dispatch(fetchWishlist());
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
