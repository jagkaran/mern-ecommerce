const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
  }

  const decodeData = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decodeData.id);

  // FIX: null-check — user may have been deleted mid-session
  if (!user) {
    return next(new ErrorHandler("User no longer exists. Please login again.", 401));
  }

  req.user = user;
  next();
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};

// Best-effort auth — sets req.user from a valid JWT cookie, otherwise
// req.user = null. Never 401s. Used by routes that should work for both
// authenticated and anonymous (guest) callers.
exports.optionalAuth = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies || {};
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id name email role");
    req.user = user || null;
  } catch (_e) {
    req.user = null;
  }
  next();
});
