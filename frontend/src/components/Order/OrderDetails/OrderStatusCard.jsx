import React from "react";
import {
  Card,
  CardBody,
  BodyText,
  Divider,
  Overline,
  SeverityPill,
} from "../../../design/primitives";
import { format, parseISO } from "date-fns";

function OrderStatusCard({ status, deliveredAt }) {
  const display = `${status}${deliveredAt ? ` at ${format(parseISO(deliveredAt), "dd.MM.yyyy HH:mm")}` : ""}`;

  return (
    <Card>
      <CardBody>
        <Overline style={{ marginBottom: 4 }}>Order Status</Overline>
        <BodyText small style={{ color: "var(--t-neutral-400)", marginBottom: 16 }}>
          To check if the order has been dispatched
        </BodyText>
        <Divider style={{ marginBottom: 16 }} />
        <BodyText>
          <SeverityPill
            color={
              (status === "Delivered" && "success") ||
              (status === "Processing" && "warning") ||
              (status === "Shipped" && "info") ||
              "error"
            }
          >
            {display}
          </SeverityPill>
        </BodyText>
      </CardBody>
    </Card>
  );
}

export default OrderStatusCard;
