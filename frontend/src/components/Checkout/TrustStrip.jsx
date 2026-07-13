import React from "react";

export default function TrustStrip() {
  return (
    <ul
      aria-label="Trust and security"
      style={{
        display: "flex",
        gap: "1.5rem",
        alignItems: "center",
        justifyContent: "center",
        listStyle: "none",
        padding: 0,
        margin: 0,
        fontSize: "var(--t-fontSize-sm, 0.875rem)",
        color: "var(--t-neutral-600, #555)",
      }}
    >
      <li>SSL · Secure checkout</li>
      <li aria-hidden="true">·</li>
      <li>Powered by Stripe</li>
      <li aria-hidden="true">·</li>
      <li>Free returns within 30 days</li>
    </ul>
  );
}