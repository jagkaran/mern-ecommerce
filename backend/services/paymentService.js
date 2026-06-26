const logger = require("../utils/logger");

// Lazy stripe singleton — avoids top-level crash when STRIPE_SECRET_KEY is
// absent (e.g. in test or before dotenv loads).
let _stripe = null;
function getStripe() {
  if (!_stripe) {
    _stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

/**
 * Create a PaymentIntent for the given amount (in cents).
 * @param {number} amountInCents
 * @param {object} [opts]
 * @param {string} [opts.currency="usd"]
 * @param {object} [opts.metadata]
 * @returns {Promise<{client_secret: string, id: string}>}
 */
async function createPaymentIntent(amountInCents, opts = {}) {
  return getStripe().paymentIntents.create({
    amount: amountInCents,
    currency: opts.currency || "usd",
    metadata: opts.metadata || {},
  });
}

/**
 * Verify a webhook signature and return the parsed event.
 * @param {Buffer} rawBody
 * @param {string} signature
 * @param {string} secret
 * @returns {object} Stripe event
 */
function verifyWebhookSignature(rawBody, signature, secret) {
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

/**
 * Retrieve a PaymentIntent by ID.
 * @param {string} paymentIntentId
 * @returns {Promise<object>}
 */
async function retrievePaymentIntent(paymentIntentId) {
  return getStripe().paymentIntents.retrieve(paymentIntentId);
}

module.exports = { createPaymentIntent, verifyWebhookSignature, retrievePaymentIntent };
