const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const logger = require("../utils/logger");
const { withTransaction } = require("../utils/transaction");
const { computeOrderPricing } = require("../utils/pricing");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Service to create an order with full verification.
 * - Verifies Stripe PaymentIntent exists, succeeded, amount matches server pricing.
 * - Checks PaymentIntent not already used.
 * - Computes pricing server‑side.
 * - Deducts stock atomically.
 */
async function createOrder({ shippingInfo, orderItems, paymentInfo }, userId) {
  // Validate presence of orderItems
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new ErrorHandler("At least one order item is required", 400);
  }

  // Compute server‑side pricing
  const pricing = await computeOrderPricing(orderItems);

  // Verify PaymentIntent
  const existing = await Order.findOne({ "paymentInfo.id": paymentInfo.id });
  if (existing) {
    throw new ErrorHandler("PaymentIntent already used for another order", 409);
  }
  let intent;
  try {
    intent = await stripe.paymentIntents.retrieve(paymentInfo.id);
  } catch (e) {
    throw new ErrorHandler("Invalid PaymentIntent ID", 402);
  }
  if (intent.status !== "succeeded") {
    throw new ErrorHandler("Payment not completed", 402);
  }
  const expectedAmount = Math.round(pricing.totalPrice * 100);
  if (intent.amount !== expectedAmount) {
    throw new ErrorHandler("Payment amount mismatch", 400);
  }

  // Create order within a transaction and deduct stock
  const order = await withTransaction(async (session) => {
    const newOrder = await Order.create([
      {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemPrice: pricing.itemPrice,
        taxPrice: pricing.taxPrice,
        shippingPrice: pricing.shippingPrice,
        totalPrice: pricing.totalPrice,
        paidAt: Date.now(),
        user: userId,
      },
    ], { session });

    // Deduct stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { session, new: true, runValidators: true }
      );
    }

    return newOrder[0];
  });

  logger.info(`Order created: ${order._id} by user ${userId}`);
  return order;
}

module.exports = { createOrder };
