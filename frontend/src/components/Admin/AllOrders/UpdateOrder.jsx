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
import DashboardAppBar from "../Sidebar/DashboardAppBar";
import DashboardDrawer from "../Sidebar/DashboardDrawer";
import { useTheme } from "@mui/material/styles";
import Seo from "../../Seo";

function UpdateOrder() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };
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
    <>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
        <DashboardDrawer open={open} handleDrawerClose={handleDrawerClose} theme={theme} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: 2,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={3}>
              <Grid item xs={12}>
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
                        title={`Update Order ${createOrderNumber(
                          order._id,
                          order.shippingInfo.country ? order.shippingInfo.country : "IN"
                        )} - Click.it store - Admin access only`}
                        description="Dashboard to manage created orders on Click.it store"
                        path="/admin/users"
                      />
                      <Typography sx={{ mb: 3 }} variant="h4">
                        Order:{" "}
                        {createOrderNumber(
                          order._id,
                          order.shippingInfo.country ? order.shippingInfo.country : "IN"
                        )}
                      </Typography>
                      <ShippingInfoCard
                        name={order.user?.name}
                        phone={order.shippingInfo?.phone}
                        address={addresses.join(", ")}
                      />
                      <Box sx={{ pt: 3 }}>
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
                      <Box sx={{ pt: 3 }}>
                        <AdminOrderStatusCard
                          updateOrderSubmitHandler={updateOrderSubmitHandler}
                          setOrderStatus={setOrderStatus}
                          status={order.orderStatus}
                          orderStatus={orderStatus}
                          loading={loading}
                          deliveredAt={order.deliveredAt}
                        />
                      </Box>
                      <Box sx={{ pt: 3 }}>
                        <OrderItemsCard orderItems={order.orderItems} />
                      </Box>
                    </Box>
                  )
                )}
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </>
  );
}

export default UpdateOrder;
