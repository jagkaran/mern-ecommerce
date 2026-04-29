const Order   = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler    = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const logger = require("../utils/logger");

// Create a new order
exports.createOrder = catchAsyncErrors(async (req, res, _next) => {
  const {
    shippingInfo, orderItems, paymentInfo,
    itemPrice, taxPrice, shippingPrice, totalPrice,
  } = req.body;

  const order = await Order.create({
    shippingInfo, orderItems, paymentInfo,
    itemPrice, taxPrice, shippingPrice, totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  logger.info(`Order created: ${order._id} by user ${req.user._id}`);
  res.status(201).json({ success: true, order });
});

// Get single order details — owner or admin only
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

// Get orders for logged-in user (paginated)
exports.getMyOrders = catchAsyncErrors(async (req, res, _next) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const skip  = (page - 1) * limit;

  const [orders, orderCount] = await Promise.all([
    Order.find({ user: req.user._id }).skip(skip).limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.status(200).json({ success: true, orderCount, page, limit, orders });
});

// Get all orders — Admin (NO pagination: admins need to see every order)
exports.getAllOrders = catchAsyncErrors(async (req, res, _next) => {
  // Return every order sorted newest-first so new orders always appear at the top.
  // totalAmount is computed in the DB aggregation so it reflects ALL orders,
  // not just whatever subset might be on a page.
  const [orders, orderCount, aggResult] = await Promise.all([
    Order.find().sort({ createdAt: -1 }),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
  ]);

  const totalAmount = aggResult.length > 0 ? aggResult[0].total : 0;

  res.status(200).json({ success: true, orderCount, totalAmount, orders });
});

// Update order status — Admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400));
  }

  // Use for..of so async errors propagate (forEach swallows them)
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

async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  if (!product) return; // product may have been deleted
  product.stock = Math.max(0, product.stock - quantity); // underflow guard
  await product.save({ validateBeforeSave: false });
}

// Delete order — Admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  await order.deleteOne();
  logger.info(`Order deleted: ${req.params.id} by user ${req.user._id}`);
  res.status(200).json({ success: true, message: "Order deleted successfully" });
});
