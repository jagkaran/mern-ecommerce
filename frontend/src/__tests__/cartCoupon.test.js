import { cartReducer } from "../reducers/Cart";

describe("cartReducer — coupon actions", () => {
  const initial = () => ({
    cartItems: [],
    shippingInfo: {},
    coupon: null,
  });

  it("ApplyCoupon sets coupon payload", () => {
    const next = cartReducer(initial(), {
      type: "ApplyCoupon",
      payload: {
        code: "WELCOME10",
        discountType: "percentage",
        discountValue: 10,
        discountAmount: 20,
      },
    });
    expect(next.coupon.code).toBe("WELCOME10");
    expect(next.coupon.discountAmount).toBe(20);
  });

  it("RemoveCoupon clears coupon", () => {
    const state = { ...initial(), coupon: { code: "X", discountAmount: 5 } };
    const next = cartReducer(state, { type: "RemoveCoupon" });
    expect(next.coupon).toBeNull();
  });

  it("ClearCart clears coupon + items + shipping", () => {
    const state = {
      cartItems: [{ product: "a", quantity: 1, price: 10 }],
      shippingInfo: { address: "1 St" },
      coupon: { code: "X", discountAmount: 5 },
    };
    const next = cartReducer(state, { type: "ClearCart" });
    expect(next.cartItems).toEqual([]);
    expect(next.shippingInfo).toEqual({});
    expect(next.coupon).toBeNull();
  });

  it("AddToCart keeps coupon intact", () => {
    const state = { ...initial(), coupon: { code: "X", discountAmount: 5 } };
    const next = cartReducer(state, {
      type: "AddToCart",
      payload: { product: "a", quantity: 1, price: 10, name: "n", image: "i" },
    });
    expect(next.coupon.code).toBe("X");
    expect(next.cartItems).toHaveLength(1);
  });
});
