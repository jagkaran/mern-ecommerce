import React, { useState, useMemo, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import axios from "axios";

import { Box, Stack } from "@mui/material";
import { Container, Section, StepIndicator, BodyText } from "../../design/primitives";
import ContactBlock from "./ContactBlock";
import ShippingBlock from "./ShippingBlock";
import ReviewBlock from "./ReviewBlock";
import CouponOffersPanel from "../CouponOffersPanel";
import TrustStrip from "./TrustStrip";
import StickyCta from "./StickyCta";
import PaymentForm from "./PaymentForm";
import { useToast } from "../../hooks/useToast";
import { createOrder, clearErrors } from "../../actions/orderAction";
import { clearCart } from "../../actions/cartAction";
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
const CART_TAX_RATE = 0.15;
const FLAT_SHIPPING = 50;
const STEPS = ["Contact", "Shipping", "Payment"];

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const stripe = useStripe();
  const elements = useElements();

  const placedRef = useRef(false);

  const { user } = useSelector((s) => s.user);
  const { cartItems, coupon } = useSelector((s) => s.cart || {});

  // Re-validate the applied coupon whenever the cart changes on this page.
  // If the user adjusts qty / removes a line and the coupon's minSubtotal
  // (or any other rule) no longer holds, auto-remove it and notify —
  // otherwise the stale discount would slip into /order/new and 400.
  const couponRevalidateRef = useRef(null);
  useEffect(() => {
    if (!coupon) return undefined;
    const itemCount = (cartItems || []).reduce((a, i) => a + Number(i.quantity || 0), 0);
    const subtotal = (cartItems || []).reduce(
      (acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0),
      0
    );
    if (subtotal <= 0) return undefined;
    const controller = new AbortController();
    couponRevalidateRef.current = controller;
    axios
      .post(
        "/api/v1/coupon/validate",
        {
          code: coupon.code,
          itemSubtotal: subtotal,
          itemCount,
          categories: [...new Set((cartItems || []).map((i) => i.category).filter(Boolean))],
          productIds: (cartItems || []).map((i) => i.product).filter(Boolean),
        },
        { signal: controller.signal }
      )
      .then(({ data }) => {
        if (!data.valid) {
          dispatch({ type: "RemoveCoupon" });
          toast.error(data.message || `${coupon.code} no longer applies`);
        }
      })
      .catch(() => {
        /* leave it; order path will catch */
      });
    return () => controller.abort();
  }, [cartItems, coupon, dispatch, toast]);
  const checkout = useSelector((s) => s.checkout);
  const newOrder = useSelector((s) => s.newOrder);
  const error = newOrder?.error;

  // The new checkout writes address fields to `s.checkout` (ShippingBlock →
  // setField). Map them onto the backend's expected shippingInfo keys
  // (`address`, `zip`, `phone`) so the validator on /order/new accepts it.
  const shippingInfo = {
    address: [checkout?.address1, checkout?.address2].filter(Boolean).join(", "),
    city: checkout?.city,
    state: checkout?.state,
    country: checkout?.country,
    zip: checkout?.postal,
    phone: checkout?.phone,
  };

  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  // Tracks when the user has scrolled past the hero so the sticky stepper
  // can rise 56px to fill the gap left by the global Header (which slides
  // off-screen on /checkout past the same threshold).
  const [stepperLifted, setStepperLifted] = useState(false);

  // Refs for scroll-spy. Each ref wraps a Section so the IntersectionObserver
  // can detect which step the user is currently filling.
  const contactRef = useRef(null);
  const shippingRef = useRef(null);
  const paymentRef = useRef(null);

  // Scroll-spy: shrink the "active" band to ~30% of viewport height around
  // the top so a step flips active when its heading crosses the upper third
  // of the screen — feels natural without jitter.
  React.useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the most-visible entry that is intersecting, then map back to
        // its step index. Falls back to the first intersecting when none has
        // a clear ratio.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) {
          const idx = Number(visible[0].target.dataset.step);
          if (!Number.isNaN(idx)) setActiveStep(idx);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    [contactRef, shippingRef, paymentRef].forEach((ref) => {
      if (ref.current) obs.observe(ref.current);
    });
    return () => obs.disconnect();
  }, [contactRef, shippingRef, paymentRef]);

  const goToStep = (idx) => {
    const ref = [contactRef, shippingRef, paymentRef][idx];
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveStep(idx);
  };

  // Slide the stepper up by one header-height once scrolled past the hero
  // so it visually replaces the global Header at the top of the viewport.
  React.useEffect(() => {
    const onScroll = () => setStepperLifted(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mirror the server's tax + shipping policy so the summary matches
  // what the server actually charges (server is still authoritative).
  // Applies the cart coupon the same way the backend engine does: subtract
  // discountAmount from the subtotal, zero shipping for freeShipping coupons,
  // and surface the coupon row so the user sees what they're getting.
  // Mirror the server's backend/utils/pricing.js exactly — same inputs, same
  // formulas — so the PaymentIntent amount we mint matches the server's
  // expected total to the cent. Server computes freeShipping as "discount =
  // shipping, shipping = 0"; we do the same so the totals shown here are the
  // ones the server will actually charge.
  const totals = useMemo(() => {
    const subtotal = (cartItems || []).reduce(
      (acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 0),
      0
    );
    const originalShipping = cartItems && cartItems.length ? FLAT_SHIPPING : 0;
    let shipping = originalShipping;
    let discount = 0;
    let freeShipping = false;
    if (coupon) {
      if (coupon.discountType === "freeShipping") {
        freeShipping = true;
        // Server side: discount += shippingPrice; shippingPrice = 0.
        discount += shipping;
        shipping = 0;
      } else {
        discount += Number(coupon.discountAmount || 0);
      }
    }
    const tax = +(subtotal * CART_TAX_RATE).toFixed(2);
    // Match server: total = max(0, subtotal + shipping + tax - discount).
    const total = +Math.max(0, subtotal + shipping + tax - discount).toFixed(2);
    return { subtotal, shipping, originalShipping, tax, discount, freeShipping, total };
  }, [cartItems, coupon]);

  const { code, rate } = useCurrency();
  const fmtTotal = (n) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code || "USD",
      }).format(Number(n) * (rate || 1));
    } catch {
      return `$${Number(n).toFixed(2)}`;
    }
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
      // Send couponCode so the server applies the same coupon math that
      // /order/new will later verify against. Without it the PaymentIntent
      // is for the undiscounted total and /order/new rejects with
      // "Payment amount mismatch".
      const { data: pay } = await axios.post(
        "/api/v1/payment/process",
        { orderItems: orderItemsForPayment, couponCode: coupon?.code },
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
            name:
              [shippingInfo?.firstName, shippingInfo?.lastName].filter(Boolean).join(" ") ||
              undefined,
            email: user?.email || guestEmail,
            address: shippingInfo
              ? {
                  line1: shippingInfo.address,
                  city: shippingInfo.city,
                  state: shippingInfo.state,
                  postal_code: shippingInfo.zip,
                  country: shippingInfo.country,
                }
              : undefined,
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
      // Snapshot the currency at order time so the receipt / order details
      // / success page can show the same currency the buyer saw in the
      // header, even if they switch the selector after the fact.
      const orderData = {
        shippingInfo,
        orderItems: cartItems,
        couponCode: coupon?.code,
        guestEmail,
        currency: code,
        currencyRate: rate,
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
      // Order persisted server-side — empty the cart so the user doesn't
      // re-order the same items on a fresh visit.
      placedRef.current = true;
      dispatch(clearCart());
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
    if (cartItems && cartItems.length === 0 && !placedRef.current) {
      navigate("/products");
    }
  }, [cartItems, navigate]);

  return (
    <Section
      aria-label="Checkout"
      style={{
        backgroundColor: "var(--t-neutral-50)",
        minHeight: "80vh",
        paddingBlock: "var(--t-space-2xl)",
      }}
    >
      <Container>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Box
            component="h1"
            sx={{
              fontFamily: "var(--t-fontFamily-display)",
              fontSize: "var(--t-fontSize-3xl)",
              fontWeight: 500,
              lineHeight: "var(--t-lineHeight-snug)",
              color: "var(--t-neutral-900)",
              letterSpacing: "var(--t-letterSpacing-tight)",
              m: 0,
            }}
          >
            Checkout
          </Box>
          <BodyText>A quiet moment to review your order, your details, and your payment.</BodyText>
        </Stack>

        {/* Sticky stepper — kept OUT of the heading Stack so its containing
            block is <Container> (the full checkout page). Inside a tight
            Stack, sticky releases after the Stack's bottom edge scrolls past
            the top threshold. */}
        <Box
          sx={{
            position: "sticky",
            top: "calc(var(--t-headerHeight, 56px) + 12px)",
            zIndex: 5,
            backgroundColor: "var(--t-neutral-50)",
            paddingBlock: { xs: 1.5, md: 2 },
            marginInline: { xs: -2, md: -4 },
            paddingInline: { xs: 2, md: 4 },
            borderBottom: "1px solid var(--t-neutral-200)",
            transform: stepperLifted ? "translateY(-56px)" : "translateY(0)",
            transition:
              "transform 200ms cubic-bezier(0, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0, 0, 0.2, 1)",
          }}
        >
          <StepIndicator steps={STEPS} current={activeStep} onSelect={goToStep} />
        </Box>

        <Box className="checkout-grid">
          <Stack spacing={3} sx={{ minWidth: 0 }}>
            <Box
              ref={contactRef}
              data-step={0}
              sx={{ scrollMarginTop: "calc(var(--t-headerHeight, 56px) + 70px)" }}
            >
              <ContactBlock signedIn={!!user} />
            </Box>
            <Box
              ref={shippingRef}
              data-step={1}
              sx={{ scrollMarginTop: "calc(var(--t-headerHeight, 56px) + 70px)" }}
            >
              <ShippingBlock />
            </Box>
            <Box
              ref={paymentRef}
              data-step={2}
              sx={{ scrollMarginTop: "calc(var(--t-headerHeight, 56px) + 70px)" }}
            >
              <PaymentForm />
            </Box>
          </Stack>

          <Stack
            spacing={3}
            sx={{ minWidth: 0, position: { lg: "sticky" }, top: { lg: "var(--t-space-lg)" } }}
          >
            {!coupon && (
              <CouponOffersPanel
                subtotal={totals.subtotal}
                itemCount={(cartItems || []).reduce((a, i) => a + Number(i.quantity || 0), 0)}
                dense
              />
            )}
            <ReviewBlock
              subtotal={totals.subtotal}
              shipping={totals.shipping}
              originalShipping={totals.originalShipping}
              tax={totals.tax}
              discount={totals.discount}
              freeShipping={totals.freeShipping}
              coupon={coupon}
              total={totals.total}
              currency={code}
              rate={rate}
            />
            <TrustStrip />
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <StickyCta
                totalLabel={fmtTotal(totals.total)}
                submitting={submitting}
                onClick={onPlace}
                inline
              />
            </Box>
          </Stack>
        </Box>

        <Box sx={{ display: { xs: "block", md: "none" }, mt: 4 }}>
          <StickyCta
            totalLabel={fmtTotal(totals.total)}
            submitting={submitting}
            onClick={onPlace}
          />
        </Box>
      </Container>
    </Section>
  );
}
