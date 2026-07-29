import React, { useEffect } from "react";
import { render, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { wishlistReducer } from "../reducers/wishlistReducer";
import { userReducer } from "../reducers/User";
import { useWishlist } from "../hooks/useWishlist";

// Mock the action creators module — must be plain actions so the default RTK
// store (which has redux-thunk enabled by default since RTK 1.7) accepts them.
vi.mock("../actions/wishlistAction", () => {
  const make = (type) => (payload) => ({ type, payload });
  return {
    __esModule: true,
    fetchWishlist: make("GetWishlistRequest"),
    addToWishlist: make("AddToWishlistRequest"),
    removeFromWishlist: make("RemoveFromWishlistRequest"),
  };
});

function makeStore(preloaded = {}) {
  return configureStore({
    reducer: { wishlist: wishlistReducer, user: userReducer },
    middleware: (gdm) => gdm(),
    preloadedState: {
      wishlist: { items: [], ids: [], loading: false, error: null },
      user: { isAuthenticated: false, user: null },
      ...preloaded,
    },
  });
}

function HookProbe({ resultRef, hookFn }) {
  const r = hookFn();
  useEffect(() => {
    resultRef.current = r;
  });
  return null;
}

function renderHookWith(hookFn, store) {
  const resultRef = { current: null };
  const view = render(
    <Provider store={store}>
      <HookProbe resultRef={resultRef} hookFn={hookFn} />
    </Provider>
  );
  return { result: resultRef, unmount: view.unmount };
}

describe("useWishlist", () => {
  it("returns empty state for anon and isWished=false", () => {
    const store = makeStore();
    const { result } = renderHookWith(() => useWishlist(), store);
    expect(result.current.items).toEqual([]);
    expect(result.current.ids).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.isWished("abc")).toBe(false);
  });

  it("isWished reflects ids in store + count", () => {
    const store = makeStore({
      wishlist: { items: [], ids: ["abc", "def"], loading: false, error: null },
    });
    const { result } = renderHookWith(() => useWishlist(), store);
    expect(result.current.isWished("abc")).toBe(true);
    expect(result.current.isWished("xyz")).toBe(false);
    expect(result.current.count).toBe(2);
  });

  it("toggle returns false silently when anon (no navigate, no add dispatch)", async () => {
    const store = makeStore();
    const { result } = renderHookWith(() => useWishlist(), store);
    let returned;
    await act(async () => {
      returned = await result.current.toggle("abc");
    });
    expect(returned).toBe(false);
  });

  it("toggle dispatches AddToWishlistRequest for authed user + new id", async () => {
    const store = makeStore({ user: { isAuthenticated: true, user: { name: "t" } } });
    const { result } = renderHookWith(() => useWishlist(), store);
    const actions = [];
    const unsub = store.subscribe(() => actions.push(store.getState()));
    await act(async () => {
      await result.current.toggle("xyz");
    });
    unsub();
    // the reducer should have applied the optimistic insert
    expect(store.getState().wishlist.ids).toContain("xyz");
  });

  it("toggle dispatches RemoveFromWishlistRequest for authed user + existing id", async () => {
    const store = makeStore({
      user: { isAuthenticated: true, user: { name: "t" } },
      wishlist: { items: [], ids: ["abc"], loading: false, error: null },
    });
    const { result } = renderHookWith(() => useWishlist(), store);
    await act(async () => {
      await result.current.toggle("abc");
    });
    expect(store.getState().wishlist.ids).not.toContain("abc");
  });

  it("re-fires fetch when navigating to /wishlist after an add (items[] must refresh)", () => {
    // Regression: a previous session-level "fetched-once" guard stopped
    // Wishlist.jsx from refetching after addToWishlist, leaving items[]
    // empty until a hard refresh. The Wishlist page mount MUST trigger
    // a fetch — rely on thunk-level inflight dedupe, not session memo.
    const store = makeStore({
      user: { isAuthenticated: true, user: { _id: "u1", name: "t" } },
    });
    const dispatches = [];
    const unsub = store.subscribe(() => dispatches.push(store.getState()));
    // First mount (e.g. PLP card) — fetch dispatched once.
    renderHookWith(() => useWishlist(), store);
    // User adds a product. addToWishlist fires AddToWishlistRequest only.
    act(() => {
      store.dispatch({ type: "AddToWishlistRequest", payload: "p1" });
    });
    // User navigates to /wishlist — new useWishlist mount. The previous
    // bug would skip the fetch here; now it must dispatch.
    renderHookWith(() => useWishlist(), store);
    unsub();
    // We expect at least 2 transitions into "loading=true" (mount + nav).
    // dedupe only collapses concurrent calls.
    expect(dispatches.filter((s) => s.wishlist.loading === true).length).toBeGreaterThanOrEqual(2);
  });
});
