const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const storage = require("../services/storageService");
const logger = require("../utils/logger");
const { recalculateRatings } = require("../utils/aggregationHelpers");

exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images || [];
  }
  const imagesLinks = await storage.uploadMany(images, "products");
  req.body.images = imagesLinks;
  req.body.user = req.user.id;
  req.body.createdBy = req.user.id;
  const product = await Product.create(req.body);
  logger.info(`Product created: ${product._id} by user ${req.user.id}`);
  res.status(201).json({ success: true, product });
});

exports.getActiveCategories = catchAsyncErrors(async (req, res) => {
  const categories = await Product.distinct("category");
  const clean = categories
    .filter((c) => c && c.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
  res.status(200).json({ success: true, categories: clean });
});

exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  const resultPerPage = 8;
  const page = Number(req.query.page) || 1;
  const skip = (page - 1) * resultPerPage;
  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();
  const filterQuery = apiFeature.query.getFilter();
  const [products, productCount, filteredCount] = await Promise.all([
    apiFeature.query
      .select('name price ratings images category stock numOfReviews description')
      .lean()
      .skip(skip)
      .limit(resultPerPage)
      .sort({ createdAt: -1 }),
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
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const [products, productCount] = await Promise.all([
    Product.find()
      .select('name price ratings images category stock numOfReviews createdAt')
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
  if (images.length > 0) {
    await storage.destroyMany(product.images);
    const imagesLinks = await storage.uploadMany(images, "products");
    req.body.images = imagesLinks;
  }
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
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
  const existingReview = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );
  if (existingReview) {
    existingReview.rating = Number(rating);
    existingReview.comment = comment;
  } else {
    product.reviews.push({
      user: req.user.id,
      profileImg: req.user.profilePic.url,
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
  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );
  const { ratings, numOfReviews } = recalculateRatings(reviews);
  await Product.findByIdAndUpdate(
    req.query.productId,
    { reviews, ratings, numOfReviews },
    { new: true, runValidators: true }
  );
  res.status(200).json({ success: true });
});
