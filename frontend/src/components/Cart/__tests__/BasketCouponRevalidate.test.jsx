// BasketCouponRevalidate.test.js
// Locks the auto-remove behavior: a coupon that meets minSubtotal at apply
// time must be removed from Redux if the user later reduces cart subtotal
// below the threshold. Without this, the stale discount would slip into
// /order/new and surface as a confusing 400.

import { render, waitFor, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import { cartReducer } from "../../../reducers/Cart";
import Basket from "../Basket";

vi.mock("axios");

// jsdom doesn't ship matchMedia — Basket's UI primitives use it for the
// prefers-reduced-motion branch. Stub it.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

vi.mock("../../../utils/currencyContext", () => ({
  useCurrency: () => ({ fmt: (n) => `$${Number(n).toFixed(2)}`, code: "USD", rate: 1 }),
}));

vi.mock("../../../hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

// Suppress stock re-fetch noise; not relevant to this test.
const makeStore = (initialCart) =>
  configureStore({ reducer: { cart: cartReducer }, preloadedState: { cart: initialCart } });

const items = (subtotalEach, qty) => [
  { product: "p1", name: "P", price: subtotalEach, quantity: qty, image: "x" },
];

describe("Basket — coupon revalidation on cart change", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the coupon applied while subtotal meets minSubtotal", async () => {
    const cart = {
      cartItems: items(50, 3),
      shippingInfo: {},
      coupon: { code: "FLAT25", discountType: "flat", discountAmount: 25 },
    }; // subtotal 150 ≥ 100
    axios.post.mockResolvedValueOnce({ data: { success: true, valid: true, coupon: cart.coupon } });
    const store = makeStore(cart);
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Basket />
        </MemoryRouter>
      </Provider>
    );
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(store.getState().cart.coupon).toBeTruthy();
  });

  it("REMOVES the coupon when cart drops below minSubtotal", async () => {
    // Apply with $150 cart, then drop to $50 (below $100 min).
    const cart = {
      cartItems: items(50, 3),
      shippingInfo: {},
      coupon: { code: "FLAT25", discountType: "flat", discountAmount: 25 },
    };
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        valid: false,
        code: "FLAT25",
        message: "Cart total must be at least $100",
      },
    });
    const store = makeStore(cart);
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Basket />
        </MemoryRouter>
      </Provider>
    );
    await waitFor(() => expect(store.getState().cart.coupon).toBeNull());
  });

  it("does nothing when no coupon is applied", async () => {
    const cart = { cartItems: items(50, 3), shippingInfo: {}, coupon: null };
    const store = makeStore(cart);
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Basket />
        </MemoryRouter>
      </Provider>
    );
    // Give the effect a tick — axios should NOT be called for revalidation.
    await new Promise((r) => setTimeout(r, 30));
    expect(axios.post).not.toHaveBeenCalled();
  });
});
