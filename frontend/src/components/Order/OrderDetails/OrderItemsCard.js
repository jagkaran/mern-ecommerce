import React from "react";
import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import OrderItemGrid from "./OrderItemGrid";

function OrderItemsCard({ orderItems }) {
  return (
    <Card>
      <CardHeader
        subheader="List of all Products purchased"
        title="Order Items"
      />
      <Divider />
      <CardContent>
        {orderItems &&
          orderItems.map((item) => (
            <OrderItemGrid
              key={item.product}
              id={item.product}
              name={item.name}
              image={item.image}
              quantity={item.quantity}
              price={item.price}
            />
          ))}
      </CardContent>
    </Card>
  );
}

export default OrderItemsCard;
