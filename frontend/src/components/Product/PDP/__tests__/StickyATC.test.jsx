import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StickyATC from "../StickyATC";

// jsdom doesn't ship matchMedia — StickyATC's effect calls
// window.matchMedia("(max-width: 900px)"). Without a polyfill we'd crash
// and the success-case render would never happen. Mirror the polyfill
// pattern established by Cart/__tests__/BasketCouponRevalidate.test.jsx.
beforeEach(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
});

// currencyContext triggers a fetch on mount — stub it so we don't depend
// on /api/v1/currency/rates being reachable in the test env.
vi.mock("../../../../utils/currencyContext", () => ({
  useCurrency: () => ({ fmt: (n) => `$${Number(n).toFixed(2)}`, code: "USD", rate: 1 }),
}));

describe("StickyATC", () => {
  const baseProps = {
    price: 100,
    quantity: 2,
    setQuantity: vi.fn(),
    increaseQty: vi.fn(),
    decreaseQty: vi.fn(),
    addToCartHandler: vi.fn(),
    stock: 5,
    visible: true,
  };

  it("renders price, qty stepper, and ATC when visible", () => {
    render(<StickyATC {...baseProps} />);
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("hides entirely when visible=false", () => {
    const { container } = render(<StickyATC {...baseProps} visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("hides when stock=0", () => {
    const { container } = render(<StickyATC {...baseProps} stock={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("ATC button click invokes addToCartHandler", () => {
    const add = vi.fn();
    render(<StickyATC {...baseProps} addToCartHandler={add} />);
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(add).toHaveBeenCalledWith(2);
  });
});
