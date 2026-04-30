/**
 * Validation Middleware
 * Provides input validation for API endpoints using express-validator
 */

const { body, validationResult, param, query } = require("express-validator");
const ErrorHandler = require("../utils/errorHandler");

/**
 * Validation result handler middleware
 */
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    const message = firstError.msg || "Validation failed";
    return next(new ErrorHandler(message, 400));
  }
  next();
};

/**
 * User registration validation
 */
exports.validateRegistration = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 4, max: 30 })
    .withMessage("Name must be between 4 and 30 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email is too long"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 50 })
    .withMessage("Password must be between 8 and 50 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),

  body("avatar")
    .optional()
    .isString()
    .withMessage("Avatar must be a string"),

  this.handleValidationErrors,
];

/**
 * User login validation
 */
exports.validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  this.handleValidationErrors,
];

/**
 * Update profile validation
 */
exports.validateUpdateProfile = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 4, max: 30 })
    .withMessage("Name must be between 4 and 30 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email is too long"),

  body("avatar")
    .optional()
    .isString()
    .withMessage("Avatar must be a string"),

  this.handleValidationErrors,
];

/**
 * Update password validation
 */
exports.validateUpdatePassword = [
  body("oldPassword")
    .notEmpty()
    .withMessage("Old password is required")
    .isLength({ min: 8 })
    .withMessage("Old password must be at least 8 characters"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8, max: 50 })
    .withMessage("New password must be between 8 and 50 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  this.handleValidationErrors,
];

/**
 * Forgot password validation
 */
exports.validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  this.handleValidationErrors,
];

/**
 * Reset password validation
 */
exports.validateResetPassword = [
  param("token")
    .notEmpty()
    .withMessage("Token is required")
    .isString()
    .withMessage("Token must be a string"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 50 })
    .withMessage("Password must be between 8 and 50 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  this.handleValidationErrors,
];

/**
 * Create product validation
 */
exports.validateCreateProduct = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Product name must be between 3 and 100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number")
    .isLength({ max: 8 })
    .withMessage("Price cannot exceed 8 figures"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer")
    .isLength({ max: 4 })
    .withMessage("Stock cannot exceed 4 figures"),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),

  this.handleValidationErrors,
];

/**
 * Update product validation
 */
exports.validateUpdateProduct = [
  param("id")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Product name must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number")
    .isLength({ max: 8 })
    .withMessage("Price cannot exceed 8 figures"),

  body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer")
    .isLength({ max: 4 })
    .withMessage("Stock cannot exceed 4 figures"),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),

  this.handleValidationErrors,
];

/**
 * Product review validation
 */
exports.validateProductReview = [
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("Comment must be between 5 and 500 characters"),

  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  this.handleValidationErrors,
];

/**
 * Create order validation
 */
exports.validateCreateOrder = [
  body("shippingInfo")
    .notEmpty()
    .withMessage("Shipping information is required")
    .isObject()
    .withMessage("Shipping information must be an object"),

  body("shippingInfo.address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),

  body("shippingInfo.city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),

  body("shippingInfo.state")
    .trim()
    .notEmpty()
    .withMessage("State is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),

  body("shippingInfo.country")
    .trim()
    .notEmpty()
    .withMessage("Country is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters"),

  body("shippingInfo.zip")
    .notEmpty()
    .withMessage("Zip code is required")
    .isPostalCode("any")
    .withMessage("Invalid zip code"),

  body("shippingInfo.phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("any")
    .withMessage("Invalid phone number"),

  body("orderItems")
    .notEmpty()
    .withMessage("Order items are required")
    .isArray({ min: 1 })
    .withMessage("At least one order item is required"),

  body("orderItems.*.name")
    .trim()
    .notEmpty()
    .withMessage("Item name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Item name must be between 1 and 100 characters"),

  body("orderItems.*.price")
    .notEmpty()
    .withMessage("Item price is required")
    .isFloat({ min: 0 })
    .withMessage("Item price must be a positive number"),

  body("orderItems.*.quantity")
    .notEmpty()
    .withMessage("Item quantity is required")
    .isInt({ min: 1 })
    .withMessage("Item quantity must be at least 1"),

  body("orderItems.*.image")
    .trim()
    .notEmpty()
    .withMessage("Item image is required")
    .isURL()
    .withMessage("Item image must be a valid URL"),

  body("orderItems.*.product")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("paymentInfo")
    .notEmpty()
    .withMessage("Payment information is required")
    .isObject()
    .withMessage("Payment information must be an object"),

  body("paymentInfo.id")
    .trim()
    .notEmpty()
    .withMessage("Payment ID is required")
    .isString()
    .withMessage("Payment ID must be a string"),

  body("paymentInfo.status")
    .trim()
    .notEmpty()
    .withMessage("Payment status is required")
    .isIn(["succeeded", "pending", "failed"])
    .withMessage("Invalid payment status"),

  body("itemPrice")
    .notEmpty()
    .withMessage("Item price is required")
    .isFloat({ min: 0 })
    .withMessage("Item price must be a positive number"),

  body("taxPrice")
    .notEmpty()
    .withMessage("Tax price is required")
    .isFloat({ min: 0 })
    .withMessage("Tax price must be a positive number"),

  body("shippingPrice")
    .notEmpty()
    .withMessage("Shipping price is required")
    .isFloat({ min: 0 })
    .withMessage("Shipping price must be a positive number"),

  body("totalPrice")
    .notEmpty()
    .withMessage("Total price is required")
    .isFloat({ min: 0 })
    .withMessage("Total price must be a positive number"),

  this.handleValidationErrors,
];

/**
 * Update order validation
 */
exports.validateUpdateOrder = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isMongoId()
    .withMessage("Invalid order ID"),

  body("orderStatus")
    .notEmpty()
    .withMessage("Order status is required")
    .isIn(["Processing", "Shipped", "Delivered"])
    .withMessage("Invalid order status"),

  this.handleValidationErrors,
];

/**
 * Update user role validation
 */
exports.validateUpdateUserRole = [
  param("id")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 4, max: 30 })
    .withMessage("Name must be between 4 and 30 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["user", "admin"])
    .withMessage("Invalid role"),

  this.handleValidationErrors,
];

/**
 * Payment processing validation
 */
exports.validatePayment = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be at least 0.01"),

  this.handleValidationErrors,
];

/**
 * Product ID parameter validation
 */
exports.validateProductId = [
  param("id")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  this.handleValidationErrors,
];

/**
 * Order ID parameter validation
 */
exports.validateOrderId = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isMongoId()
    .withMessage("Invalid order ID"),

  this.handleValidationErrors,
];

/**
 * User ID parameter validation
 */
exports.validateUserId = [
  param("id")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID"),

  this.handleValidationErrors,
];

/**
 * Pagination validation
 */
exports.validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  this.handleValidationErrors,
];
