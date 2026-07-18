const express = require("express");
const {
  createOrder,
  getOrderDetails,
  getMyOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
  claimOrder,
} = require("../controllers/orderController");
const router = express.Router();
const { isAuthenticatedUser, optionalAuth, authorizeRoles } = require("../middleware/auth");
const {
  validateCreateOrder,
  validateUpdateOrder,
  validateOrderId,
  validatePagination,
  validateClaim,
} = require("../middleware/validation");

// Public claim route — exchanges a claim token for a freshly-minted JWT cookie.
// Mounted before any auth-aware /order/* routes so Express's path matcher
// resolves `/order/claim` to the literal route, not the parametric
// `/order/:id` below.
router.route("/order/claim").post(validateClaim, claimOrder);

router.route("/order/new").post(optionalAuth, validateCreateOrder, createOrder);

router.route("/order/:id").get(isAuthenticatedUser, validateOrderId, getOrderDetails);

router.route("/orders/me").get(isAuthenticatedUser, validatePagination, getMyOrders);

router.route("/admin/orders").get(isAuthenticatedUser, authorizeRoles("admin"), getAllOrders);

router
  .route("/admin/order/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), validateUpdateOrder, updateOrder)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), validateOrderId, deleteOrder);

module.exports = router;
