const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logout,
  getUserDetails,
  updatePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getSingleUser,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { validateAvatarUpload } = require("../middleware/validateImageUpload");
const {
  validateRegistration,
  validateLogin,
  validateUpdateProfile,
  validateUpdatePassword,
  validateForgotPassword,
  validateResetPassword,
  validateUserId,
  validateUpdateUserRole,
} = require("../middleware/validation");

// Public
router.post("/register", validateAvatarUpload, validateRegistration, registerUser);
router.post("/login",    validateLogin, loginUser);
router.get("/logout",   logout);
router.post("/password/forgot", validateForgotPassword, forgotPassword);
router.put("/password/reset/:token", validateResetPassword, resetPassword);

// Authenticated user
router.get("/me",             isAuthenticatedUser, getUserDetails);
router.put("/password/update", isAuthenticatedUser, validateUpdatePassword, updatePassword);
router.put("/me/update",       isAuthenticatedUser, validateAvatarUpload, validateUpdateProfile, updateProfile);

// Admin
router.get("/admin/users",       isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);
router.get("/admin/user/:id",    isAuthenticatedUser, authorizeRoles("admin"), validateUserId, getSingleUser);
router.put("/admin/user/:id",    isAuthenticatedUser, authorizeRoles("admin"), validateUpdateUserRole, updateUserRole);
router.delete("/admin/user/:id", isAuthenticatedUser, authorizeRoles("admin"), validateUserId, deleteUser);

module.exports = router;
