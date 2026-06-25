const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    maxLength: [30, "Name cannot exceed 30 characters"],
    minlength: [4, "Name should have atleast 4 characters"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    // unique:true already creates an index on this field internally.
    // Do NOT add a separate userSchema.index({ email: 1 }) — that would
    // create a second identical index, triggering the Mongoose duplicate
    // index warning on every startup and forcing the DB to maintain two
    // redundant structures for every write.
    unique: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please enter your Password"],
    select: false,
    minlength: [8, "Password must be greater than 8 characters"],
  },
  profilePic: {
    public_id: String,
    url:      String,
    // Both fields default to undefined when missing. Required only when a
    // client uploads an avatar; bare register-without-avatar now succeeds
    // and the auth flow no longer 500s on missing Cloudinary config.
  },
  role: {
    type: String,
    default: "user",
  },
  createdAt: {
    type: Date,
    // Date.now (no parentheses) is a function reference that Mongoose calls
    // per-document at insert time. Date.now() would be evaluated once at
    // module load and every user would get the same timestamp.
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// Only non-unique secondary indexes go here.
// The email unique index is managed by the schema field definition above.
userSchema.index({ createdAt: -1 }); // For sorting by creation date

userSchema.pre("save", async function (next) {
  // Critical: RETURN next() when password is unchanged. The prior version
  // called next() but didn't return, so the bcrypt.hash line below ran on
  // every non-password save and re-hashed the already-hashed password —
  // locking users out after the first forgot/reset/profile-update.
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// JWT Token
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Reset password token
userSchema.methods.getResetPasswordToken = function () {
  // Generating token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash the token before storing — plain-text tokens in the DB would be
  // exploitable if the collection is ever read by an attacker.
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Reset token expire time
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
