const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const storage = require("../services/storageService");
const logger = require("../utils/logger");
const { recalculateRatings } = require("../utils/aggregationHelpers");

// Whitelist of fields a client is allowed to set when creating or updating a
// product. Anything else (ratings, numOfReviews, reviews, _id, createdBy,
// createdAt, ...) is rejected silently to prevent mass-assignment of fields
// the schema would otherwise happily accept. ratings/numOfReviews/reviews are
// recomputed by the system and must never be writable from the wire.
const WRITABLE_PRODUCT_FIELDS = ["name", "description", "price", "category", "stock", "images"];

function pickProductFields(body) {
  return WRITABLE_PRODUCT_FIELDS.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});
}

exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images || [];
  }
  const imagesLinks = await storage.uploadMany(images, "products");
  // Pick only whitelist fields — never spread req.body into Product.create.
  const fields = pickProductFields(req.body);
  fields.images = imagesLinks;
  fields.user = req.user.id;
  fields.createdBy = req.user.id;
  const product = await Product.create(fields);
  logger.info(`Product created: ${product._id} by user ${req.user.id}`);
  res.status(201).json({ success: true, product });
});

exports.getActiveCategories = catchAsyncErrors(async (req, res) => {
  // Single response: distinct list + per-category counts + global price
  // bounds. Lets the PLP render sidebar badges and dynamic slider range
  // without extra round-trips.
  const [categories, countsAgg, priceAgg] = await Promise.all([
    Product.distinct("category"),
    Product.aggregate([
      { $match: { category: { $exists: true, $ne: "" } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
    ]),
  ]);
  const clean = categories
    .filter((c) => c && c.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
  const categoryCounts = Object.fromEntries(countsAgg.map((c) => [c._id, c.count]));
  const priceRange = priceAgg[0]
    ? { min: Math.floor(priceAgg[0].min), max: Math.ceil(priceAgg[0].max) }
    : { min: 0, max: 5000 };
  res.status(200).json({
    success: true,
    categories: clean,
    categoryCounts,
    priceRange,
  });
});

const SORT_MAP = {
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  "rating-desc": { ratings: -1 },
  "name-asc": { name: 1 },
};

const DEFAULT_PAGE_LIMIT = 50;

exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  const resultPerPage = Math.min(100, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT));
  const page = Number(req.query.page) || 1;
  const skip = (page - 1) * resultPerPage;
  const sortKey = typeof req.query.sort === "string" ? req.query.sort : "newest";
  const sort = SORT_MAP[sortKey] || SORT_MAP.newest;
  const apiFeature = new ApiFeatures(Product.find(), req.query).search().filter();
  const filterQuery = apiFeature.query.getFilter();
  const [products, productCount, filteredCount] = await Promise.all([
    apiFeature.query
      .select("name price ratings images category stock numOfReviews description")
      .lean()
      .skip(skip)
      .limit(resultPerPage)
      .sort(sort),
    Product.countDocuments(),
    Product.countDocuments(filterQuery),
  ]);
  const filteredProductsCount = filteredCount;
  const totalPages = Math.ceil(filteredProductsCount / resultPerPage);
  res.status(200).json({
    success: true,
    productCount,
    filteredProductsCount,
    products,
    resultPerPage,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
});

exports.getAdminProducts = catchAsyncErrors(async (req, res, _next) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || DEFAULT_PAGE_LIMIT);
  const skip = (page - 1) * limit;
  const [products, productCount] = await Promise.all([
    Product.find()
      .select("name price ratings images category stock numOfReviews createdAt")
      .lean()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(),
  ]);
  const totalPages = Math.ceil(productCount / limit);
  res.status(200).json({
    success: true,
    productCount,
    products,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
});

exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).json({ success: true, product });
});

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images || [];
  }
  const fields = pickProductFields(req.body);
  if (images.length > 0) {
    await storage.destroyMany(product.images);
    const imagesLinks = await storage.uploadMany(images, "products");
    fields.images = imagesLinks;
  }
  product = await Product.findByIdAndUpdate(req.params.id, fields, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  logger.info(`Product updated: ${product._id} by user ${req.user.id}`);
  res.status(200).json({ success: true, product });
});

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  await storage.destroyMany(product.images);
  await product.deleteOne();
  logger.info(`Product deleted: ${product._id} by user ${req.user.id}`);
  res.status(200).json({ success: true, message: "Product Deleted Successfully" });
});

exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Verified-purchase gate: only users who actually ordered this product
  // (status anywhere from Processing through Delivered) may review it.
  // Without this, anyone with a login could review anything.
  const hasPurchased = await Order.exists({
    user: req.user._id,
    "orderItems.product": productId,
  });
  if (!hasPurchased) {
    return next(
      new ErrorHandler("Only customers who purchased this product can leave a review.", 403)
    );
  }

  const existingReview = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );
  if (existingReview) {
    existingReview.rating = Number(rating);
    existingReview.comment = comment;
  } else {
    product.reviews.push({
      user: req.user.id,
      profileImg: req.user.profilePic?.url || "",
      name: req.user.name,
      rating: Number(rating),
      comment,
      createdAt: new Date(),
    });
  }
  const { ratings, numOfReviews } = recalculateRatings(product.reviews);
  product.ratings = ratings;
  product.numOfReviews = numOfReviews;
  await product.save({ validateBeforeSave: false });
  res.status(200).json({ success: true });
});

exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).json({ success: true, reviews: product.reviews });
});

exports.deleteProductReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  const targetReview = product.reviews.find(
    (rev) => rev._id.toString() === req.query.id.toString()
  );
  if (!targetReview) {
    return next(new ErrorHandler("Review not found", 404));
  }
  // Ownership / admin gate. Without this any authed user could delete any
  // review just by knowing its mongo _id — classic IDOR.
  const isOwner = targetReview.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return next(new ErrorHandler("You are not authorized to delete this review", 403));
  }
  const reviews = product.reviews.filter((rev) => rev._id.toString() !== req.query.id.toString());
  const { ratings, numOfReviews } = recalculateRatings(reviews);
  await Product.findByIdAndUpdate(
    req.query.productId,
    { reviews, ratings, numOfReviews },
    { new: true, runValidators: true }
  );
  res.status(200).json({ success: true });
});
