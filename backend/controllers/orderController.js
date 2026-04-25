const Order   = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Create a new order
exports.createOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  res.status(201).json({ success: true, order });
});

// Get Order details
exports.getOrderDetails = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  res.status(200).json({ success: true, order });
});

// Get orders for logged-in user  (paginated)
exports.getMyOrders = catchAsyncErrors(async (req, res, _next) => {
  const page    = Math.max(1, Number(req.query.page) || 1);
  const limit   = Math.min(50, Number(req.query.limit) || 10);
  const skip    = (page - 1) * limit;

  const [orders, orderCount] = await Promise.all([
    Order.find({ user: req.user._id }).skip(skip).limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.status(200).json({ success: true, orderCount, page, limit, orders });
});

// Get All Orders (Admin — paginated)
exports.getAllOrders = catchAsyncErrors(async (req, res, _next) => {
  const page  = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [orders, orderCount] = await Promise.all([
    Order.find().skip(skip).limit(limit),
    Order.countDocuments(),
  ]);

  const totalAmount = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  res.status(200).json({ success: true, orderCount, totalAmount, page, limit, orders });
});

// Update Order (Admin)
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400));
  }

  // FIX: forEach(async) swallows errors — use for..of so failures propagate
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

  // FIX: null-check — product may have been deleted
  if (!product) return;

  // FIX: underflow guard — stock cannot go below 0
  product.stock = Math.max(0, product.stock - quantity);

  await product.save({ validateBeforeSave: false });
}

// Delete order - Admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  // FIX: .remove() deprecated in Mongoose 6+ → .deleteOne()
  await order.deleteOne();

  res.status(200).json({ success: true, message: "Order deleted successfully" });
});
