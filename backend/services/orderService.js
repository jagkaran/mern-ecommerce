const crypto = require("crypto");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const logger = require("../utils/logger");
const { withTransaction } = require("../utils/transaction");
const { computeOrderPricing } = require("../utils/pricing");
const couponService = require("./couponService");
const paymentService = require("./paymentService");
const { mintClaimToken } = require("./claimService");

/**
 * Create an order with full verification:
 * 1. Prefetch products once — used for both eligibility + pricing.
 * 2. Resolve optional coupon (server-side via the engine, never trust client totals).
 * 3. Compute server-side pricing with the engine-backed coupon.
 * 4. Verify Stripe PaymentIntent (exists, succeeded, amount matches, not reused).
 * 5. Persist order + deduct stock + redeem coupon in a single transaction.
 *
 * @param {{ shippingInfo: object, orderItems: array, paymentInfo: object, currency?: string, currencyRate?: number, couponCode?: string }} data
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {Promise<import('../models/orderModel')>}
 */
async function createOrder(
  { shippingInfo, orderItems, paymentInfo, currency = "USD", currencyRate = 1, couponCode },
  userId,
  opts = {}
) {
  const guestEmail = opts.guestEmail ? String(opts.guestEmail).toLowerCase().trim() : null;
  if (!userId && !guestEmail) {
    throw new ErrorHandler("Email is required for guest checkout", 400);
  }

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new ErrorHandler("At least one order item is required", 400);
  }

  // ─── 1. Prefetch products once for everything that follows ───────────
  const productIds = [...new Set(orderItems.map((i) => String(i.product)))];
  const products = await Product.find({ _id: { $in: productIds } })
    .select("name price stock category")
    .lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const validatedItems = [];
  let subtotal = 0;
  let itemCount = 0;
  const categories = new Set();
  const productIdsInCart = new Set();
  for (const item of orderItems) {
    const product = productMap.get(String(item.product));
    if (!product) {
      throw new ErrorHandler(`Product not found: ${item.product}`, 404);
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ErrorHandler(`Invalid quantity for product: ${product.name}`, 400);
    }
    if (product.stock < quantity) {
      throw new ErrorHandler(`Insufficient stock for product: ${product.name}`, 400);
    }
    validatedItems.push({ product, quantity });
    subtotal += product.price * quantity;
    itemCount += quantity;
    if (product.category) categories.add(product.category);
    productIdsInCart.add(product._id.toString());
  }

  // ─── 2. Resolve optional coupon via the engine ──────────────────────
  // eligibility depends on subtotal/itemCount/categories + user first-order
  // state. The engine returns a usable coupon or throws a clear reason.
  let coupon = null;
  if (couponCode) {
    let isFirstOrder = true;
    if (userId) {
      const priorOrderCount = await Order.countDocuments({
        user: userId,
        paidAt: { $exists: true },
      });
      isFirstOrder = priorOrderCount === 0;
    }
    const verdict = await couponService.evaluateForCart(couponCode, {
      subtotal,
      itemCount,
      categories: [...categories],
      productIds: [...productIdsInCart],
      user: userId || null,
      isFirstOrder,
    });
    if (!verdict.valid) {
      throw new ErrorHandler(verdict.reason || "Coupon not valid", 400);
    }
    coupon = verdict.coupon;
  }

  // ─── 3. Pricing — engine delegates the actual math to couponEngine ───
  const pricing = await computeOrderPricing(orderItems, coupon, validatedItems);
  const { itemPrice, taxPrice, shippingPrice, discount, totalPrice } = pricing;

  // ─── 4. Stripe verification ──────────────────────────────────────────
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

  // ─── 5. Transactional order creation + stock deduction + redemption ──
  const result = await withTransaction(async (session) => {
    const newOrder = await Order.create(
      [
        {
          shippingInfo,
          orderItems,
          paymentInfo,
          itemPrice,
          taxPrice,
          shippingPrice,
          discount,
          coupon: pricing.coupon || undefined,
          totalPrice,
          currency,
          currencyRate,
          paidAt: Date.now(),
          ...(userId ? { user: userId } : {}),
        },
      ],
      { session }
    );

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { session, returnDocument: "after", runValidators: true }
      );
    }

    // Atomic coupon redemption — throws ErrorHandler(409) on the sold-out
    // race, which rolls back the order + stock deductions above.
    if (coupon) {
      await couponService.redeemInTransaction({
        code: coupon.code,
        userId: userId || null,
        email: guestEmail || null,
        orderId: newOrder[0]._id,
        discountAmount: discount,
        session,
      });
    }

    const orderDoc = newOrder[0];

    if (!userId) {
      // Guest path — mint the claim token now that _id is known, store its
      // SHA-256 hash on the order, return the raw token ONCE.
      const claimToken = mintClaimToken(orderDoc._id.toString(), guestEmail);
      orderDoc.guestEmail = guestEmail;
      orderDoc.claimTokenHash = crypto.createHash("sha256").update(claimToken).digest("hex");
      await orderDoc.save({ session });
      return { order: orderDoc, claimToken };
    }

    return orderDoc;
  });

  // ─── 6. Refresh the coupon cache so /validate reflects usedCount ─────
  if (coupon) {
    try {
      await couponService.refreshCache();
    } catch (_e) {
      /* non-fatal */
    }
  }

  if (userId) {
    logger.info(
      `Order created: ${result._id} by user ${userId}` + (coupon ? ` (coupon ${coupon.code})` : "")
    );
    return result;
  }
  logger.info(
    `Order created: ${result.order._id} for guest ${guestEmail}` +
      (coupon ? ` (coupon ${coupon.code})` : "")
  );
  return result;
}

module.exports = { createOrder };
