const path = require("path");

// Load env vars FIRST using __dirname so path works from ANY working directory
// path.join(__dirname, ...) is always relative to server.js itself, never to cwd
if (process.env.NODE_ENV?.toLowerCase() !== "production") {
  require("dotenv").config({ path: path.join(__dirname, "config", "config.env") });
}

const app        = require("./app");
const connectDB  = require("./config/database");
const cloudinary = require("cloudinary").v2;
const logger     = require("./utils/logger");
const mongoose   = require("mongoose");

// Handle uncaught exceptions BEFORE anything else
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

connectDB();

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

const server = app.listen(process.env.PORT || 5000, () => {
  logger.info(`Server running on http://localhost:${process.env.PORT || 5000} [${process.env.NODE_ENV || "development"}]`);
});

// Handle unhandled promise rejections (e.g. bad DB URI)
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  server.close(() => process.exit(1));
});

// ─── Task 2.4: Graceful Shutdown ──────────────────────────────────────────────
// Render (and most PaaS) sends SIGTERM before force-killing the container.
// We catch it (and SIGINT for local Ctrl-C) to:
//   1. Stop accepting new HTTP connections
//   2. Wait for in-flight requests to finish (server.close)
//   3. Close the MongoDB connection pool cleanly
//   4. Exit with code 0 so the platform knows it was intentional
//
// A 10-second safety timeout force-exits if something hangs during shutdown
// (e.g. a long-running DB operation that never resolves).
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received — starting graceful shutdown`);

  // Hard-kill safety net: if we haven't exited within 10 s, force it.
  const forceExit = setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 10_000);
  // Don't let this timer keep the event loop alive on its own.
  forceExit.unref();

  // Step 1: stop accepting new HTTP connections.
  server.close(async () => {
    logger.info("HTTP server closed");

    // Step 2: close MongoDB connection pool.
    try {
      await mongoose.connection.close(false);
      logger.info("MongoDB connection closed");
    } catch (err) {
      logger.error(`Error closing MongoDB: ${err.message}`);
    }

    clearTimeout(forceExit);
    logger.info("Graceful shutdown complete");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
