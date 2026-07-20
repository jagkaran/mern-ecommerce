import React, { useCallback, useEffect, useRef } from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { Headline, PrimaryBtn, Overline, StepIndicator, Surface } from "../../design/primitives";

import AddressForm from "./AddressForm";
import ReviewOrder from "./ReviewOrder";
import PaymentForm from "./PaymentForm";
import { useCurrency } from "../../utils/currencyContext";

import Seo from "../Seo";

import { saveShippingInfo } from "../../actions/cartAction";
import axios from "axios";
import { CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { clearErrors, createOrder } from "../../actions/orderAction";
import { clearCart } from "../../actions/cartAction";

function Shipping() {
  const { fmt, code, rate } = useCurrency();
  const dispatch = useDispatch();
  const placedRef = useRef(false);
  const toast = useToast();
  const { shippingInfo, cartItems, coupon } = useSelector((state) => state.cart);
  const history = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useSelector((state) => state.user);
  const { error } = useSelector((state) => state.newOrder);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [addFormValues, setAddFormValues] = useState({
    firstName: shippingInfo.firstName,
    lastName: shippingInfo.lastName,
    address: shippingInfo.address,
    phone: shippingInfo.phone,
    country: shippingInfo.country,
    state: shippingInfo.state,
    city: shippingInfo.city,
    zip: shippingInfo.zip,
  });

  const [reviewData, setReviewData] = useState({
    subTotal: "",
    shippingCharges: "",
    tax: "",
    totalPrice: "",
  });

  const isFormEmpty = (form) => {
    for (const value of Object.values(form)) {
      if (!value || value === "") return true;
    }
    return false;
  };

  const handleNext = () => {
    if (!isFormEmpty(addFormValues)) {
      const { firstName, lastName, address, city, state, zip, country, phone } = addFormValues;
      dispatch(
        saveShippingInfo({ firstName, lastName, address, city, state, country, zip, phone })
      );
      setActiveStep(activeStep + 1);
    } else {
      toast.error("Please fill all fields");
    }
  };

  // orderInfo lives in component state, not sessionStorage. Stays in-memory only
  // for the duration of the checkout flow; cleared on unmount (page navigation).
  const [orderInfoState, setOrderInfoState] = useState({});

  const handleReviewData = (step) => {
    if (!isFormEmpty(reviewData)) {
      setOrderInfoState(reviewData);
      setActiveStep(step + 1);
    } else {
      toast.error("Review data is empty");
    }
  };

  const paymentData = {
    orderItems: cartItems.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    })),
  };

  const orderData = {
    shippingInfo,
    orderItems: cartItems,
    itemPrice: orderInfoState?.subTotal,
    taxPrice: orderInfoState?.tax,
    shippingPrice: orderInfoState?.shippingCharges,
    totalPrice: orderInfoState?.totalPrice,
    currency: code,
    currencyRate: rate,
    couponCode: coupon?.code, // server re-resolves and re-applies; never trust client discount
  };

  const handlePaymentDataProcessing = async (step, e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const config = { headers: { "Content-Type": "application/json" } };
      const { data } = await axios.post("/api/v1/payment/process", paymentData, config);
      const client_secret = data.client_secret;
      if (!stripe || !elements) return;
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            email: user.email,
            address: {
              line1: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              postal_code: shippingInfo.zip,
              country: shippingInfo.country,
            },
          },
        },
      });
      if (result.error) {
        toast.error(result.error.message);
        setSubmitLoading(false);
      } else {
        if (result.paymentIntent.status === "succeeded") {
          orderData.paymentInfo = {
            id: result.paymentIntent.id,
            status: result.paymentIntent.status,
          };

          // createOrder now returns { order, claimToken, error? }.
          // Authenticated orders have no claimToken — success URL stays clean.
          const placed = await dispatch(createOrder(orderData));
          if (placed?.error) {
            toast.error(typeof placed.error === "string" ? placed.error : "Could not place order");
            setSubmitLoading(false);
            return;
          }

          // Empty the cart — server-side order persisted, no reason to keep the
          // items around in the redux store.
          placedRef.current = true;
          dispatch(clearCart());
          // Clear local in-memory state on success — cart + order details
          setOrderInfoState({});
          const tokenQuery = placed?.claimToken
            ? `?token=${encodeURIComponent(placed.claimToken)}`
            : "";
          history(`/success${tokenQuery}`);
        } else {
          toast.error("There's some issue while processing payment");
          setSubmitLoading(false);
        }
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || "An error occurred";
      toast.error(errMsg);
      setSubmitLoading(false);
    }
  };

  const handleBack = () => {
    setOrderInfoState({});
    setActiveStep(activeStep - 1);
  };

  const handleChange = (input, e) => {
    e?.preventDefault?.();
    setAddFormValues((prev) => ({ ...prev, [input]: e.target.value }));
  };

  const handleReviewDataChange = useCallback((input, value) => {
    setReviewData((prev) => ({ ...prev, [input]: value }));
  }, []);

  const handleStepFunc = (step, e) => {
    if (step === 0) handleNext();
    if (step === 1) handleReviewData(step);
    if (step === 2) handlePaymentDataProcessing(step, e);
  };

  const steps = ["Shipping", "Review", "Payment"];

  useEffect(() => {
    if (cartItems.length === 0 && !placedRef.current) {
      history("/products");
      toast.error("Your cart is empty!");
    }
    if (error) {
      const errMsg = typeof error === "string" ? error : error?.message || "An error occurred";
      toast.error(errMsg);
      dispatch(clearErrors());
    }
  }, [dispatch, error, toast, history, cartItems]);

  useEffect(() => {
    setAddFormValues({
      firstName: "",
      lastName: "",
      address: "",
      phone: "",
      country: "",
      state: "",
      city: "",
      zip: "",
    });
  }, []);

  const payLabel = orderInfoState?.totalPrice ? `Pay ${fmt(orderInfoState.totalPrice)}` : "Pay";

  return (
    <div>
      <Seo title="Checkout" description="Complete your order" path="/shipping" />
      <section
        style={{ backgroundColor: "var(--t-neutral-50)", paddingBlock: "var(--t-space-3xl)" }}
      >
        <div
          style={{
            maxWidth: "var(--t-grid-containerMax)",
            marginInline: "auto",
            paddingInline: "var(--t-grid-containerPad)",
          }}
        >
          <Overline style={{ marginBottom: 8 }}>Checkout</Overline>
          <Headline level="2xl" style={{ marginBottom: 32 }}>
            Place Your Order
          </Headline>

          {/* Soft progress */}
          <Box sx={{ mb: 4, pb: 3, borderBottom: "1px solid var(--t-neutral-200)" }}>
            <StepIndicator steps={steps} current={activeStep} />
          </Box>

          <Surface sx={{ p: { xs: 3, sm: 5 } }} key={activeStep} className="hverdag-fade-through">
            {activeStep === 0 && <AddressForm values={addFormValues} handleChange={handleChange} />}
            {activeStep === 1 && (
              <ReviewOrder
                reviewData={reviewData}
                handleReviewDataChange={handleReviewDataChange}
              />
            )}
            {activeStep === 2 && <PaymentForm />}
          </Surface>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 32,
            }}
          >
            {activeStep !== 0 && (
              <PrimaryBtn variant="text" onClick={handleBack}>
                Back
              </PrimaryBtn>
            )}
            <div />
            {activeStep === steps.length - 1 ? (
              <PrimaryBtn
                type="button"
                onClick={(e) => handleStepFunc(activeStep, e)}
                disabled={submitLoading}
                aria-busy={submitLoading}
              >
                {submitLoading ? "…" : payLabel}
              </PrimaryBtn>
            ) : (
              <PrimaryBtn onClick={() => handleStepFunc(activeStep)}>Next</PrimaryBtn>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Shipping;
