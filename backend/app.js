const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const fileUpload = require("express-fileupload");
const errorMiddleware = require("./middleware/error");
const path = require("path");

// Security middleware
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const { xss } = require("express-xss-sanitizer");
const compression = require("compression");

// Per-user rate limiters (applied after isAuthenticatedUser resolves req.user)
const { userRateLimiter, sensitiveUserLimiter } = require("./middleware/rateLimiter");

// NOTE: dotenv is intentionally NOT loaded here.
// server.js loads it first (via __dirname) before requiring this module,
// so all env vars are already in process.env by the time this file runs.

// Trust the first proxy in front of the app (nginx, Render, Railway, etc.).
app.set("trust proxy", 1);

// HTTP security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    strictTransportSecurity: {
      maxAge: 31_536_000,
      includeSubDomains: true,
    },
  })
);

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Gzip compression
app.use(compression());

// ─── IP-based rate limiters (before body parsing) ────────────────────────────

// Tight limit on auth endpoints — bypassed in E2E for the same reason.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.E2E_BYPASS_LIMITS ? 1_000_000 : 20,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !!process.env.E2E_BYPASS_LIMITS,
});
app.use("/api/v1/login", authLimiter);
app.use("/api/v1/register", authLimiter);
app.use("/api/v1/password/forgot", authLimiter);

// General limit on product listing endpoints — bypassed entirely in E2E
// (Playwright hits these endpoints dozens of times per spec).
const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Allow a generous ceiling even in dev; tests get effectively unlimited.
  max: process.env.E2E_BYPASS_LIMITS ? 1_000_000 : 100,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !!process.env.E2E_BYPASS_LIMITS,
});
app.use("/api/v1/products", productLimiter);
app.use("/api/v1/product/:id", productLimiter);
app.use("/api/v1/products/categories", productLimiter);

// ─── Per-user rate limiters (keyed on req.user._id after auth resolves) ───────
// These paths are registered BEFORE body parsers so limits engage early,
// but the actual user resolution happens inside isAuthenticatedUser which
// runs per-route — the keyGenerator falls back to IP until user is known.
app.use("/api/v1/review", userRateLimiter);
app.use("/api/v1/order/new", userRateLimiter);
app.use("/api/v1/payment/process", userRateLimiter);
app.use("/api/v1/admin/", userRateLimiter);
app.use("/api/v1/password/update", sensitiveUserLimiter);
app.use("/api/v1/me/update", sensitiveUserLimiter);
// /order/claim mints a User and a JWT — same blast radius as
// /password/update. Throttle it the same way to keep brute-force attacks
// expensive. Keyed by IP because the requester is anonymous here.
app.use("/api/v1/order/claim", sensitiveUserLimiter);

// ─── Body parsers ─────────────────────────────────────────────────────────────

// Stripe webhook REQUIRES the raw request body for HMAC-SHA256 signature
// verification. express.json() below rewrites req.body to a parsed object,
// which changes the bytes Stripe signs -> signature check always fails.
// Mount the raw parser at app-level for the webhook path so it short-circuits
// express.json() before the global JSON body parser runs.
app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));

// Per-route body size overrides for image-upload endpoints.
const uploadJsonParser = express.json({ limit: "10mb" });
const uploadUrlencodedParser = express.urlencoded({ limit: "10mb", extended: true });

app.use("/api/v1/register", uploadJsonParser, uploadUrlencodedParser);
app.use("/api/v1/me/update", uploadJsonParser, uploadUrlencodedParser);
app.use("/api/v1/admin/product/new", uploadJsonParser, uploadUrlencodedParser);
app.use("/api/v1/admin/product/:id", uploadJsonParser, uploadUrlencodedParser);

// Global limit for all other routes
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(cookieParser());

// Cap multipart file uploads at 5 MB.
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: JSON.stringify({
      success: false,
      message: "File too large. Maximum size is 5 MB.",
    }),
  })
);

// Data sanitisation
app.use(mongoSanitize());
app.use(xss()); // express-xss-sanitizer

// ─── CSRF protection (double-submit cookie, webhook excluded) ─────────────────
// Must come AFTER cookieParser (needs req.cookies) and BEFORE route mounts.
// GET /api/v1/csrf-token lets the React app hydrate the token on mount.
// All subsequent POST/PUT/DELETE requests must include X-CSRF-Token header.
//
// Disabled in the test environment — supertest does not maintain cookies
// between requests the same way a browser does, so CSRF would block all
// mutation tests. CSRF is a browser-specific attack vector and does not
// apply to server-to-server test runners.
if (process.env.NODE_ENV?.toLowerCase() === "production") {
  const { csrfProtection, generateCsrfToken } = require("./middleware/csrf");
  app.get("/api/v1/csrf-token", generateCsrfToken);
  app.use(csrfProtection);
}

// ─── Request logging ──────────────────────────────────────────────────────────
// Structured timing + method + IP logging via Winston. Redacts sensitive body
// fields. Covers every request before it hits any route.
const requestLogger = require("./middleware/logger");
app.use(requestLogger);

// ─── API Routes ───────────────────────────────────────────────────────────────
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute");
const health = require("./routes/healthRoute");
const currency = require("./routes/currencyRoute");
const geo = require("./routes/geoRoute");
const { publicRouter: couponPublic, adminRouter: couponAdmin } = require("./routes/couponRoute");

app.use("/api/v1/", health);
app.use("/api/v1/", product);
app.use("/api/v1/", user);
app.use("/api/v1/", order);
app.use("/api/v1/", payment);
app.use("/api/v1/currency", currency);
app.use("/api/v1/geo", geo);
app.use("/api/v1/coupon", couponPublic);
app.use("/api/v1/", couponAdmin);

// API 404 catch-all — any /api route that didn't match above
app.use("/api", (_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

// Serve React build + SPA fallback — PRODUCTION ONLY.
if (process.env.NODE_ENV?.toLowerCase() === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
  });
}

// Error middleware — MUST be last
app.use(errorMiddleware);

module.exports = app;
