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
 * 1. Validate orderItems
 * 2. Resolve optional coupon (server-side, never trust client totals)
 * 3. Compute server-side pricing with coupon
 * 4. Verify Stripe PaymentIntent (exists, succeeded, amount matches, not reused)
 * 5. Persist order + deduct stock in a transaction
 *
 * @param {{ shippingInfo: object, orderItems: array, paymentInfo: object, currency?: string, currencyRate?: number, couponCode?: string }} data
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {Promise<import('../models/orderModel')>}
 */
async function createOrder({ shippingInfo, orderItems, paymentInfo, currency = "USD", currencyRate = 1, couponCode }, userId, opts = {}) {
	const guestEmail = opts.guestEmail ? String(opts.guestEmail).toLowerCase().trim() : null;
	if (!userId && !guestEmail) {
		throw new ErrorHandler("Email is required for guest checkout", 400);
	}

	if (!Array.isArray(orderItems) || orderItems.length === 0) {
		throw new ErrorHandler("At least one order item is required", 400);
	}

	// Resolve coupon if provided — invalid codes throw a 400 with a clear
	// message so the UI can show "coupon not found" instead of generic error.
	let coupon = null;
	if (couponCode) {
		try {
			coupon = couponService.lookupCoupon(couponCode);
		} catch (err) {
			throw err;
		}
		if (!coupon) {
			throw new ErrorHandler("Coupon not found", 400);
		}
	}

	// Server-side pricing — never trust client-supplied prices or discounts
	const pricing = await computeOrderPricing(orderItems, coupon);
	const { itemPrice, taxPrice, shippingPrice, discount, totalPrice } = pricing;

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
				{ session, new: true, runValidators: true }
			);
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

	if (userId) {
		logger.info(`Order created: ${result._id} by user ${userId}` + (coupon ? ` (coupon ${coupon.code})` : ""));
		return result;
	}
	logger.info(`Order created: ${result.order._id} for guest ${guestEmail}` + (coupon ? ` (coupon ${coupon.code})` : ""));
	return result;
}

module.exports = { createOrder };