const Order   = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler    = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const logger = require("../utils/logger");
const { withTransaction } = require("../utils/transaction");

/**
 * Create a new order for the authenticated user.
 * Validates stock availability for each item, then deducts stock and
 * persists the order atomically inside a MongoDB transaction.
 *
 * @param {import('express').Request}  req - Body: { shippingInfo, orderItems, paymentInfo, itemPrice, taxPrice, shippingPrice, totalPrice }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 201 { success, order }
 * @throws {ErrorHandler} 404 if any ordered product is not found
 * @throws {ErrorHandler} 400 if any product has insufficient stock
 */
exports.createOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo, orderItems, paymentInfo,
    itemPrice, taxPrice, shippingPrice, totalPrice,
  } = req.body;

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      return next(new ErrorHandler(`Product not found: ${item.product}`, 404));
    }
    if (product.stock < item.quantity) {
      return next(new ErrorHandler(`Insufficient stock for product: ${product.name}`, 400));
    }
  }

  const order = await withTransaction(async (session) => {
    const newOrder = await Order.create(
      [{
        shippingInfo, orderItems, paymentInfo,
        itemPrice, taxPrice, shippingPrice, totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
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

  logger.info(`Order created: ${order._id} by user ${req.user._id}`);
  res.status(201).json({ success: true, order });
});

/**
 * Get details of a specific order.
 * Only the order owner or an admin may access.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, order }
 * @throws {ErrorHandler} 404 if order not found
 * @throws {ErrorHandler} 403 if requester is neither owner nor admin
 */
exports.getOrderDetails = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return next(new ErrorHandler("You are not authorized to view this order", 403));
  }

  res.status(200).json({ success: true, order });
});

/**
 * Get all orders belonging to the authenticated user, paginated.
 *
 * @param {import('express').Request}  req - Query: { page, limit }
 * @param {import('express').Response} res
 * @returns {Promise<void>} 200 { success, orderCount, page, limit, totalPages, hasNextPage, hasPrevPage, orders }
 */
exports.getMyOrders = catchAsyncErrors(async (req, res, _next) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [orders, orderCount] = await Promise.all([
    Order.find({ user: req.user._id })
      .select('shippingInfo orderItems paymentInfo itemPrice taxPrice shippingPrice totalPrice orderStatus paidAt deliveredAt createdAt')
      .lean()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);

  const totalPages = Math.ceil(orderCount / limit);

  res.status(200).json({
    success: true,
    orderCount,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    orders,
  });
});

/**
 * Get all orders — Admin only, paginated.
 * Also returns the total revenue across ALL orders (not just the current page).
 *
 * @param {import('express').Request}  req - Query: { page, limit }
 * @param {import('express').Response} res
 * @returns {Promise<void>} 200 { success, orderCount, totalAmount, orders, page, limit, totalPages, hasNextPage, hasPrevPage }
 */
exports.getAllOrders = catchAsyncErrors(async (req, res, _next) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [orders, orderCount, aggResult] = await Promise.all([
    Order.find()
      .select('shippingInfo orderItems paymentInfo itemPrice taxPrice shippingPrice totalPrice orderStatus paidAt deliveredAt createdAt user')
      .lean()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
  ]);

  const totalAmount = aggResult.length > 0 ? aggResult[0].total : 0;
  const totalPages = Math.ceil(orderCount / limit);

  res.status(200).json({
    success: true,
    orderCount,
    totalAmount,
    orders,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
});

/**
 * Update an order's status — Admin only.
 * Deducts stock when status changes to "Shipped".
 * Sets deliveredAt timestamp when status is "Delivered".
 *
 * @param {import('express').Request}  req - Params: { id }; Body: { orderStatus }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, order }
 * @throws {ErrorHandler} 404 if order not found
 * @throws {ErrorHandler} 400 if order is already delivered
 */
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400));
  }

  if (req.body.orderStatus === "Shipped") {
    for (const item of order.orderItems) {
      await updateStock(item.product, item.quantity);
    }
  }

  order.orderStatus = req.body.orderStatus;
  if (req.body.orderStatus === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, order });
});

/**
 * Atomically decrement stock for a product by the given quantity.
 * Rolls back the decrement if it would result in negative stock.
 *
 * @param {string|import('mongoose').Types.ObjectId} id       - Product ID
 * @param {number}                                   quantity - Units to deduct
 * @returns {Promise<void>}
 * @throws {ErrorHandler} 400 if deduction would produce negative stock
 */
async function updateStock(id, quantity) {
  const result = await Product.findByIdAndUpdate(
    id,
    { $inc: { stock: -quantity } },
    { new: true, runValidators: true }
  );

  if (!result) {
    logger.warn(`Product not found during stock update: ${id}`);
    return;
  }

  if (result.stock < 0) {
    logger.error(`Stock underflow for product ${id}. Current stock: ${result.stock}`);
    await Product.findByIdAndUpdate(id, { $inc: { stock: quantity } });
    throw new ErrorHandler("Insufficient stock for this product", 400);
  }
}

/**
 * Delete an order by ID — Admin only.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, message }
 * @throws {ErrorHandler} 404 if order not found
 */
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  await order.deleteOne();
  logger.info(`Order deleted: ${req.params.id} by user ${req.user._id}`);
  res.status(200).json({ success: true, message: "Order deleted successfully" });
});
