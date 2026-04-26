// Load env vars FIRST — before any module that consumes them
if (process.env.NODE_ENV?.toLowerCase() !== "production") {
  require("dotenv").config({ path: "backend/config/config.env" });
}

const app        = require("./app");
const connectDB  = require("./config/database");
const cloudinary = require("cloudinary").v2;
const logger     = require("./utils/logger");

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
