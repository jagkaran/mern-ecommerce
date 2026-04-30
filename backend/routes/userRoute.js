const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getUserDetails,
  updatePassword,
  updateProfile,
  getAllUsers,
  getSingleUser,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const {
  validateRegistration,
  validateLogin,
  validateUpdateProfile,
  validateUpdatePassword,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateUserRole,
  validateUserId,
} = require("../middleware/validation");

const router = express.Router();

router.route("/register").post(validateRegistration, registerUser);

router.route("/login").post(validateLogin, loginUser);

router.route("/password/forgot").post(validateForgotPassword, forgotPassword);

router.route("/password/reset/:token").put(validateResetPassword, resetPassword);

router.route("/logout").get(logout);

router.route("/me").get(isAuthenticatedUser, getUserDetails);

router.route("/password/update").put(isAuthenticatedUser, validateUpdatePassword, updatePassword);

router.route("/me/update").put(isAuthenticatedUser, validateUpdateProfile, updateProfile);

router
  .route("/admin/users")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);

router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), validateUserId, getSingleUser)
  .put(isAuthenticatedUser, authorizeRoles("admin"), validateUpdateUserRole, updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), validateUserId, deleteUser);

module.exports = router;
