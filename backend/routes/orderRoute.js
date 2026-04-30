const express = require("express");
const {
  createOrder,
  getOrderDetails,
  getMyOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const {
  validateCreateOrder,
  validateUpdateOrder,
  validateOrderId,
  validatePagination,
} = require("../middleware/validation");

router.route("/order/new").post(isAuthenticatedUser, validateCreateOrder, createOrder);

router.route("/order/:id").get(isAuthenticatedUser, validateOrderId, getOrderDetails);

router.route("/orders/me").get(isAuthenticatedUser, validatePagination, getMyOrders);

router
  .route("/admin/orders")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllOrders);

router
  .route("/admin/order/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), validateUpdateOrder, updateOrder)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), validateOrderId, deleteOrder);

module.exports = router;
