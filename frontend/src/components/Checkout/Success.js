import {
  Avatar,
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";
import Link from "@mui/material/Link";
import CheckIcon from "@mui/icons-material/Check";
import { createOrderNumber } from "../Order/MyOrders";
import Seo from "../Seo";
import Copyright from "../Copyright";

function Success() {
  // Read the order that was just created — this is populated by createOrder
  // before Shipping.js navigates here, so it always reflects the new order.
  // Previously this page fetched ALL orders and picked the last one, which
  // caused a race: the new order often hadn't arrived yet so it showed the
  // previous order instead.
  const { order } = useSelector((state) => state.newOrder);

  const orderId = order?._id;
  const orderCountry = order?.shippingInfo?.country || "IN";

  return (
    <React.Fragment>
      <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
        <Paper
          variant="outlined"
          sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
            <Avatar sx={{ m: 2, bgcolor: "secondary.main" }}>
              <CheckIcon />
            </Avatar>
          </Box>
          <Typography variant="h5" gutterBottom>
            Thank you for your order.
          </Typography>
          <Typography component="div" variant="subtitle1">
            <Box sx={{ alignItems: "baseline" }}>
              Your order number is
              <Link href={orderId ? `/order/${orderId}` : undefined}>
                {` ${
                  orderId
                    ? createOrderNumber(orderId, orderCountry)
                    : "loading…"
                }. `}
              </Link>
              We have emailed your order confirmation, and will send you an
              update when your order has shipped.
              <Seo
                title={`Order Confirmation - ${
                  orderId ? createOrderNumber(orderId, orderCountry) : ""
                } - Click.it Store`}
                description="Congratulations!!! You have successfully created an order."
                path="/success"
              />
            </Box>
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button variant="outlined" href="/myorders" sx={{ mt: 3, ml: 1 }}>
              View Orders
            </Button>
          </Box>
        </Paper>
      </Container>
      <Copyright />
    </React.Fragment>
  );
}

export default Success;
