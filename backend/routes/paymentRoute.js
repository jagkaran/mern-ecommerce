const express = require("express");
const {
  processPayment,
  sendStripeApiKey,
} = require("../controllers/paymentController");

const router = express.Router();

const { isAuthenticatedUser } = require("../middleware/auth");
const { validatePayment } = require("../middleware/validation");

router.route("/payment/process").post(isAuthenticatedUser, validatePayment, processPayment);

router.route("/getstripeapikey").get(isAuthenticatedUser, sendStripeApiKey);

module.exports = router;
