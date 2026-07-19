"use strict";
const rateLimit = require("express-rate-limit");

/**
 * Factory that creates a per-authenticated-user rate limiter.
 * Uses req.user._id as the key when the user is resolved (i.e. after
 * isAuthenticatedUser middleware), falling back to req.ip for unauthenticated
 * requests so the limiter is still effective before login.
 *
 * @param {number} limit     - Maximum number of requests allowed per window.
 * @param {number} windowMin - Window duration in minutes.
 * @returns {import('express').RequestHandler} Express middleware
 */
const createUserLimiter = (limit = 60, windowMin = 15) =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    limit,
    keyGenerator: (req) => req.user?._id?.toString() ?? req.ip,
    message: { success: false, message: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
  });

/**
 * Default per-user limiter: 60 mutation requests per 15 minutes.
 * Apply after isAuthenticatedUser so req.user is populated.
 *
 * @type {import('express').RequestHandler}
 */
const userRateLimiter = createUserLimiter(60, 15);

/**
 * Stricter limiter for sensitive account operations (password change, profile update).
 * 10 requests per 15 minutes per user.
 *
 * @type {import('express').RequestHandler}
 */
const sensitiveUserLimiter = createUserLimiter(10, 15);

module.exports = { userRateLimiter, sensitiveUserLimiter, createUserLimiter };
