const express = require("express");
const {
  processPayment,
  sendStripeApiKey,
  stripeWebhook,
} = require("../controllers/paymentController");

const router = express.Router();

const { isAuthenticatedUser, optionalAuth } = require("../middleware/auth");
const { validatePayment } = require("../middleware/validation");

// Stripe webhook — raw body parser is mounted at app-level in app.js BEFORE
// the global express.json() so req.body is still a Buffer when
// stripeWebhook runs. Stripe signs those bytes; any other body shape fails
// signature verification. This route is intentionally unauthenticated —
// Stripe calls it directly. Security is HMAC-SHA256 signature verification
// inside the stripeWebhook controller.
router.route("/payment/webhook").post(stripeWebhook);

// /payment/process supports both authenticated users and guest checkout, so
// it uses optionalAuth. The server-side pricing logic is identical for
// both — auth is not required to compute a PaymentIntent amount.
router.route("/payment/process").post(optionalAuth, validatePayment, processPayment);

// The Stripe publishable key is intentionally PUBLIC (it ships in every
// Stripe.js bundle by design, prefix `pk_`). It must be reachable by guests
// on the /checkout route, which loads before login. optionalAuth lets the
// route respond for both authenticated and anonymous callers without 401ing.
router.route("/getstripeapikey").get(optionalAuth, sendStripeApiKey);

module.exports = router;
