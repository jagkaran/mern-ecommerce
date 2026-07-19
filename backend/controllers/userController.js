const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const emailService = require("../services/emailService");
const crypto = require("crypto");
const storage = require("../services/storageService");
const logger = require("../utils/logger");

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password, profilePic: { public_id: "", url: "" } });
  logger.info(`New user registered: ${user._id}`);
  sendToken(user, 201, res);
});

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter both Email and Password", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password or Email did not match. Please try again.", 401));
  }
  sendToken(user, 200, res);
});

exports.logout = catchAsyncErrors(async (req, res, _next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: "User logged out" });
});

// ---------------- Wishlist ----------------
// GET /api/v1/wishlist — returns user's wishlist with populated product data
exports.getWishlist = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: "wishlist.product",
    select: "name price ratings images category stock numOfReviews",
  });
  if (!user) return next(new ErrorHandler("User not found", 404));
  // Filter out wishlist entries whose product was deleted
  const items = (user.wishlist || [])
    .filter((w) => w.product)
    .map((w) => ({ ...w.product.toObject(), addedAt: w.addedAt }));
  res.status(200).json({ success: true, items, count: items.length });
});

// PUT /api/v1/wishlist/:productId — idempotent add
exports.addToWishlist = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    return next(new ErrorHandler("Invalid product id", 400));
  }
  const user = await User.findById(req.user.id);
  if (!user) return next(new ErrorHandler("User not found", 404));
  const already = user.wishlist.some((w) => String(w.product) === productId);
  if (!already) {
    user.wishlist.push({ product: productId });
    await user.save({ validateBeforeSave: false });
  }
  res.status(200).json({ success: true, count: user.wishlist.length });
});

// DELETE /api/v1/wishlist/:productId — idempotent remove
exports.removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    return next(new ErrorHandler("Invalid product id", 400));
  }
  const user = await User.findById(req.user.id);
  if (!user) return next(new ErrorHandler("User not found", 404));
  const before = user.wishlist.length;
  user.wishlist = user.wishlist.filter((w) => String(w.product) !== productId);
  if (user.wishlist.length !== before) {
    await user.save({ validateBeforeSave: false });
  }
  res.status(200).json({ success: true, count: user.wishlist.length });
});

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;
  try {
    await emailService.sendPasswordReset(user.email, resetPasswordUrl);
    res.status(200).json({ success: true, message: `Email sent to ${user.email} successfully` });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorHandler("Reset password token is invalid or has expired", 400));
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});

exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  res.status(200).json({ success: true, user });
});

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 401));
  }
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("New password did not match", 401));
  }
  user.password = req.body.newPassword;
  await user.save();
  sendToken(user, 200, res);
});

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  if (req.body.avatar && req.body.avatar !== "undefined") {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    try {
      await storage.destroyImage(user.profilePic.public_id);
    } catch (destroyError) {
      logger.warn(`Failed to destroy old avatar: ${destroyError.message}`);
    }
    const myCloud = await storage.uploadAvatar(req.body.avatar);
    newUserData.profilePic = {
      public_id: myCloud.public_id,
      url: myCloud.url,
    };
  }
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  res.status(200).json({ success: true, user });
});

exports.getAllUsers = catchAsyncErrors(async (req, res, _next) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const [users, usersCount] = await Promise.all([
    User.find().skip(skip).limit(limit),
    User.countDocuments(),
  ]);
  res.status(200).json({ success: true, usersCount, page, limit, users });
});

exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler(`User does not exist with ID: ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, user });
});

exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };
  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!user) {
    return next(new ErrorHandler(`User does not exist with ID: ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true });
});

exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler(`User does not exist with ID: ${req.params.id}`, 404));
  }
  try {
    await storage.destroyImage(user.profilePic.public_id);
  } catch (destroyError) {
    logger.warn(`Failed to destroy user avatar: ${destroyError.message}`);
  }
  await user.deleteOne();
  logger.info(`User deleted: ${req.params.id} by admin ${req.user._id}`);
  res.status(200).json({ success: true, message: "User Deleted Successfully" });
});
