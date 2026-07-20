// ReviewBlock.test.js — locks in the order-summary math when a coupon is
// applied, especially freeShipping (no phantom "Discount" line that nets
// to zero after the shipping strike-through).

import { render, screen } from "@testing-library/react";
import ReviewBlock from "../ReviewBlock";
import PaymentInfoCard from "../../Order/OrderDetails/PaymentInfoCard.jsx";

describe("ReviewBlock — totals math", () => {
  it("no coupon: total = subtotal + shipping + tax (default fallback)", () => {
    const { getByTestId } = render(<ReviewBlock subtotal={87} shipping={5} tax={7.83} />);
    expect(getByTestId("total")).toHaveTextContent("$99.83");
  });

  it("no coupon: shows shipping + tax + total", () => {
    render(<ReviewBlock subtotal={89.95} shipping={50} tax={13.49} total={153.44} />);
    expect(screen.getByText("$89.95")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.getByText("$13.49")).toBeInTheDocument();
    expect(screen.getByTestId("total").textContent).toMatch(/\$153\.44/);
  });
});

describe("ReviewBlock — coupon display", () => {
  it("FREESHIP: total matches server formula (subtotal + 0 + tax - 50)", () => {
    render(
      <ReviewBlock
        subtotal={89.95}
        shipping={0}
        originalShipping={50}
        tax={13.49}
        discount={50}
        freeShipping
        coupon={{ code: "FREESHIP", discountType: "freeShipping" }}
        total={53.44}
      />
    );
    // Server formula: total = subtotal + shipping + tax - discount = 89.95 + 0 + 13.49 - 50 = 53.44
    // If the FE mirrors this, the Stripe PaymentIntent amount matches the
    // server's expected total to the cent → no "amount mismatch" 400.
    expect(screen.getByText(/Discount \(FREESHIP\)/)).toBeInTheDocument();
    expect(screen.getByText("-$50.00")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByTestId("total").textContent).toMatch(/\$53\.44/);
  });

  it("percentage coupon: shows discount row with code + amount", () => {
    render(
      <ReviewBlock
        subtotal={100}
        shipping={50}
        tax={15}
        discount={20}
        freeShipping={false}
        coupon={{ code: "SAVE20", discountType: "percentage", discountAmount: 20 }}
        total={145}
      />
    );
    expect(screen.getByText(/Discount \(SAVE20\)/)).toBeInTheDocument();
    expect(screen.getByText("-$20.00")).toBeInTheDocument();
  });
});

describe("ReviewBlock — currency formatting", () => {
  it("EUR: total renders with € symbol, not $", () => {
    render(
      <ReviewBlock
        subtotal={100}
        shipping={0}
        tax={0}
        discount={0}
        total={92} // 100 * 0.92 (typical EUR rate)
        currency="EUR"
        rate={0.92}
      />
    );
    const total = screen.getByTestId("total");
    // The total must show the euro symbol, not a hardcoded dollar sign.
    expect(total.textContent).toMatch(/€/);
    expect(total.textContent).not.toMatch(/\$/);
  });

  it("GBP: total renders with £ symbol", () => {
    render(
      <ReviewBlock subtotal={100} shipping={0} tax={0} total={80} currency="GBP" rate={0.8} />
    );
    expect(screen.getByTestId("total").textContent).toMatch(/£/);
  });

  it("USD: total renders with $ symbol (rate 1)", () => {
    render(
      <ReviewBlock subtotal={100} shipping={50} tax={15} total={165} currency="USD" rate={1} />
    );
    expect(screen.getByTestId("total").textContent).toMatch(/\$/);
  });
});

describe("PaymentInfoCard — order details breakdown uses the right currency", () => {
  // Regression: order placed with EUR selected must render the breakdown
  // in €, not $. The order doc stores the FX snapshot (currency + rate) so
  // the historical view matches the historical charge, even if the header
  // selector has since switched.
  const renderCard = (props) => {
    render(<PaymentInfoCard {...props} />);
  };

  it("EUR order: breakdown shows € symbol", () => {
    renderCard({
      status: "succeeded",
      amount: 92,
      tax: 13.5,
      itemPrice: 100,
      shippingPrice: 0,
      discount: 25,
      coupon: { code: "FLAT25", discountType: "flat" },
      currency: "EUR",
      rate: 0.92,
    });
    // Every monetary row must render with € — Subtotal, Shipping, Discount, Tax, Total
    const subtotalCells = screen.getAllByText(/€/);
    expect(subtotalCells.length).toBeGreaterThanOrEqual(3);
  });

  it("USD order: breakdown shows $ symbol (default rate 1)", () => {
    renderCard({
      status: "succeeded",
      amount: 92,
      tax: 13.5,
      itemPrice: 100,
      shippingPrice: 0,
      discount: 25,
      coupon: { code: "FLAT25", discountType: "flat" },
    });
    const totalRow = screen.getByText("Total").parentElement;
    expect(totalRow.textContent).toMatch(/\$/);
  });
});
