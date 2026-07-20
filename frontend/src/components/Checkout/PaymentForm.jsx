import React from "react";
import { CardElement } from "@stripe/react-stripe-js";
import { Surface, SurfaceHeader } from "../../design/primitives";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      fontFamily: '"Inter", system-ui, sans-serif',
      color: "var(--t-neutral-900)",
      "::placeholder": { color: "var(--t-neutral-400)" },
    },
    invalid: { color: "var(--t-semantic-error)" },
  },
  hidePostalCode: true,
};

function PaymentForm() {
  return (
    <Surface aria-label="Payment" sx={{ p: { xs: 2.5, sm: 4 } }}>
      <SurfaceHeader
        title="Payment"
        subtitle="Test card: 4242 4242 4242 4242 — any future expiry, any CVC."
      />

      <div
        style={{
          padding: "16px",
          border: "1px solid var(--t-neutral-300)",
          borderRadius: "var(--t-border-radius-base)",
          background: "#fff",
          transition: "border-color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
        }}
      >
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
    </Surface>
  );
}

export default PaymentForm;
