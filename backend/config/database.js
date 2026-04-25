const mongoose = require("mongoose");
const logger   = require("../utils/logger");

const connectDB = () => {
  mongoose.connect(process.env.DB_URI)
    .then((data) => {
      logger.info(`MongoDB connected: ${data.connection.host}`);
    })
    .catch((err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
      process.exit(1);
    });
};

module.exports = connectDB;
