const express = require("express");
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetails,
  createProductReview,
  getProductReviews,
  deleteProductReview,
  getAdminProducts,
  getActiveCategories,
} = require("../controllers/productController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductReview,
  validateProductId,
  validatePagination,
} = require("../middleware/validation");
const { cache } = require("../middleware/cache");

// Cache invalidation middleware for product modifications
const invalidateProductCache = (req, res, next) => {
  // Invalidate all product-related cache keys
  const cache = require("../middleware/cache");
  const keys = cache.getKeys();
  keys.forEach((key) => {
    if (key.includes("products") || key.includes("product")) {
      cache.del(key);
    }
  });
  next();
};

const router = express.Router();

// Public routes with caching
router.route("/products").get(validatePagination, cache(300), getAllProducts);

// IMPORTANT: /products/categories must be declared BEFORE /product/:id
// otherwise Express would try to match "categories" as an :id param.
router.route("/products/categories").get(cache(600), getActiveCategories);

router
  .route("/admin/products")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);

router
  .route("/admin/product/new")
  .post(
    isAuthenticatedUser,
    authorizeRoles("admin"),
    validateCreateProduct,
    invalidateProductCache,
    createProduct
  );

router
  .route("/admin/product/:id")
  .put(
    isAuthenticatedUser,
    authorizeRoles("admin"),
    validateUpdateProduct,
    invalidateProductCache,
    updateProduct
  )
  .delete(
    isAuthenticatedUser,
    authorizeRoles("admin"),
    validateProductId,
    invalidateProductCache,
    deleteProduct
  );

router.route("/product/:id").get(validateProductId, cache(300), getProductDetails);

router
  .route("/review")
  .put(
    isAuthenticatedUser,
    validateProductReview,
    invalidateProductCache,
    createProductReview
  );

router
  .route("/reviews")
  .get(getProductReviews)
  .delete(
    isAuthenticatedUser,
    invalidateProductCache,
    deleteProductReview
  );

module.exports = router;
