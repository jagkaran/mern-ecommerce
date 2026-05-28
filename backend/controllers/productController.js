const Product      = require("../models/productModel");
const ErrorHandler  = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures   = require("../utils/apiFeatures");
const cloudinary    = require("cloudinary").v2;
const logger        = require("../utils/logger");

/**
 * Create a new product (Admin only).
 * Uploads all provided images to Cloudinary before persisting.
 *
 * @param {import('express').Request}  req - Body: { name, description, price, category, stock, images[] }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 201 { success, product }
 * @throws {ErrorHandler} 500 if Cloudinary upload fails
 */
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

/**
 * Get distinct active categories (categories with at least one product).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @returns {Promise<void>} 200 { success, categories: string[] }
 */
exports.getActiveCategories = catchAsyncErrors(async (req, res) => {
  const categories = await Product.distinct("category");
  const clean = categories
    .filter((c) => c && c.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
  res.status(200).json({ success: true, categories: clean });
});

/**
 * Get all products with search, filter, and pagination support.
 *
 * @param {import('express').Request}  req - Query: { keyword, page, category, price[gte], price[lte], ratings[gte] }
 * @param {import('express').Response} res
 * @returns {Promise<void>} 200 { success, productCount, filteredProductsCount, products, resultPerPage, page, totalPages, hasNextPage, hasPrevPage }
 */
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

/**
 * Get all products for admin panel (paginated, no search filter).
 *
 * @param {import('express').Request}  req - Query: { page, limit }
 * @param {import('express').Response} res
 * @returns {Promise<void>} 200 { success, productCount, products, page, limit, totalPages, hasNextPage, hasPrevPage }
 */
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

/**
 * Get a single product by ID.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, product }
 * @throws {ErrorHandler} 404 if product not found
 */
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({ success: true, product });
});

/**
 * Update a product by ID (Admin only).
 * Re-uploads images to Cloudinary if new ones are provided.
 *
 * @param {import('express').Request}  req - Params: { id }; Body: product fields
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, product }
 * @throws {ErrorHandler} 404 if product not found
 * @throws {ErrorHandler} 500 if image upload fails
 */
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

/**
 * Delete a product by ID (Admin only).
 * Destroys associated Cloudinary images before removing the DB document.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, message }
 * @throws {ErrorHandler} 404 if product not found
 */
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
  }

  await product.deleteOne();
  logger.info(`Product deleted: ${req.params.id} by user ${req.user.id}`);
  res.status(200).json({ success: true, message: "Product Deleted Successfully" });
});

/**
 * Create or update the authenticated user's review for a product.
 * If a review from this user already exists it is updated in-place;
 * otherwise a new review is appended and numOfReviews incremented.
 * The average rating is recalculated on every save.
 *
 * @param {import('express').Request}  req - Body: { rating, comment, productId }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success: true }
 * @throws {ErrorHandler} 404 if product not found
 */
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
    existingReview.rating  = Number(rating);
    existingReview.comment = comment;
  } else {
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

/**
 * Get all reviews for a specific product.
 *
 * @param {import('express').Request}  req - Query: { id } — product ID
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, reviews }
 * @throws {ErrorHandler} 404 if product not found
 */
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({ success: true, reviews: product.reviews });
});

/**
 * Delete a single review from a product (by review ID).
 * Recalculates the product's average rating after removal.
 *
 * @param {import('express').Request}  req - Query: { id: reviewId, productId }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success: true }
 * @throws {ErrorHandler} 404 if product not found
 */
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
