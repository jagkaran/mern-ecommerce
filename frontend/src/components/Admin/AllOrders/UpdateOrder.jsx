import { Box, CircularProgress, Container, CssBaseline, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useToast } from "../../../hooks/useToast";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useCurrency } from "../../../utils/currencyContext";
import { Country, State } from "country-state-city";
import ShippingInfoCard from "../../Order/OrderDetails/ShippingInfoCard";
import PaymentInfoCard from "../../Order/OrderDetails/PaymentInfoCard";
import OrderItemsCard from "../../Order/OrderDetails/OrderItemsCard";
import { clearErrors, getOrderDetails, updateOrder } from "../../../actions/orderAction";
import { createOrderNumber } from "../../Order/MyOrders";
import AdminOrderStatusCard from "./AdminOrderStatusCard";
import Seo from "../../Seo";

function UpdateOrder() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { id } = useParams();
  const { order, error, loading } = useSelector((state) => state.orderDetails);
  const { code: selectedCurrency, rate: selectedRate } = useCurrency();
  // Use the order's stored currency/rate when available (the order was
  // placed at a specific FX snapshot) so the breakdown prints in the same
  // currency the buyer was charged in. Fall back to the current header
  // selection for orders placed in USD / no rate snapshot.
  const orderCurrency = order?.currency || selectedCurrency;
  const orderRate = order?.currencyRate || selectedRate;
  const { error: updateError, isUpdated } = useSelector((state) => state.modifiedOrder);
  const country = Country.getCountryByCode(order.shippingInfo?.country);
  const state = State.getStateByCodeAndCountry(
    order.shippingInfo?.state,
    order.shippingInfo?.country
  );
  const [orderStatus, setOrderStatus] = useState("");

  const addresses = [
    order.shippingInfo?.address,
    order.shippingInfo?.city,
    state?.name,
    order.shippingInfo?.zip,
    country?.name,
  ];

  const updateOrderSubmitHandler = (e) => {
    e.preventDefault();

    const myForm = new FormData();

    myForm.set("orderStatus", orderStatus);

    dispatch(updateOrder(id, myForm));
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (updateError) {
      toast.error(updateError);
      dispatch(clearErrors());
    }
    if (isUpdated) {
      toast.success("Order Updated Successfully");
      dispatch({ type: "UpdateOrderReset" });
    }
    dispatch(getOrderDetails(id));
  }, [dispatch, error, toast, id, isUpdated, updateError]);

  return (
    <div style={{ padding: "24px 16px" }}>
      <Seo
        title={`Update Order ${
          order ? createOrderNumber(order._id, order.shippingInfo?.country || "IN") : ""
        } - Click.it store - Admin access only`}
        description="Dashboard to manage created orders on Click.it store"
        path="/admin/users"
      />
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: "48px" }}>
            <CircularProgress />
          </Box>
        ) : (
          order &&
          order.shippingInfo && (
            <>
              <Typography sx={{ marginBottom: "16px" }} variant="h4">
                Order:{" "}
                {createOrderNumber(
                  order._id,
                  order.shippingInfo.country ? order.shippingInfo.country : "IN"
                )}
              </Typography>
              <Box sx={{ marginBottom: "16px" }}>
                <ShippingInfoCard
                  name={order.user?.name}
                  phone={order.shippingInfo?.phone}
                  address={addresses.join(", ")}
                />
              </Box>
              <Box sx={{ marginBottom: "16px" }}>
                <PaymentInfoCard
                  status={order.paymentInfo.status}
                  amount={order.totalPrice}
                  tax={order.taxPrice}
                  itemPrice={order.itemPrice}
                  shippingPrice={order.shippingPrice}
                  discount={order.discount}
                  coupon={order.coupon}
                  currency={orderCurrency}
                  rate={orderRate}
                />
              </Box>
              <Box sx={{ marginBottom: "16px" }}>
                <AdminOrderStatusCard
                  updateOrderSubmitHandler={updateOrderSubmitHandler}
                  setOrderStatus={setOrderStatus}
                  status={order.orderStatus}
                  orderStatus={orderStatus}
                  loading={loading}
                  deliveredAt={order.deliveredAt}
                />
              </Box>
              <Box>
                <OrderItemsCard orderItems={order.orderItems} />
              </Box>
            </>
          )
        )}
      </div>
    </div>
  );
}

export default UpdateOrder;
