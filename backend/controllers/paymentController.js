const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const logger = require("../utils/logger");
const { computeOrderPricing } = require("../utils/pricing");
const couponService = require("../services/couponService");
const paymentService = require("../services/paymentService");

/**
 * Create a Stripe PaymentIntent and return the client secret to the frontend.
 *
 * Security: amount is computed server-side from authoritative DB prices via
 * pricing.js, NOT from the client. A body of `{ amount: 1 }` is rejected with
 * 400 — clients cannot choose their own charge amount.
 *
 * Optional `couponCode`: when supplied, the server runs the engine's
 * eligibility + reward on the same items so the PaymentIntent amount matches
 * what /order/new will eventually verify. Without it we mint for the
 * undiscounted total — fine for cash-only carts, but coupon users would hit
 * "Payment amount mismatch" at /order/new.
 *
 * @param {import('express').Request}  req - Body: { orderItems: [{ product, quantity }], couponCode?: string }
 */
exports.processPayment = catchAsyncErrors(async (req, res, next) => {
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, "amount")) {
    return next(
      new ErrorHandler(
        "Legacy { amount } requests are no longer accepted. Send { orderItems } instead.",
        400
      )
    );
  }

  if (!Array.isArray(req.body.orderItems) || req.body.orderItems.length === 0) {
    return next(new ErrorHandler("orderItems is required", 400));
  }

  // Pre-compute subtotal + categories + itemCount so the coupon's minSubtotal
  // / minItems / firstOrderOnly / allowedCategories rules can be enforced
  // (mirroring the order service's eligibility check).
  const products = await Product.find({
    _id: { $in: req.body.orderItems.map((i) => i.product) },
  })
    .select("price category")
    .lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  let subtotal = 0;
  let itemCount = 0;
  const categories = new Set();
  for (const item of req.body.orderItems) {
    const product = productMap.get(String(item.product));
    if (!product) {
      return next(new ErrorHandler(`Product not found: ${item.product}`, 404));
    }
    const qty = Number(item.quantity) || 0;
    subtotal += product.price * qty;
    itemCount += qty;
    if (product.category) categories.add(product.category);
  }

  // Resolve the optional coupon server-side (authoritative) — same path the
  // order service uses, so the PaymentIntent amount matches the eventual
  // /order/new verification. Skipped when no coupon is provided.
  let coupon = null;
  let couponDebug = "(none)";
  if (req.body.couponCode) {
    try {
      const verdict = await couponService.evaluateForCart(req.body.couponCode, {
        subtotal,
        itemCount,
        categories: [...categories],
        productIds: req.body.orderItems.map((i) => String(i.product)),
        user: req.user?._id || null,
        isFirstOrder: undefined,
      });
      if (verdict.valid) {
        coupon = verdict.coupon;
        couponDebug = `${verdict.code} valid`;
      } else {
        couponDebug = `${verdict.code} invalid: ${verdict.reason}`;
      }
    } catch (e) {
      couponDebug = `error: ${e.message}`;
    }
  }

  let pricing;
  try {
    pricing = await computeOrderPricing(req.body.orderItems, coupon);
  } catch (err) {
    return next(err);
  }

  const amountInCents = Math.round(pricing.totalPrice * 100);

  logger.info(
    `PaymentIntent mint: amount=${amountInCents} cents, coupon=${couponDebug}, items=${req.body.orderItems.length}`
  );

  const myPayment = await paymentService.createPaymentIntent(amountInCents, {
    metadata: { company: "Mern Ecommerce" },
  });

  res.status(200).json({
    success: true,
    client_secret: myPayment.client_secret,
  });
});

/**
 * Send the Stripe publishable key to the client.
 */
exports.sendStripeApiKey = catchAsyncErrors(async (req, res, _next) => {
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
});

/**
 * Handle incoming Stripe webhook events.
 *
 * Security model:
 *  - This route intentionally bypasses CSRF protection — Stripe calls it
 *    from their servers and cannot supply a browser cookie.
 *  - Instead, every request is authenticated by verifying the
 *    stripe-signature header against the raw request body using
 *    HMAC-SHA256. Any tampered or forged payload is rejected with 401.
 */
exports.stripeWebhook = (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET env var is not set — webhook rejected");
    return res.status(500).json({ success: false, message: "Webhook secret not configured" });
  }

  let event;
  try {
    event = paymentService.verifyWebhookSignature(req.body, sig, webhookSecret);
  } catch (err) {
    logger.warn(`Stripe webhook signature verification failed: ${err.message}`);
    return res.status(401).json({ success: false, message: `Webhook error: ${err.message}` });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      logger.info(`Stripe payment_intent.succeeded: ${paymentIntent.id}`);
      Order.findOneAndUpdate(
        { "paymentInfo.id": paymentIntent.id },
        { "paymentInfo.status": "succeeded", paidAt: new Date() },
        { new: true }
      ).catch((dbErr) => {
        logger.error(
          `Failed to update order for payment intent ${paymentIntent.id}: ${dbErr.message}`
        );
      });
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      logger.warn(`Stripe payment_intent.payment_failed: ${paymentIntent.id}`);
      Order.findOneAndUpdate(
        { "paymentInfo.id": paymentIntent.id },
        { "paymentInfo.status": "failed" },
        { new: true }
      ).catch((dbErr) => {
        logger.error(
          `Failed to update order for failed payment intent ${paymentIntent.id}: ${dbErr.message}`
        );
      });
      break;
    }

    default:
      logger.info(`Stripe webhook: unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};
