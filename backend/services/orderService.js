const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const logger = require("../utils/logger");
const { withTransaction } = require("../utils/transaction");
const { computeOrderPricing } = require("../utils/pricing");
const paymentService = require("./paymentService");

/**
 * Create an order with full verification:
 *  1. Validate orderItems
 *  2. Compute server-side pricing
 *  3. Verify Stripe PaymentIntent (exists, succeeded, amount matches, not reused)
 *  4. Persist order + deduct stock in a transaction
 *
 * @param {{ shippingInfo: object, orderItems: array, paymentInfo: object }} data
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {Promise<import('../models/orderModel')>}
 */
async function createOrder({ shippingInfo, orderItems, paymentInfo }, userId) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new ErrorHandler("At least one order item is required", 400);
  }

  // Server-side pricing — never trust client-supplied prices
  const pricing = await computeOrderPricing(orderItems);
  const { itemPrice, taxPrice, shippingPrice, totalPrice } = pricing;

  // Verify PaymentIntent with Stripe
  const existing = await Order.findOne({ "paymentInfo.id": paymentInfo.id });
  if (existing) {
    throw new ErrorHandler("PaymentIntent already used for another order", 409);
  }

  let intent;
  try {
    intent = await paymentService.retrievePaymentIntent(paymentInfo.id);
  } catch (_e) {
    throw new ErrorHandler("Invalid PaymentIntent ID", 402);
  }

  if (intent.status !== "succeeded") {
    throw new ErrorHandler("Payment not completed", 402);
  }

  const expectedAmount = Math.round(totalPrice * 100);
  if (intent.amount !== expectedAmount) {
    throw new ErrorHandler("Payment amount mismatch", 400);
  }

  // Transactional order creation + stock deduction
  const order = await withTransaction(async (session) => {
    const newOrder = await Order.create(
      [{
        shippingInfo,
        orderItems,
        paymentInfo,
        itemPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt: Date.now(),
        user: userId,
      }],
      { session }
    );

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
