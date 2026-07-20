import React, { useEffect } from "react";
import { useToast } from "../../hooks/useToast";
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
import { useCurrency } from "../../utils/currencyContext";
import { Headline, Overline } from "../../design/primitives";

function OrderDetails() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { id } = useParams();
  const { order, error, loading } = useSelector((state) => state.orderDetails);
  const { code, rate } = useCurrency();
  // Derive a safe country code once. order is `{}` until the fetch resolves,
  // so unguarded `order.shippingInfo.country` reads blow up on first render.
  const shippingCountry = order?.shippingInfo?.country || "IN";
  const country = Country.getCountryByCode(shippingCountry);
  const stateObj = State.getStateByCodeAndCountry(order?.shippingInfo?.state, shippingCountry);

  const addresses = [
    order?.shippingInfo?.address,
    order?.shippingInfo?.city,
    stateObj?.name,
    order?.shippingInfo?.zip,
    country?.name,
  ];

  const displayCurrency = order?.currency || code;
  const displayRate = order?.currencyRate || rate;

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    dispatch(getOrderDetails(id));
  }, [dispatch, error, toast, id]);

  return (
    <section style={{ backgroundColor: "var(--t-neutral-50)", paddingBlock: "var(--t-space-3xl)" }}>
      <Seo
        title={`Order ${createOrderNumber(order?._id, shippingCountry)} - Ordinary`}
        description="My Recent Order details - Ordinary"
        path="/order"
      />
      <div
        style={{
          maxWidth: "var(--t-grid-containerMax)",
          marginInline: "auto",
          paddingInline: "var(--t-grid-containerPad)",
        }}
      >
        <Overline style={{ marginBottom: 8 }}>Order</Overline>
        <Headline level="2xl" style={{ marginBottom: 32 }}>
          {createOrderNumber(order?._id, shippingCountry)}
        </Headline>

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: "8rem" }}>
            <Headline level="lg">Loading…</Headline>
          </div>
        ) : order && order.shippingInfo ? (
          <div
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "minmax(0, 1fr)",
            }}
          >
            <ShippingInfoCard
              name={order.user.name}
              phone={order.shippingInfo.phone}
              address={addresses.filter(Boolean).join(", ")}
            />
            <PaymentInfoCard
              status={order.paymentInfo.status}
              amount={order.totalPrice}
              tax={order.taxPrice}
              itemPrice={order.itemPrice}
              shippingPrice={order.shippingPrice}
              discount={order.discount}
              coupon={order.coupon}
              currency={displayCurrency}
              rate={displayRate}
            />
            <OrderStatusCard status={order.orderStatus} deliveredAt={order.deliveredAt} />
            <OrderItemsCard
              orderItems={order.orderItems}
              currency={displayCurrency}
              rate={displayRate}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default OrderDetails;
