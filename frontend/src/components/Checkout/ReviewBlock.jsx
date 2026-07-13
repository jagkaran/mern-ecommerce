import React from "react";

const fmt = (n) => `$${Number(n).toFixed(2)}`;

export default function ReviewBlock({ subtotal = 0, shipping = 0, tax = 0 }) {
  const total = Number(subtotal) + Number(shipping) + Number(tax);
  return (
    <section aria-label="Order summary">
      <h2>Order summary</h2>
      <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 8 }}>
        <dt>Subtotal</dt>
        <dd style={{ textAlign: "right" }}>{fmt(subtotal)}</dd>

        <dt>Shipping</dt>
        <dd style={{ textAlign: "right" }}>{fmt(shipping)}</dd>

        <dt>Tax</dt>
        <dd style={{ textAlign: "right" }}>{fmt(tax)}</dd>
      </dl>
      <hr />
      <div
        data-testid="total"
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 700,
          fontSize: "var(--t-fontSize-lg, 1.125rem)",
        }}
      >
        <span>Total</span>
        <span>{fmt(total)}</span>
      </div>
    </section>
  );
}