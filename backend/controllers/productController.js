const Product      = require("../models/productModel");
const ErrorHandler  = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures   = require("../utils/apiFeatures");
const cloudinary    = require("cloudinary").v2;
const logger        = require("../utils/logger");

// ─── Create Product — ADMIN ────────────────────────────────────────────────
exports.createProduct = catchAsyncErrors(async (req, res, _next) => {
  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images || [];
  }

  const imagesLinks = await Promise.all(
    images.map((img) =>
      cloudinary.uploader
        .upload(img, { folder: "products" })
        .then((r) => ({ public_id: r.public_id, url: r.secure_url }))
    )
  );

  req.body.images    = imagesLinks;
  req.body.user      = req.user.id;
  req.body.createdBy = req.user.id;

  const product = await Product.create(req.body);
  logger.info(`Product created: ${product._id} by user ${req.user.id}`);
  res.status(201).json({ success: true, product });
});

// ─── Get Active Categories (distinct categories that have at least 1 product) ─
exports.getActiveCategories = catchAsyncErrors(async (req, res) => {
  // distinct returns every unique category string present in the collection.
  // Because we query the live collection this updates automatically whenever
  // an admin adds or removes a product.
  const categories = await Product.distinct("category");

  // Filter out any null / empty strings that may exist in dirty data,
  // then sort alphabetically for a consistent dropdown order.
  const clean = categories
    .filter((c) => c && c.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));

  res.status(200).json({ success: true, categories: clean });
});

// ─── Get All Products (search / filter / pagination) ─────────────────────────
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  const resultPerPage  = 8;
  const productCount   = await Product.countDocuments();
  const apiFeature     = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();

  let products = await apiFeature.query;
  const filteredProductsCount = products.length;

  apiFeature.pagination(resultPerPage);
  products = await apiFeature.query.clone();

  res.status(200).json({
    success: true,
    productCount,
    products,
    resultPerPage,
    filteredProductsCount,
  });
});

// ─── Get All Products (Admin — paginated) ──────────────────────────────────
exports.getAdminProducts = catchAsyncErrors(async (req, res, _next) => {
  const page  = Math.max(1, Number(req.query.page)   || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [products, productCount] = await Promise.all([
    Product.find().skip(skip).limit(limit),
    Product.countDocuments(),
  ]);

  res.status(200).json({ success: true, productCount, page, limit, products });
});

// ─── Get Single Product ──────────────────────────────────────────────────────────
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({ success: true, product });
});

// ─── Update Product — ADMIN ───────────────────────────────────────────────────
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
    await Promise.all(
      product.images.map((img) => cloudinary.uploader.destroy(img.public_id))
    );
    const imagesLinks = await Promise.all(
      images.map((img) =>
        cloudinary.uploader
          .upload(img, { folder: "products" })
          .then((r) => ({ public_id: r.public_id, url: r.secure_url }))
      )
    );
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

// ─── Delete Product — ADMIN ───────────────────────────────────────────────────
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  await Promise.all(
    product.images.map((img) => cloudinary.uploader.destroy(img.public_id))
  );

  await product.deleteOne();
  logger.info(`Product deleted: ${req.params.id} by user ${req.user.id}`);
  res.status(200).json({ success: true, message: "Product Deleted Successfully" });
});

// ─── Create / Update Product Review ───────────────────────────────────────────
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user:       req.user.id,
    profileImg: req.user.profilePic.url,
    name:       req.user.name,
    rating:     Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating  = rating;
        rev.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  const avg = product.reviews.reduce((sum, rev) => sum + rev.rating, 0);
  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });
  res.status(200).json({ success: true });
});

// ─── Get All Reviews for a Product ────────────────────────────────────────────
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({ success: true, reviews: product.reviews });
});

// ─── Delete a Review ──────────────────────────────────────────────────────────────────
exports.deleteProductReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  const avg          = reviews.length === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0);
  const ratings      = reviews.length === 0 ? 0 : avg / reviews.length;
  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    { reviews, ratings, numOfReviews },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true });
});
