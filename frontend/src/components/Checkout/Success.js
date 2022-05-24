import {
  Avatar,
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "@mui/material/Link";
import CheckIcon from "@mui/icons-material/Check";
import { createOrderNumber } from "../Order/MyOrders";
import { myOrders } from "../../actions/orderAction";
import Seo from "../Seo";
import Copyright from "../Copyright";

function Success() {
  const dispatch = useDispatch();
  const { orders } = useSelector((state) => state.myOrders);

  const recentOrder = (orders) => {
    return orders[orders.length - 1];
  };

  useEffect(() => {
    dispatch(myOrders());
  }, [dispatch]);
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
              <Link
                href={
                  recentOrder(orders) && `/order/${recentOrder(orders)._id}`
                }
              >
                {` ${
                  recentOrder(orders) === undefined
                    ? " "
                    : createOrderNumber(
                        recentOrder(orders)._id,
                        recentOrder(orders).shippingInfo.country
                          ? recentOrder(orders).shippingInfo.country
                          : "IN"
                      )
                }. `}
              </Link>
              We have emailed your order confirmation, and will send you an
              update when your order has shipped.
              <Seo
                title={`Order Confirmation - ${
                  recentOrder(orders) === undefined
                    ? " "
                    : createOrderNumber(
                        recentOrder(orders)._id,
                        recentOrder(orders).shippingInfo.country
                          ? recentOrder(orders).shippingInfo.country
                          : "IN"
                      )
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
