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
const xss = require("xss-clean");
const compression = require("compression");

// NOTE: dotenv is intentionally NOT loaded here.
// server.js loads it first (via __dirname) before requiring this module,
// so all env vars are already in process.env by the time this file runs.
// Loading it again here with a cwd-relative path caused a NODE_ENV
// case-mismatch bug and could silently overwrite vars with wrong values.

// Trust the first proxy in front of the app (nginx, Render, Railway, etc.).
// Required so express-rate-limit can read the real client IP from the
// X-Forwarded-For header without throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
// In production behind multiple proxies, increase the number accordingly
// (e.g. 2 for Render + Cloudflare). In local dev with no proxy this is a no-op.
app.set("trust proxy", 1);

// HTTP security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    // HSTS: tell browsers to always use HTTPS for this domain.
    // max-age = 1 year (seconds). includeSubDomains covers any subdomains.
    // NOTE: only enable once you are 100% on HTTPS — cannot easily undo once
    // browsers cache it.
    strictTransportSecurity: {
      maxAge: 31_536_000,
      includeSubDomains: true,
    },
  })
);

// CORS — on Render frontend is served from same origin so this mainly
// matters for local dev. CLIENT_URL env var overrides in production.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Gzip compression
app.use(compression());

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/v1/login", authLimiter);
app.use("/api/v1/register", authLimiter);
app.use("/api/v1/password/forgot", authLimiter);

// Rate limiting on product endpoints (general access)
const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/v1/products", productLimiter);
app.use("/api/v1/product/:id", productLimiter);
app.use("/api/v1/products/categories", productLimiter);

// Per-route body size overrides for image-upload endpoints.
// Base64 encoding adds ~33% overhead, so a 5 MB image becomes ~6.7 MB in JSON.
// We allow 10 MB here to give a comfortable ceiling while still protecting
// all other routes with the tight 1 MB global limit below.
const uploadJsonParser = express.json({ limit: "10mb" });
const uploadUrlencodedParser = express.urlencoded({ limit: "10mb", extended: true });

app.use("/api/v1/register",          uploadJsonParser, uploadUrlencodedParser);
app.use("/api/v1/me/update",         uploadJsonParser, uploadUrlencodedParser);
app.use("/api/v1/admin/product/new", uploadJsonParser, uploadUrlencodedParser);
app.use("/api/v1/admin/product/:id", uploadJsonParser, uploadUrlencodedParser);

// Global limit for all other routes — kept tight to prevent memory spikes.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(cookieParser());

// Cap multipart file uploads at 5 MB.
// abortOnLimit returns a 400 instead of silently dropping large files.
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    abortOnLimit: true,
    responseOnLimit: JSON.stringify({
      success: false,
      message: "File too large. Maximum size is 5 MB.",
    }),
  })
);

// Data sanitisation
app.use(mongoSanitize());
app.use(xss());

// API Routes
const product = require("./routes/productRoute");
const user    = require("./routes/userRoute");
const order   = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute");
const health  = require("./routes/healthRoute");

app.use("/api/v1/", health);   // /api/v1/health — no auth, no rate-limit
app.use("/api/v1/", product);
app.use("/api/v1/", user);
app.use("/api/v1/", order);
app.use("/api/v1/", payment);

// Serve React build + SPA fallback — PRODUCTION ONLY.
// In development the build folder does not exist; registering the static
// middleware and the wildcard catch-all here would stall the event loop
// when sendFile tries to resolve a non-existent index.html.
if (process.env.NODE_ENV?.toLowerCase() === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
  });
}

// Error middleware — MUST be last
app.use(errorMiddleware);

module.exports = app;
