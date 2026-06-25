const express = require("express");
const {
  processPayment,
  sendStripeApiKey,
  stripeWebhook,
} = require("../controllers/paymentController");

const router = express.Router();

const { isAuthenticatedUser } = require("../middleware/auth");
const { validatePayment } = require("../middleware/validation");

// Stripe webhook — raw body parser is mounted at app-level in app.js BEFORE
// the global express.json() so req.body is still a Buffer when
// stripeWebhook runs. Stripe signs those bytes; any other body shape fails
// signature verification. This route is intentionally unauthenticated —
// Stripe calls it directly. Security is HMAC-SHA256 signature verification
// inside the stripeWebhook controller.
router.route("/payment/webhook").post(stripeWebhook);

router.route("/payment/process").post(isAuthenticatedUser, validatePayment, processPayment);

router.route("/getstripeapikey").get(isAuthenticatedUser, sendStripeApiKey);

module.exports = router;
