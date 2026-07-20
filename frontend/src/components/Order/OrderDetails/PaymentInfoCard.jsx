import React from "react";
import {
  Card,
  CardBody,
  BodyText,
  Divider,
  SeverityPill,
  Price,
  Overline,
} from "../../../design/primitives";
import { fmtInCurrency } from "../../../utils/fmtInCurrency";

function PaymentInfoCard({
  status,
  amount,
  tax,
  itemPrice = null,
  shippingPrice = null,
  discount = null,
  coupon = null,
  currency = "USD",
  rate = 1,
}) {
  const fmtAmt = fmtInCurrency(amount, currency, rate);
  const fmtTax = fmtInCurrency(tax, currency, rate);
  const fmtItem = itemPrice != null ? fmtInCurrency(itemPrice, currency, rate) : null;
  const fmtShip = shippingPrice != null ? fmtInCurrency(shippingPrice, currency, rate) : null;
  const fmtDisc = discount != null ? fmtInCurrency(discount, currency, rate) : null;
  const isPaid = status === "succeeded";
  // freeShipping coupons are stored as a "discount" line on the order so
  // the Order document's discount field represents the actual amount saved —
  // the original shipping cost was waived. Show the strike-through so
  // the receipt reads correctly.
  const freeShipping = coupon?.discountType === "freeShipping";

  return (
    <Card>
      <CardBody>
        <Overline style={{ marginBottom: 4 }}>Payment Info</Overline>
        <BodyText small style={{ color: "var(--t-neutral-400)", marginBottom: 16 }}>
          To check if the payment has been processed successfully
        </BodyText>
        <Divider style={{ marginBottom: 16 }} />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <SeverityPill color={isPaid ? "success" : "error"}>
              {isPaid ? "PAID" : "NOT PAID"}
            </SeverityPill>
          </div>
          <div>
            <BodyText>
              Amount: <Price style={{ fontSize: "var(--t-fontSize-sm)" }}>{fmtAmt}</Price>{" "}
              <span style={{ color: "var(--t-neutral-400)" }}>(Incl. {fmtTax} Tax)</span>
            </BodyText>
          </div>
        </div>

        {/* Order total breakdown — mirrors the checkout Order Summary so
            the customer can see exactly what they paid for and what was
            saved. All fields are optional so the card still renders for
            orders that pre-date the breakdown (legacy order docs). */}
        {fmtItem && (
          <>
            <Divider style={{ marginBottom: 12 }} />
            <Overline style={{ marginBottom: 8 }}>Order total</Overline>
            <div style={{ display: "grid", gap: 6 }}>
              <Row label="Subtotal" value={fmtItem} />
              {fmtShip != null && (
                <Row
                  label={freeShipping ? "Shipping (free)" : "Shipping"}
                  value={
                    freeShipping && shippingPrice > 0 ? (
                      <span style={{ display: "inline-flex", gap: 6, alignItems: "baseline" }}>
                        <span
                          style={{ textDecoration: "line-through", color: "var(--t-neutral-400)" }}
                        >
                          {fmtShip}
                        </span>
                        <span
                          style={{ color: "var(--t-accent-sage-600, #5a7350)", fontWeight: 600 }}
                        >
                          Free
                        </span>
                      </span>
                    ) : (
                      fmtShip
                    )
                  }
                  tone={freeShipping && shippingPrice > 0 ? "positive" : undefined}
                />
              )}
              {fmtDisc != null && fmtDisc !== "$0.00" && (
                <Row
                  label={`Discount${coupon?.code ? ` (${coupon.code})` : ""}`}
                  value={`-${fmtDisc}`}
                  tone="positive"
                />
              )}
              <Row label="Tax" value={fmtTax} />
              <Divider style={{ marginY: 8 }} />
              <Row label="Total" value={fmtAmt} emphasis />
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function Row({ label, value, tone, emphasis }) {
  const color = tone === "positive" ? "var(--t-accent-sage-600, #5a7350)" : "var(--t-neutral-900)";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        fontSize: emphasis ? "var(--t-fontSize-md)" : "var(--t-fontSize-sm)",
        fontWeight: emphasis ? 600 : 400,
        color,
      }}
    >
      <span style={{ color: tone === "positive" ? color : "var(--t-neutral-700)" }}>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

export default PaymentInfoCard;
