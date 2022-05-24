import { Box, CircularProgress, Container, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { useAlert } from "react-alert";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { clearErrors, getOrderDetails } from "../../actions/orderAction";
import { createOrderNumber } from "./MyOrders";
import ShippingInfoCard from "./OrderDetails/ShippingInfoCard";
import { Country, State } from "country-state-city";
import PaymentInfoCard from "./OrderDetails/PaymentInfoCard";
import OrderStatusCard from "./OrderDetails/OrderStatusCard";
import OrderItemsCard from "./OrderDetails/OrderItemsCard";
import Seo from "../Seo";
import Copyright from "../Copyright";

function OrderDetails() {
  const dispatch = useDispatch();
  const alert = useAlert();
  const { id } = useParams();
  const { order, error, loading } = useSelector((state) => state.orderDetails);
  const country = Country.getCountryByCode(order.shippingInfo?.country);
  const state = State.getStateByCodeAndCountry(
    order.shippingInfo?.state,
    order.shippingInfo?.country
  );

  const addresses = [
    order.shippingInfo?.address,
    order.shippingInfo?.city,
    state?.name,
    order.shippingInfo?.zip,
    country?.name,
  ];

  useEffect(() => {
    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }
    dispatch(getOrderDetails(id));
  }, [dispatch, error, alert, id]);

  return (
    <>
      {loading ? (
        <div className="grid place-items-center h-screen">
          <CircularProgress />
        </div>
      ) : (
        order &&
        order.shippingInfo && (
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              py: 8,
            }}
          >
            <Seo
              title={`My Order ${createOrderNumber(
                order._id,
                order.shippingInfo.country ? order.shippingInfo.country : "IN"
              )} - Click.it store`}
              description="My Recent Order details - Click.it store"
              path="/account"
            />
            <Container maxWidth="lg">
              <Typography sx={{ mb: 3 }} variant="h4">
                Order:{" "}
                {createOrderNumber(
                  order._id,
                  order.shippingInfo.country ? order.shippingInfo.country : "IN"
                )}
              </Typography>
              <ShippingInfoCard
                name={order.user.name}
                phone={order.shippingInfo.phone}
                address={addresses.join(", ")}
              />
              <Box sx={{ pt: 3 }}>
                <PaymentInfoCard
                  status={order.paymentInfo.status}
                  amount={order.totalPrice}
                  tax={order.taxPrice}
                />
              </Box>
              <Box sx={{ pt: 3 }}>
                <OrderStatusCard
                  status={order.orderStatus}
                  deliveredAt={order.deliveredAt}
                />
              </Box>
              <Box sx={{ pt: 3 }}>
                <OrderItemsCard orderItems={order.orderItems} />
              </Box>
            </Container>
          </Box>
        )
      )}
      <Copyright />
    </>
  );
}

export default OrderDetails;
