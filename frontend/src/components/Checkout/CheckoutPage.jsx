import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import axios from "axios";

import ContactBlock from "./ContactBlock";
import ShippingBlock from "./ShippingBlock";
import ReviewBlock from "./ReviewBlock";
import TrustStrip from "./TrustStrip";
import StickyCta from "./StickyCta";
import PaymentForm from "./PaymentForm";
import { useToast } from "../../hooks/useToast";
import { createOrder, clearErrors } from "../../actions/orderAction";
import { useCurrency } from "../../utils/currencyContext";

/**
 * CheckoutPage — public-or-auth orchestrator that composes the new checkout
 * blocks. Wired end-to-end:
 *
 *  1. Reads cartItems + shippingInfo + coupon from Redux.
 *  2. Computes subtotal/shipping/tax/total locally (mirrors the server's
 *     pricing util — server still re-checks on order placement).
 *  3. On place: POST /payment/process to mint a PaymentIntent, then
 *     stripe.confirmCardPayment to confirm, then POST /order/new with the
 *     resolved paymentInfo.id + paymentInfo.status. Guests pass the
 *     contact email; for guests, also receives a `claimToken` and we
 *     route to /success?token=...
 */
const CART_TAX_RATE  = 0.15;
const FLAT_SHIPPING  = 50;

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const stripe = useStripe();
  const elements = useElements();

  const { user } = useSelector((s) => s.user);
  const { cartItems, shippingInfo, coupon } = useSelector((s) => s.cart || {});
  const checkout = useSelector((s) => s.checkout);
  const newOrder = useSelector((s) => s.newOrder);
  const error = newOrder?.error;

  const [submitting, setSubmitting] = useState(false);

  // Mirror the server's tax + shipping policy so the summary matches
  // what the server actually charges (server is still authoritative).
  const totals = useMemo(() => {
    const subtotal = (cartItems || []).reduce(
      (acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0),
      0
    );
    const shipping = cartItems && cartItems.length ? FLAT_SHIPPING : 0;
    const tax = +(subtotal * CART_TAX_RATE).toFixed(2);
    const total = +(subtotal + shipping + tax).toFixed(2);
    return { subtotal, shipping, tax, total };
  }, [cartItems]);

  const { code, rate } = useCurrency();
  const fmtTotal = (n) => {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: code || "USD" }).format(Number(n) * (rate || 1));
    } catch { return `$${Number(n).toFixed(2)}`; }
  };

  const onPlace = async () => {
    if (!cartItems?.length) {
      toast.error("Your cart is empty");
      return;
    }
    // Authenticated users must have a JWT cookie; Stripe.js + our backend
    // both have means to identify them. For guests, accept the contact
    // email captured in the ContactBlock; fall back to the typed email
    // when the form has not been submitted yet.
    const guestEmail = !user ? checkout?.email || undefined : undefined;

    const orderItemsForPayment = cartItems.map((it) => ({
      product: it.product,
      quantity: it.quantity,
    }));

    setSubmitting(true);
    try {
      // ── 1. Mint PaymentIntent server-side (now optionalAuth — guests too)
      const { data: pay } = await axios.post(
        "/api/v1/payment/process",
        { orderItems: orderItemsForPayment },
        { withCredentials: true }
      );
      const clientSecret = pay?.client_secret;
      if (!clientSecret) throw new Error("PaymentIntent unavailable");

      if (!stripe || !elements) throw new Error("Stripe has not loaded");

      // ── 2. Confirm card payment client-side
      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Card details missing");
      const confirm = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name:  [shippingInfo?.firstName, shippingInfo?.lastName].filter(Boolean).join(" ") || undefined,
            email: user?.email || guestEmail,
            address: shippingInfo ? {
              line1:       shippingInfo.address,
              city:        shippingInfo.city,
              state:       shippingInfo.state,
              postal_code: shippingInfo.zip,
              country:     shippingInfo.country,
            } : undefined,
          },
        },
      });
      if (confirm.error) {
        toast.error(confirm.error.message || "Payment failed");
        setSubmitting(false);
        return;
      }
      if (confirm.paymentIntent?.status !== "succeeded") {
        toast.error("Payment did not complete");
        setSubmitting(false);
        return;
      }

      // ── 3. Persist order with the resolved PaymentIntent id
      const orderData = {
        shippingInfo,
        orderItems: cartItems,
        couponCode: coupon?.code,
        guestEmail,
        paymentInfo: {
          id: confirm.paymentIntent.id,
          status: "succeeded",
        },
      };
      const placed = await dispatch(createOrder(orderData));
      if (placed?.error) {
        toast.error(typeof placed.error === "string" ? placed.error : "Could not place order");
        setSubmitting(false);
        return;
      }
      const tokenQuery = placed?.claimToken
        ? `?token=${encodeURIComponent(placed.claimToken)}`
        : "";
      navigate(`/success${tokenQuery}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Could not place order";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  // Surface CreateOrderFail via toast (mirrors Shipping.js)
  React.useEffect(() => {
    if (error) {
      const errMsg = typeof error === "string" ? error : error?.message || "An error occurred";
      toast.error(errMsg);
      dispatch(clearErrors());
    }
  }, [dispatch, error, toast]);

  // Redirect empty carts back to products, like Shipping.js does
  React.useEffect(() => {
    if (cartItems && cartItems.length === 0) {
      navigate("/products");
    }
  }, [cartItems, navigate]);

  return (
    <main className="co-page" aria-label="Checkout">
      <ContactBlock signedIn={!!user} />
      <ShippingBlock />
      <ReviewBlock
        subtotal={totals.subtotal}
        shipping={totals.shipping}
        tax={totals.tax}
        total={totals.total}
      />
      <PaymentForm />
      <TrustStrip />
      <StickyCta
        totalLabel={fmtTotal(totals.total)}
        submitting={submitting}
        onClick={onPlace}
      />
    </main>
  );
}
