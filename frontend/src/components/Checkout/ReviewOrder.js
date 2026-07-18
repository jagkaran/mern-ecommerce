import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useCurrency } from "../../utils/currencyContext";
import { Headline, BodyText, Price, Divider, Overline } from "../../design/primitives";

function ReviewOrder({ reviewData, handleReviewDataChange }) {
  const { fmt } = useCurrency();
  const { shippingInfo, cartItems } = useSelector((state) => state.cart);

  const computed = useMemo(() => {
    const subTotal = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const shippingCharges = subTotal > 1000 ? 0 : 50;
    const tax = subTotal * 0.15;
    const totalPrice = subTotal + shippingCharges + tax;
    return { subTotal, shippingCharges, tax, totalPrice };
  }, [cartItems]);

  useEffect(() => {
    const { subTotal, shippingCharges, tax, totalPrice } = computed;
    if (reviewData?.subTotal !== subTotal) handleReviewDataChange("subTotal", subTotal);
    if (reviewData?.shippingCharges !== shippingCharges)
      handleReviewDataChange("shippingCharges", shippingCharges);
    if (reviewData?.tax !== tax) handleReviewDataChange("tax", tax);
    if (reviewData?.totalPrice !== totalPrice) handleReviewDataChange("totalPrice", totalPrice);
  }, [computed, handleReviewDataChange, reviewData]);

  return (
    <div>
      <Overline style={{ marginBottom: 8 }}>Review</Overline>
      <Headline level="xl" style={{ marginBottom: 24 }}>
        Order Summary
      </Headline>

      <BodyText style={{ color: "var(--t-neutral-700)", marginBottom: 8 }}>
        <strong>
          {shippingInfo?.firstName} {shippingInfo?.lastName}
        </strong>
      </BodyText>
      <BodyText small style={{ color: "var(--t-neutral-500)", marginBottom: 24 }}>
        {shippingInfo?.address}, {shippingInfo?.city}, {shippingInfo?.state} {shippingInfo?.zip}
      </BodyText>

      <Divider />
      <BodyText
        style={{
          fontSize: "var(--t-fontSize-sm)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          margin: "24px 0",
          color: "var(--t-neutral-700)",
        }}
      >
        Items
      </BodyText>

      <div style={{ display: "grid", gap: 16 }}>
        {cartItems.map((item, index) => (
          <React.Fragment key={item.product || index}>
            {index > 0 && <Divider />}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "72px 1fr auto",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 80,
                  background: "var(--t-neutral-100)",
                  borderRadius: "var(--t-border-radius-base)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      padding: 4,
                    }}
                  />
                ) : (
                  <BodyText small style={{ color: "var(--t-neutral-400)" }}>
                    No image
                  </BodyText>
                )}
              </div>
              <div>
                <BodyText>
                  <strong>{item.name}</strong>
                </BodyText>
                <BodyText small style={{ color: "var(--t-neutral-400)" }}>
                  Qty: {item.quantity}
                </BodyText>
              </div>
              <div style={{ textAlign: "right" }}>
                <Price style={{ fontSize: "var(--t-fontSize-base)" }}>
                  {fmt(item.price * item.quantity)}
                </Price>
                <BodyText small style={{ color: "var(--t-neutral-400)" }}>
                  {fmt(item.price)} each
                </BodyText>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <Divider style={{ marginTop: 24 }} />

      <div style={{ maxWidth: 320, marginLeft: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <BodyText>Subtotal</BodyText>
          <BodyText>{fmt(reviewData?.subTotal ?? 0)}</BodyText>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <BodyText>Tax (15%)</BodyText>
          <BodyText>{fmt(reviewData?.tax ?? 0)}</BodyText>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <BodyText>Shipping</BodyText>
          <BodyText
            style={{
              color:
                reviewData?.shippingCharges === 0 ? "var(--t-primary-600)" : "var(--t-neutral-900)",
            }}
          >
            {reviewData?.shippingCharges === 0 ? "Free" : fmt(reviewData?.shippingCharges ?? 0)}
          </BodyText>
        </div>
        <Divider />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
            alignItems: "center",
          }}
        >
          <BodyText style={{ fontWeight: 600 }}>Total</BodyText>
          <Price>{fmt(reviewData?.totalPrice ?? 0)}</Price>
        </div>
      </div>
    </div>
  );
}

export default ReviewOrder;
