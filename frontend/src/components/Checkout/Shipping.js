import React, { useCallback, useEffect } from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "react-alert";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AddressForm from "./AddressForm";
import PaymentForm from "./PaymentForm";
import ReviewOrder from "./ReviewOrder";
import Seo from "../Seo";
import { useNavigate } from "react-router-dom";
import Success from "./Success";
import { saveShippingInfo } from "../../actions/cartAction";
import axios from "axios";
import {
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { clearErrors, createOrder } from "../../actions/orderAction";
import PaymentIcon from "@mui/icons-material/Payment";
import LoadingButton from "@mui/lab/LoadingButton";
import Copyright from "../Copyright";
import { fmt } from "../../utils/formatCurrency";

function Shipping() {
  const dispatch = useDispatch();
  const alert = useAlert();
  const { shippingInfo, cartItems } = useSelector((state) => state.cart);
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
      if (value === "") return true;
    }
    return false;
  };

  const handleNext = () => {
    if (!isFormEmpty(addFormValues)) {
      const { firstName, lastName, address, city, state, zip, country, phone } =
        addFormValues;
      dispatch(
        saveShippingInfo({
          firstName,
          lastName,
          address,
          city,
          state,
          country,
          zip,
          phone,
        })
      );
      setActiveStep(activeStep + 1);
    } else {
      alert.error("Please fill all fields");
    }

    if (addFormValues.phone.length !== 10) {
      alert.error("Phone Number should be 10 digits Long");
    }
  };

  const handleReviewData = (step) => {
    if (!isFormEmpty(reviewData)) {
      sessionStorage.setItem("orderInfo", JSON.stringify(reviewData));
      setActiveStep(step + 1);
    } else {
      alert.error("Review data is empty");
    }
  };

  // Read orderInfo from sessionStorage fresh each render so the Pay button
  // always shows the value saved when the user clicked Next on step 2.
  const orderInfo = JSON.parse(sessionStorage.getItem("orderInfo"));

  const paymentData = {
    amount: Math.round((orderInfo?.totalPrice ?? 0) * 100),
  };

  const orderData = {
    shippingInfo,
    orderItems: cartItems,
    // Field name MUST match the backend schema: `itemPrice` (no trailing 's')
    itemPrice: orderInfo?.subTotal,
    taxPrice: orderInfo?.tax,
    shippingPrice: orderInfo?.shippingCharges,
    totalPrice: orderInfo?.totalPrice,
  };

  const handlePaymentDataProcessing = async (step, e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const config = { headers: { "Content-Type": "application/json" } };
      const { data } = await axios.post(
        "/api/v1/payment/process",
        paymentData,
        config
      );
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
        alert.error(result.error.message);
        setSubmitLoading(false);
      } else {
        if (result.paymentIntent.status === "succeeded") {
          orderData.paymentInfo = {
            id: result.paymentIntent.id,
            status: result.paymentIntent.status,
          };

          // Await the order creation so Redux state is populated before
          // navigating. Without await the navigate fired before the POST
          // /api/v1/order/new completed, and the subsequent reload wiped
          // all Redux state so the Success page never saw the new order.
          await dispatch(createOrder(orderData));

          sessionStorage.removeItem("orderInfo");
          localStorage.removeItem("shippingInfo");
          localStorage.removeItem("cartItems");

          // Navigate to the success screen — state.newOrder.order now holds
          // the freshly created order. Do NOT call window.location.reload()
          // here: a hard reload destroys Redux state before Success can read it.
          history("/success");
        } else {
          alert.error("There's some issue while processing payment");
          setSubmitLoading(false);
        }
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'An error occurred';
      alert.error(errMsg);
      setSubmitLoading(false);
    }
  };

  const handleBack = () => {
    sessionStorage.removeItem("orderInfo");
    setActiveStep(activeStep - 1);
  };

  const handleChange = (input, e) => {
    e.preventDefault();
    setAddFormValues({ ...addFormValues, [input]: e.target.value });
  };

  const handleReviewDataChange = useCallback((input, value) => {
    setReviewData((prev) => ({ ...prev, [input]: value }));
  }, []);

  const handleStepFunc = (step, e) => {
    if (step === 0) handleNext();
    if (step === 1) handleReviewData(step);
    if (step === 2) handlePaymentDataProcessing(step, e);
  };

  const steps = ["Shipping address", "Review your order", "Payment details"];

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <AddressForm values={addFormValues} handleChange={handleChange} />;
      case 1:
        return (
          <ReviewOrder
            reviewData={reviewData}
            handleReviewDataChange={handleReviewDataChange}
          />
        );
      case 2:
        return <PaymentForm />;
      default:
        throw new Error("Unknown Step");
    }
  };

  useEffect(() => {
    if (cartItems.length === 0) {
      history("/products");
      alert.error("Your cart is empty!🙅");
    }
    if (error) {
      // Ensure we pass a string to the alert component – avoid rendering error objects.
      const errMsg = typeof error === 'string' ? error : (error?.message || 'An error occurred');
      alert.error(errMsg);
      dispatch(clearErrors());
    }
  }, [dispatch, error, alert, history, cartItems]);

  // Derive the pay-button label from sessionStorage (set when user clicks Next
  // on step 2) so it always reflects the confirmed, formatted total.
  const payLabel = orderInfo?.totalPrice
    ? `Pay ${fmt(orderInfo.totalPrice)}`
    : "Pay";

  return (
    <div>
      <Seo
        title="Information - Click.it Store - Checkout"
        description="Add your delivery details to place an order"
        path="/shipping"
      />
      <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
        <Paper
          variant="outlined"
          sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}
        >
          <Typography component="h1" variant="h4" align="center">
            Checkout
          </Typography>
          <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <React.Fragment>
            {activeStep === steps.length ? (
              <Success />
            ) : (
              <React.Fragment>
                {getStepContent(activeStep)}
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  {activeStep !== 0 && (
                    <Button onClick={handleBack} sx={{ mt: 3, ml: 1 }}>
                      Back
                    </Button>
                  )}
                  {activeStep === steps.length - 1 ? (
                    <LoadingButton
                      size="small"
                      onClick={(e) => handleStepFunc(activeStep, e)}
                      endIcon={<PaymentIcon />}
                      loading={submitLoading}
                      loadingPosition="end"
                      variant="contained"
                      sx={{ mt: 3, ml: 1 }}
                    >
                      {payLabel}
                    </LoadingButton>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={(e) => handleStepFunc(activeStep, e)}
                      sx={{ mt: 3, ml: 1 }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </React.Fragment>
            )}
          </React.Fragment>
        </Paper>
      </Container>
      <Copyright />
    </div>
  );
}

export default Shipping;
