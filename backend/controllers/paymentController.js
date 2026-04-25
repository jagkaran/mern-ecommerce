const catchAsyncErrors = require("../middleware/catchAsyncErrors");

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
