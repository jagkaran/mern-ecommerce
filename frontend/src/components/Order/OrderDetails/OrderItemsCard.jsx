import React from "react";
import { Card, CardBody, Headline, BodyText, Divider } from "../../../design/primitives";
import OrderItemGrid from "./OrderItemGrid";

function OrderItemsCard({ orderItems, currency = "USD", rate = 1 }) {
  return (
    <Card>
      <CardBody>
        <Headline level="lg" style={{ marginBottom: 4 }}>
          Order Items
        </Headline>
        <BodyText small style={{ color: "var(--t-neutral-400)", marginBottom: 24 }}>
          List of all Products purchased
        </BodyText>
        <Divider style={{ marginBottom: 16 }} />
        {orderItems &&
          orderItems.map((item, index) => (
            <React.Fragment key={item.product}>
              {index > 0 && <Divider />}
              <OrderItemGrid
                id={item.product}
                name={item.name}
                quantity={item.quantity}
                price={item.price}
                image={item.image}
                currency={currency}
                rate={rate}
              />
            </React.Fragment>
          ))}
      </CardBody>
    </Card>
  );
}

export default OrderItemsCard;
