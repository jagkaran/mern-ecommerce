const ErrorHandler      = require("../utils/errorHandler");
const catchAsyncErrors  = require("../middleware/catchAsyncErrors");
const User              = require("../models/userModel");
const sendToken         = require("../utils/jwtToken");
const sendEmail         = require("../utils/sendEmail");
const crypto            = require("crypto");
const cloudinary        = require("cloudinary").v2;
const logger            = require("../utils/logger");

/**
 * Register a new user.
 * Uploads the avatar image to Cloudinary and stores the resulting URL.
 *
 * @param {import('express').Request}  req - Body: { name, email, password, avatar (base64) }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 201 with JWT cookie
 * @throws {ErrorHandler} 500 if Cloudinary upload fails
 */
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  let myCloud;
  try {
    myCloud = await cloudinary.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width:  200,
      crop:   "scale",
    });
  } catch (uploadError) {
    logger.error(`Cloudinary upload failed: ${uploadError.message}`);
    return next(new ErrorHandler("Image upload failed. Please try again.", 500));
  }

  const { name, email, password } = req.body;
  const user = await User.create({
    name, email, password,
    profilePic: {
      public_id: myCloud.public_id,
      url:       myCloud.secure_url,
    },
  });

  logger.info(`New user registered: ${user._id}`);
  sendToken(user, 201, res);
});

/**
 * Authenticate a user and issue a JWT cookie.
 *
 * @param {import('express').Request}  req - Body: { email, password }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 with JWT cookie
 * @throws {ErrorHandler} 400 if email or password missing
 * @throws {ErrorHandler} 401 if credentials are invalid
 */
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

/**
 * Log out the current user by expiring the JWT cookie.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @returns {Promise<void>} 200 { success, message }
 */
exports.logout = catchAsyncErrors(async (req, res, _next) => {
  res.cookie("token", null, {
    expires:  new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: "User logged out" });
});

/**
 * Send a password-reset link to the user's email address.
 *
 * @param {import('express').Request}  req - Body: { email }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, message }
 * @throws {ErrorHandler} 404 if user not found
 * @throws {ErrorHandler} 500 if email delivery fails
 */
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const resetToken      = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;
  const message = `Your password reset link:\n\n${resetPasswordUrl}\n\nIf you did not request this, please ignore it.`;

  try {
    await sendEmail({ email: user.email, subject: "Ecommerce Password Recovery", message });
    res.status(200).json({ success: true, message: `Email sent to ${user.email} successfully` });
  } catch (error) {
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpire  = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

/**
 * Reset a user's password using the token sent via email.
 *
 * @param {import('express').Request}  req - Params: { token }; Body: { password, confirmPassword }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 with new JWT cookie
 * @throws {ErrorHandler} 400 if token invalid/expired or passwords do not match
 */
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

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

  user.password            = req.body.password;
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, res);
});

/**
 * Get the profile of the currently authenticated user.
 *
 * @param {import('express').Request}  req - req.user populated by isAuthenticatedUser
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, user }
 * @throws {ErrorHandler} 404 if user no longer exists in DB
 */
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({ success: true, user });
});

/**
 * Update the authenticated user's own password.
 *
 * @param {import('express').Request}  req - Body: { oldPassword, newPassword, confirmPassword }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 with refreshed JWT cookie
 * @throws {ErrorHandler} 401 if old password is incorrect or new passwords mismatch
 * @throws {ErrorHandler} 404 if user not found
 */
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

/**
 * Update the authenticated user's own profile (name, email, avatar).
 * If a new avatar is provided it replaces the old Cloudinary image.
 *
 * @param {import('express').Request}  req - Body: { name, email, avatar? (base64) }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, user }
 * @throws {ErrorHandler} 404 if user not found
 * @throws {ErrorHandler} 500 if Cloudinary upload fails
 */
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name:  req.body.name,
    email: req.body.email,
  };

  if (req.body.avatar && req.body.avatar !== "undefined") {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    try {
      await cloudinary.uploader.destroy(user.profilePic.public_id);
    } catch (destroyError) {
      logger.warn(`Failed to destroy old avatar: ${destroyError.message}`);
    }

    let myCloud;
    try {
      myCloud = await cloudinary.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width:  200,
        crop:   "scale",
      });
    } catch (uploadError) {
      logger.error(`Cloudinary upload failed: ${uploadError.message}`);
      return next(new ErrorHandler("Image upload failed. Please try again.", 500));
    }

    newUserData.profilePic = {
      public_id: myCloud.public_id,
      url:       myCloud.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true, runValidators: true,
  });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({ success: true, user });
});

/**
 * Get all users — Admin only, paginated.
 *
 * @param {import('express').Request}  req - Query: { page, limit }
 * @param {import('express').Response} res
 * @returns {Promise<void>} 200 { success, usersCount, page, limit, users }
 */
exports.getAllUsers = catchAsyncErrors(async (req, res, _next) => {
  const page  = Math.max(1,   Number(req.query.page)  || 1);
  const limit = Math.min(100, Number(req.query.limit)  || 20);
  const skip  = (page - 1) * limit;

  const [users, usersCount] = await Promise.all([
    User.find().skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  res.status(200).json({ success: true, usersCount, page, limit, users });
});

/**
 * Get a single user by ID — Admin only.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, user }
 * @throws {ErrorHandler} 404 if user not found
 */
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler(`User does not exist with ID: ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, user });
});

/**
 * Update a user's role (and name/email) — Admin only.
 *
 * @param {import('express').Request}  req - Params: { id }; Body: { name, email, role }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success: true }
 * @throws {ErrorHandler} 404 if user not found
 */
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name:  req.body.name,
    email: req.body.email,
    role:  req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true, runValidators: true,
  });

  if (!user) {
    return next(new ErrorHandler(`User does not exist with ID: ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true });
});

/**
 * Delete a user by ID — Admin only.
 * Also destroys the user's Cloudinary avatar before removing the DB document.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} 200 { success, message }
 * @throws {ErrorHandler} 404 if user not found
 */
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler(`User does not exist with ID: ${req.params.id}`, 404));
  }

  try {
    await cloudinary.uploader.destroy(user.profilePic.public_id);
  } catch (destroyError) {
    logger.warn(`Failed to destroy user avatar: ${destroyError.message}`);
  }

  await user.deleteOne();

  logger.info(`User deleted: ${req.params.id} by admin ${req.user._id}`);
  res.status(200).json({ success: true, message: "User Deleted Successfully" });
});
