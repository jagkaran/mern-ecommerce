// middleware/couponLimiter.js
// Brute-force shield for /coupon/validate. Anonymous-friendly (keyed by IP
// since the cart can validate codes pre-signin). Same bypass semantics as
// the auth limiter in app.js — E2E specs disable it so a single test
// session can hammer validate freely.

const rateLimit = require("express-rate-limit");

exports.couponLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  // Tight enough to make brute-forcing a 3-32-char alphanumeric code painful,
  // loose enough that a real shopper entering codes repeatedly during a sale
  // won't get rate-limited.
  limit: process.env.E2E_BYPASS_LIMITS ? 1_000_000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !!process.env.E2E_BYPASS_LIMITS,
  keyGenerator: (req) => req.ip || "anon",
  message: {
    success: false,
    message: "Too many coupon attempts. Please wait a minute and try again.",
  },
});
