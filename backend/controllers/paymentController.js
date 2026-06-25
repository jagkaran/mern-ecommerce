const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Order = require("../models/orderModel");
const logger = require("../utils/logger");
const { computeOrderPricing } = require("../utils/pricing");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe PaymentIntent and return the client secret to the frontend.
 *
 * Security: amount is computed server-side from authoritative DB prices via
 * pricing.js, NOT from the client. A body of `{ amount: 1 }` is rejected with
 * 400 — clients cannot choose their own charge amount.
 *
 * @param {import('express').Request}  req - Body: { orderItems: [{ product, quantity }] }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, client_secret }
 */
exports.processPayment = catchAsyncErrors(async (req, res, next) => {
  // Reject legacy { amount } body. Old spec let the client pick a charge
  // amount which combined with no server-side pricing was the easiest free-
  // money bug in the app's history.
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

  let pricing;
  try {
    pricing = await computeOrderPricing(req.body.orderItems);
  } catch (err) {
    return next(err);
  }

  const amountInCents = Math.round(pricing.totalPrice * 100);

  const myPayment = await stripe.paymentIntents.create({
    amount:   amountInCents,
    currency: "usd",
    metadata: { company: "Mern Ecommerce" },
  });

  res.status(200).json({
    success:       true,
    client_secret: myPayment.client_secret,
  });
});

/**
 * Send the Stripe publishable key to the client.
 * The frontend needs this key to initialise the Stripe.js SDK.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 * @returns {Promise<void>} 200 { stripeApiKey }
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
 *    HMAC-SHA256 (stripe.webhooks.constructEvent). Any tampered or
 *    forged payload is rejected with a 401.
 *
 * Supported events:
 *  - payment_intent.succeeded  → marks the matching order as paid
 *  - payment_intent.payment_failed → marks the matching order as failed
 *  - All others are logged and ignored (always returns 200 to Stripe).
 *
 * @param {import('express').Request}  req - Raw body buffer (express.raw middleware)
 * @param {import('express').Response} res
 * @returns {void} Always responds 200 so Stripe does not retry
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
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
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
        logger.error(`Failed to update order for payment intent ${paymentIntent.id}: ${dbErr.message}`);
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
        logger.error(`Failed to update order for failed payment intent ${paymentIntent.id}: ${dbErr.message}`);
      });
      break;
    }

    default:
      logger.info(`Stripe webhook: unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};
