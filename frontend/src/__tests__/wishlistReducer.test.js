import { wishlistReducer } from "../reducers/wishlistReducer";

describe("wishlistReducer", () => {
  const initial = { items: [], ids: [], loading: false, error: null };

  it("returns initial state on unknown action", () => {
    expect(wishlistReducer(undefined, { type: "@@INIT" })).toEqual(initial);
  });

  it("GetWishlistSuccess populates items + ids", () => {
    const items = [
      { _id: "a1", name: "A" },
      { _id: "b2", name: "B" },
    ];
    const next = wishlistReducer(initial, {
      type: "GetWishlistSuccess",
      payload: { items, count: 2 },
    });
    expect(next.items).toEqual(items);
    expect(next.ids).toEqual(["a1", "b2"]);
    expect(next.loading).toBe(false);
  });

  it("AddToWishlistRequest inserts id optimistically", () => {
    const next = wishlistReducer(initial, { type: "AddToWishlistRequest", payload: "a1" });
    expect(next.ids).toContain("a1");
  });

  it("AddToWishlistFailure rolls back the optimistic insert", () => {
    let state = wishlistReducer(initial, { type: "AddToWishlistRequest", payload: "a1" });
    state = wishlistReducer(state, {
      type: "AddToWishlistFailure",
      payload: "a1",
      meta: { arg: "a1" },
    });
    expect(state.ids).not.toContain("a1");
  });

  it("RemoveFromWishlistRequest removes id immediately", () => {
    let state = wishlistReducer(initial, { type: "AddToWishlistRequest", payload: "a1" });
    state = wishlistReducer(state, { type: "RemoveFromWishlistRequest", payload: "a1" });
    expect(state.ids).not.toContain("a1");
  });

  it("RemoveFromWishlistFailure restores the id", () => {
    let state = wishlistReducer(initial, { type: "AddToWishlistRequest", payload: "a1" });
    state = wishlistReducer(state, { type: "RemoveFromWishlistRequest", payload: "a1" });
    state = wishlistReducer(state, {
      type: "RemoveFromWishlistFailure",
      payload: "a1",
      meta: { arg: "a1" },
    });
    expect(state.ids).toContain("a1");
  });

  it("LogoutUserSuccess clears the wishlist", () => {
    const seeded = { items: [{ _id: "a1" }], ids: ["a1"], loading: false, error: null };
    const next = wishlistReducer(seeded, { type: "LogoutUserSuccess" });
    expect(next.items).toEqual([]);
    expect(next.ids).toEqual([]);
  });
});
