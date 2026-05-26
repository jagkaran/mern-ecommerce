const express = require("express");
const router = express.Router();
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
const { cache, invalidateCache } = require("../middleware/cache");
const { validateProductImages } = require("../middleware/validateImageUpload");

// Invalidate all product-related cache entries after any mutation.
// Delegates to the tested helper in cache.js — do NOT re-require or
// re-implement cache here (caused the getKeys TypeError in production).
const invalidateProductCache = invalidateCache("product");

// ─── Public routes ─────────────────────────────────────────────────────────
router.get("/products/categories", cache("product-categories", 3600), getActiveCategories);
router.get("/products", cache("product", 300), getAllProducts);
router.get("/product/:id", cache("product", 300), getProductDetails);

// ─── Authenticated user routes ──────────────────────────────────────────────
router.put(
  "/review",
  isAuthenticatedUser,
  invalidateProductCache,
  createProductReview
);
router.get("/reviews",  isAuthenticatedUser, getProductReviews);
router.delete("/review", isAuthenticatedUser, invalidateProductCache, deleteProductReview);

// ─── Admin routes ───────────────────────────────────────────────────────────
router.get(
  "/admin/products",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getAdminProducts
);

router.post(
  "/admin/product/new",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  validateProductImages,
  invalidateProductCache,
  createProduct
);

router.put(
  "/admin/product/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  validateProductImages,
  invalidateProductCache,
  updateProduct
);

router.delete(
  "/admin/product/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  invalidateProductCache,
  deleteProduct
);

module.exports = router;
