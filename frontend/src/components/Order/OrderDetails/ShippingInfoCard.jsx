import React from "react";
import { Card, CardBody, Overline, BodyText, Divider } from "../../../design/primitives";

function ShippingInfoCard({ name, phone, address }) {
  return (
    <Card>
      <CardBody>
        <Overline style={{ marginBottom: 4 }}>Shipping Info</Overline>
        <BodyText small style={{ color: "var(--t-neutral-400)", marginBottom: 16 }}>
          Actual address for delivering items
        </BodyText>
        <Divider style={{ marginBottom: 16 }} />
        <div style={{ display: "grid", gap: 4 }}>
          <BodyText>
            <span style={{ color: "var(--t-neutral-500)" }}>Name:</span>{" "}
            <span style={{ fontWeight: 500 }}>{name}</span>
          </BodyText>
          <BodyText>
            <span style={{ color: "var(--t-neutral-500)" }}>Phone:</span> {phone}
          </BodyText>
          <BodyText>
            <span style={{ color: "var(--t-neutral-500)" }}>Address:</span> {address}
          </BodyText>
        </div>
      </CardBody>
    </Card>
  );
}

export default ShippingInfoCard;
