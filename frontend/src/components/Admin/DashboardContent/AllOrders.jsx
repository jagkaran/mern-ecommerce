import React from "react";
import { Card, CardBody, BodyText, Headline } from "../../../design/primitives";
import ReceiptIcon from "@mui/icons-material/Receipt";

function AllOrders({ allOrders }) {
  return (
    <Card>
      <CardBody>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <BodyText small style={{ color: "var(--t-neutral-400)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Orders
            </BodyText>
            <Headline level="3xl" style={{ fontSize: "var(--t-fontSize-3xl)" }}>
              {allOrders ?? 0}
            </Headline>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--t-semantic-error)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReceiptIcon />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default AllOrders;
