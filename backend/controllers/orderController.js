const Order   = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler    = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const logger = require("../utils/logger");
const orderService = require("../services/orderService");

/**
 * Create a new order — thin controller adapter.
 * Delegates verification, pricing, and transactional write to orderService.
 */
exports.createOrder = catchAsyncErrors(async (req, res, next) => {
  const { shippingInfo, orderItems, paymentInfo } = req.body;
  try {
    const order = await orderService.createOrder(
      { shippingInfo, orderItems, paymentInfo },
      req.user._id
    );
    res.status(201).json({ success: true, order });
  } catch (err) {
    return next(err);
  }
});

/**
 * Get details of a specific order.
 * Only the order owner or an admin may access.
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
 * Stock is deducted at creation; no re-deduct on status change.
 */
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400));
  }

  order.orderStatus = req.body.orderStatus;
  if (req.body.orderStatus === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, order });
});

/**
 * Delete an order by ID — Admin only.
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
