import React from "react";
import { Link } from "react-router-dom";
import { fmtInCurrency } from "../../../utils/fmtInCurrency";
import { Card, CardBody, BodyText, Price } from "../../../design/primitives";

function OrderItemGrid({ id, name, quantity, price, image, currency = "USD", rate = 1 }) {
  const unit = fmtInCurrency(price, currency, rate);
  const subtotal = fmtInCurrency(price * quantity, currency, rate);

  return (
    <Card noBorder style={{ padding: 0 }}>
      <CardBody style={{ padding: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "90px 1fr auto",
            gap: 16,
            alignItems: "center",
          }}
        >
          <Link to={`/product/${id}`} style={{ textDecoration: "none", display: "block" }}>
            <div
              style={{
                width: 90,
                height: 110,
                background: "var(--t-neutral-100)",
                borderRadius: "var(--t-border-radius-base)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {image ? (
                <img
                  src={image}
                  alt={name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: 6,
                  }}
                />
              ) : (
                <BodyText small style={{ color: "var(--t-neutral-400)" }}>
                  No image
                </BodyText>
              )}
            </div>
          </Link>
          <div>
            <BodyText>
              <Link to={`/product/${id}`} style={{ color: "inherit", textDecoration: "underline" }}>
                {name}
              </Link>
            </BodyText>
            <BodyText small style={{ color: "var(--t-neutral-500)" }}>
              Qty: {quantity}
            </BodyText>
          </div>
          <div style={{ textAlign: "right" }}>
            <Price style={{ fontSize: "var(--t-fontSize-base)" }}>{unit}</Price>
            <BodyText small style={{ color: "var(--t-neutral-400)" }}>
              ×{quantity} = <strong>{subtotal}</strong>
            </BodyText>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default OrderItemGrid;
