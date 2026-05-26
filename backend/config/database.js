const mongoose = require("mongoose");
const logger   = require("../utils/logger");

// Task 2.3 — MongoDB Connection Pool configuration.
// These options tune how many simultaneous connections the driver maintains,
// how long idle connections are kept alive, and how quickly we fail-fast on
// a bad/slow Atlas connection instead of hanging indefinitely.
const MONGO_OPTIONS = {
  // Pool sizing — 5 warm connections always ready; up to 20 under load.
  maxPoolSize: 20,
  minPoolSize: 5,
  // Close connections that have been idle for 30 s to free Atlas resources.
  maxIdleTimeMS: 30_000,
  // Give up trying to reach a primary within 5 s (surface config errors fast).
  serverSelectionTimeoutMS: 5_000,
  // Fail immediately if Mongoose hasn't connected yet instead of queuing
  // operations indefinitely — makes startup errors obvious.
  bufferCommands: false,
};

const connectDB = () => {
  mongoose
    .connect(process.env.DB_URI, MONGO_OPTIONS)
    .then((data) => {
      logger.info(`MongoDB connected: ${data.connection.host}`);
    })
    .catch((err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
      process.exit(1);
    });
};

module.exports = connectDB;
