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

// Public
router.post("/register", validateAvatarUpload, registerUser);
router.post("/login",    loginUser);
router.get("/logout",   logout);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);

// Authenticated user
router.get("/me",             isAuthenticatedUser, getUserDetails);
router.put("/password/update", isAuthenticatedUser, updatePassword);
router.put("/me/update",       isAuthenticatedUser, validateAvatarUpload, updateProfile);

// Admin
router.get("/admin/users",       isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);
router.get("/admin/user/:id",    isAuthenticatedUser, authorizeRoles("admin"), getSingleUser);
router.put("/admin/user/:id",    isAuthenticatedUser, authorizeRoles("admin"), updateUserRole);
router.delete("/admin/user/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

module.exports = router;
