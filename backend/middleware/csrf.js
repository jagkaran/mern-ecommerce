"use strict";
const { doubleCsrf } = require("csrf-csrf");

/**
 * CSRF protection using the double-submit cookie pattern (csrf-csrf library).
 *
 * How it works:
 *  1. Client fetches GET /api/v1/csrf-token on app mount — server sets a
 *     signed httpOnly cookie AND returns the token in the JSON body.
 *  2. Client attaches the token as the X-CSRF-Token request header on every
 *     state-mutating request (POST/PUT/DELETE/PATCH).
 *  3. This middleware verifies the header value matches the signed cookie.
 *     A 403 is returned on mismatch.
 *
 * Exclusions:
 *  - GET / HEAD / OPTIONS are ignored automatically (safe methods).
 *  - /api/v1/payment/webhook is explicitly excluded — Stripe calls it from
 *    their servers (no browser cookie), and it is already secured by
 *    HMAC-SHA256 signature verification in the controller.
 *
 * @module middleware/csrf
 */

// Fail fast in production if CSRF_SECRET is not set. Without a strong
// secret the HMAC cookie is forgeable — running the app in prod without it
// is a security failure, not a soft fallback.
if (
  process.env.NODE_ENV?.toLowerCase() === "production" &&
  !process.env.CSRF_SECRET
) {
  throw new Error(
    "CSRF_SECRET is required in production. Set a long random value in the " +
      "environment (e.g. `openssl rand -hex 32`) before starting the server."
  );
}

const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret: () =>
    process.env.CSRF_SECRET || "csrf-fallback-dev-secret-change-in-prod",
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV?.toLowerCase() === "production",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});

/**
 * Express middleware that validates the CSRF token on state-mutating requests.
 * Sends HTTP 403 if the token is absent or does not match the signed cookie.
 * The Stripe webhook path is skipped — it carries its own authentication.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const csrfProtection = (req, res, next) => {
  // Stripe webhook is authenticated by HMAC-SHA256 — skip CSRF check
  if (req.path === "/api/v1/payment/webhook") return next();
  return doubleCsrfProtection(req, res, next);
};

/**
 * Route handler that issues a fresh CSRF token to the browser.
 * The React app should call GET /api/v1/csrf-token on mount and store the
 * returned token, then send it as the X-CSRF-Token header on mutations.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const generateCsrfToken = (req, res) => {
  const token = generateToken(req, res);
  res.status(200).json({ csrfToken: token });
};

module.exports = { csrfProtection, generateCsrfToken };
