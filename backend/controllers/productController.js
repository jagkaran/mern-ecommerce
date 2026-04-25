const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const cloudinary = require("cloudinary").v2;

// Create Product -- ADMIN access only
exports.createProduct = catchAsyncErrors(async (req, res, _next) => {
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  const imagesLinks = await Promise.all(
    images.map((img) =>
      cloudinary.uploader
        .upload(img, { folder: "products" })
        .then((r) => ({ public_id: r.public_id, url: r.secure_url }))
    )
  );

  req.body.images = imagesLinks;
  req.body.user = req.user.id;
  req.body.createdBy = req.user.id;

  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

// Get all Products
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  const resultPerPage = 8;
  const productCount = await Product.countDocuments();
  const apiFeature = new ApiFeatures(Product.find(), req.query)
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

// Get All Product (Admin)
exports.getAdminProducts = catchAsyncErrors(async (req, res, _next) => {
  const products = await Product.find();
  res.status(200).json({ success: true, products });
});

// Update Product --- Admin access only
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) {
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

  res.status(200).json({ success: true, product });
});

// Delete a Product -- ADMIN ACCESS ONLY
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  await Promise.all(
    product.images.map((img) => cloudinary.uploader.destroy(img.public_id))
  );

  await product.deleteOne();

  res.status(200).json({ success: true, message: "Product Deleted Successfully" });
});

// Get Product details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({ success: true, product });
});

// Create / Update Product Review
exports.createProductReview = catchAsyncErrors(async (req, res, _next) => {
  const { rating, comment, productId } = req.body;
  const review = {
    user:       req.user.id,
    profileImg: req.user.profilePic.url,
    name:       req.user.name,
    rating:     Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

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

  let avg = 0;
  product.reviews.forEach((rev) => { avg += rev.rating; });
  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });
  res.status(200).json({ success: true });
});

// Get All Product Reviews
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({ success: true, reviews: product.reviews });
});

// Delete a product review
exports.deleteProductReview = catchAsyncErrors(async (req, res, _next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;
  reviews.forEach((rev) => { avg += rev.rating; });

  const ratings     = reviews.length === 0 ? 0 : avg / reviews.length;
  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    { reviews, ratings, numOfReviews },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true });
});
