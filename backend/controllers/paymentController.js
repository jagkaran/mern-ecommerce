const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Order = require("../models/orderModel");
const logger = require("../utils/logger");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Process Stripe payment intent
exports.processPayment = catchAsyncErrors(async (req, res, _next) => {
  const myPayment = await stripe.paymentIntents.create({
    amount:   req.body.amount,
    currency: "usd",
    metadata: { company: "Mern Ecommerce" },
  });

  res.status(200).json({
    success:       true,
    client_secret: myPayment.client_secret,
  });
});

// Send Stripe publishable key to client
exports.sendStripeApiKey = catchAsyncErrors(async (req, res, _next) => {
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
});

// Stripe webhook — receives events from Stripe after payment is confirmed.
// The raw request body MUST be used for signature verification — do NOT
// parse it as JSON before this handler runs. The route in paymentRoute.js
// uses express.raw({ type: "application/json" }) before the global
// express.json() middleware.
exports.stripeWebhook = (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET env var is not set — webhook rejected");
    return res.status(500).json({ success: false, message: "Webhook secret not configured" });
  }

  let event;
  try {
    // constructEvent verifies the stripe-signature header against the raw
    // body using HMAC-SHA256. Any tampered or forged payload will throw.
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.warn(`Stripe webhook signature verification failed: ${err.message}`);
    return res.status(401).json({ success: false, message: `Webhook error: ${err.message}` });
  }

  // Handle relevant event types
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      logger.info(`Stripe payment_intent.succeeded: ${paymentIntent.id}`);

      // Update the order whose paymentInfo.id matches this payment intent.
      // Fire-and-forget is acceptable here — Stripe will retry if we return
      // a non-2xx, so we return 200 immediately and log any DB error.
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
      // Log unhandled events at debug level — not an error, just not relevant
      logger.info(`Stripe webhook: unhandled event type ${event.type}`);
  }

  // Always return 200 promptly so Stripe does not retry
  res.status(200).json({ received: true });
};
