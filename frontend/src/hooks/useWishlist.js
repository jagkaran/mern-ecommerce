import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "./useToast";
import { fetchWishlist, addToWishlist, removeFromWishlist } from "../actions/wishlistAction";

/**
 * useWishlist — single hook for the entire app.
 *
 * Returns:
 *   ids:     string[] of wishlisted product ids
 *   items:   full product objects (populated from /wishlist)
 *   count:   ids.length
 *   isWished(productId): boolean
 *   toggle(productId): async — adds or removes. Silent for anon (caller decides UX).
 */
export function useWishlist() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { isAuthenticated } = useSelector((s) => s.user);
  const { items, ids, loading } = useSelector((s) => s.wishlist);

  // Load on mount + on auth flip (logged in → fetch; logged out → already empty)
  useEffect(() => {
    if (isAuthenticated) dispatch(fetchWishlist());
  }, [dispatch, isAuthenticated]);

  const isWished = useCallback((productId) => ids.includes(String(productId)), [ids]);

  const toggle = useCallback(
    async (productId) => {
      if (!productId) return;
      if (!isAuthenticated) {
        // Silent — caller can route to /signin via the dedicated /wishlist empty-state.
        // No forced navigation: avoids stealing focus from product browse.
        return false;
      }
      const id = String(productId);
      try {
        if (ids.includes(id)) {
          await dispatch(removeFromWishlist(id));
        } else {
          await dispatch(addToWishlist(id));
        }
        return true;
      } catch (err) {
        const msg =
          err.response?.data?.message || "We couldn't update your wishlist. Please try again.";
        toast.error(msg);
        return false;
      }
    },
    [dispatch, isAuthenticated, ids, toast]
  );

  return {
    items,
    ids,
    count: ids.length,
    loading,
    isAuthenticated,
    isWished,
    toggle,
  };
}
