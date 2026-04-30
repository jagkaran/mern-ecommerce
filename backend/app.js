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

// Body parsing (Express 4.16+ built-in — body-parser not needed)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(fileUpload());

// Data sanitisation
app.use(mongoSanitize());
app.use(xss());

// API Routes
const product = require("./routes/productRoute");
const user    = require("./routes/userRoute");
const order   = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute");

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
