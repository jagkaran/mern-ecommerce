const Product      = require("../models/productModel");
const ErrorHandler  = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures   = require("../utils/apiFeatures");
const cloudinary    = require("cloudinary").v2;
const logger        = require("../utils/logger");

// ─── Create Product — ADMIN ────────────────────────────────────────────────
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images || [];
  }

  let imagesLinks;
  try {
    imagesLinks = await Promise.all(
      images.map((img) =>
        cloudinary.uploader
          .upload(img, { folder: "products" })
          .then((r) => ({ public_id: r.public_id, url: r.secure_url }))
      )
    );
  } catch (uploadError) {
    logger.error(`Cloudinary image upload failed: ${uploadError.message}`);
    return next(new ErrorHandler("Image upload failed. Please try again.", 500));
  }

  req.body.images    = imagesLinks;
  req.body.user      = req.user.id;
  req.body.createdBy = req.user.id;

  const product = await Product.create(req.body);
  logger.info(`Product created: ${product._id} by user ${req.user.id}`);
  res.status(201).json({ success: true, product });
});

// ─── Get Active Categories (distinct categories that have at least 1 product) ─
exports.getActiveCategories = catchAsyncErrors(async (req, res) => {
  const categories = await Product.distinct("category");
  const clean = categories
    .filter((c) => c && c.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
  res.status(200).json({ success: true, categories: clean });
});

// ─── Get All Products (search / filter / pagination) ─────────────────────────
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  const resultPerPage = 8;
  const page = Number(req.query.page) || 1;
  const skip = (page - 1) * resultPerPage;

  // Build base query with search and filter
  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();

  // Get the filter object for counting
  const filterQuery = apiFeature.query.getFilter();

  // Execute count and product query in parallel
  const [products, productCount, filteredCount] = await Promise.all([
    // Use lean() for better performance and select only needed fields
    apiFeature.query
      .select('name price ratings images category stock numOfReviews description')
      .lean()
      .skip(skip)
      .limit(resultPerPage)
      .sort({ createdAt: -1 }),
    // Count total products (for overall stats)
    Product.countDocuments(),
    // Count filtered products (for accurate pagination)
    Product.countDocuments(filterQuery)
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

// ─── Get All Products (Admin — NO pagination, returns every product) ──────────
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
    Product.countDocuments()
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
    try {
      await Promise.all(
        product.images.map((img) => cloudinary.uploader.destroy(img.public_id))
      );
    } catch (destroyError) {
      logger.warn(`Failed to destroy old product images: ${destroyError.message}`);
      // Continue with upload even if destroy fails
    }

    let imagesLinks;
    try {
      imagesLinks = await Promise.all(
        images.map((img) =>
          cloudinary.uploader
            .upload(img, { folder: "products" })
            .then((r) => ({ public_id: r.public_id, url: r.secure_url }))
        )
      );
    } catch (uploadError) {
      logger.error(`Cloudinary image upload failed: ${uploadError.message}`);
      return next(new ErrorHandler("Image upload failed. Please try again.", 500));
    }
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

  try {
    await Promise.all(
      product.images.map((img) => cloudinary.uploader.destroy(img.public_id))
    );
  } catch (destroyError) {
    logger.warn(`Failed to destroy product images: ${destroyError.message}`);
    // Continue with deletion even if destroy fails
  }

  await product.deleteOne();
  logger.info(`Product deleted: ${req.params.id} by user ${req.user.id}`);
  res.status(200).json({ success: true, message: "Product Deleted Successfully" });
});

// ─── Create / Update Product Review ───────────────────────────────────────────
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
    // Update rating and comment — preserve the original createdAt so the
    // review timestamp reflects when it was first written, not last edited.
    existingReview.rating  = Number(rating);
    existingReview.comment = comment;
  } else {
    // New review — stamp createdAt at the moment of submission.
    product.reviews.push({
      user:       req.user.id,
      profileImg: req.user.profilePic.url,
      name:       req.user.name,
      rating:     Number(rating),
      comment,
      createdAt:  new Date(),
    });
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
