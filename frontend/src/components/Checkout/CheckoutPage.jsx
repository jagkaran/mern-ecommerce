import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import ContactBlock from "./ContactBlock";
import ShippingBlock from "./ShippingBlock";
import ReviewBlock from "./ReviewBlock";
import TrustStrip from "./TrustStrip";
import StickyCta from "./StickyCta";
import { useToast } from "../../hooks/useToast";
import { createOrder, clearErrors } from "../../actions/orderAction";

/**
 * CheckoutPage — public-or-auth orchestrator that composes the new checkout
 * blocks (T8) and reuses the existing createOrder thunk + cart shippingInfo.
 *
 * Stripe Elements integration is intentionally deferred here. The auth path
 * (/shipping) keeps the full PaymentForm / Elements flow; this orchestrator
 * handles the guest happy-path form + order placement. T10 will wire the
 * claim action on top of the order id we get back.
 */
export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const { user } = useSelector((s) => s.user);
  const { cartItems, shippingInfo, coupon } = useSelector((s) => s.cart || {});
  const checkout = useSelector((s) => s.checkout);
  const newOrder = useSelector((s) => s.newOrder);
  const error = newOrder?.error;

  const [submitting, setSubmitting] = useState(false);

  const onPlace = async () => {
    if (!cartItems?.length) {
      toast.error("Your cart is empty");
      return;
    }
    // For guests, the email lives in the checkout slice (ContactBlock).
    // For signed-in users, fall back to their account email if blank.
    const guestEmail = !user ? checkout?.email || undefined : undefined;

    const orderData = {
      shippingInfo,
      orderItems: cartItems,
      couponCode: coupon?.code,
      guestEmail,
    };

    setSubmitting(true);
    try {
      const result = await dispatch(createOrder(orderData));
      if (result?.error) {
        const errMsg =
          typeof result.error === "string"
            ? result.error
            : result.error?.message || "Could not place order";
        toast.error(errMsg);
        setSubmitting(false);
        return;
      }
      navigate("/success");
    } catch (err) {
      toast.error(err?.message || "Could not place order");
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
      <ReviewBlock />
      <TrustStrip />
      <StickyCta
        totalLabel=""
        submitting={submitting}
        onClick={onPlace}
      />
    </main>
  );
}
