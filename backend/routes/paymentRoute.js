const express = require("express");
const {
  processPayment,
  sendStripeApiKey,
  stripeWebhook,
} = require("../controllers/paymentController");

const router = express.Router();

const { isAuthenticatedUser } = require("../middleware/auth");
const { validatePayment } = require("../middleware/validation");

// Stripe webhook — MUST use express.raw() here, NOT express.json().
// Stripe signs the raw request body bytes. If the body is parsed to JSON
// first (which changes whitespace/ordering), the signature check fails.
// This route is intentionally unauthenticated — Stripe calls it directly.
// Security is provided by the HMAC-SHA256 signature verification inside
// the stripeWebhook controller.
router.route("/payment/webhook").post(
  express.raw({ type: "application/json" }),
  stripeWebhook
);

router.route("/payment/process").post(isAuthenticatedUser, validatePayment, processPayment);

router.route("/getstripeapikey").get(isAuthenticatedUser, sendStripeApiKey);

module.exports = router;
