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
const { cache, invalidatePattern } = require("../middleware/cache");

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
    invalidatePattern("products"),
    createProduct
  );

router
  .route("/admin/product/:id")
  .put(
    isAuthenticatedUser,
    authorizeRoles("admin"),
    validateUpdateProduct,
    invalidatePattern("products"),
    updateProduct
  )
  .delete(
    isAuthenticatedUser,
    authorizeRoles("admin"),
    validateProductId,
    invalidatePattern("products"),
    deleteProduct
  );

router.route("/product/:id").get(validateProductId, cache(300), getProductDetails);

router
  .route("/review")
  .put(
    isAuthenticatedUser,
    validateProductReview,
    invalidatePattern("products"),
    createProductReview
  );

router
  .route("/reviews")
  .get(getProductReviews)
  .delete(
    isAuthenticatedUser,
    invalidatePattern("products"),
    deleteProductReview
  );

module.exports = router;
