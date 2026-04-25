const ErrorHandler = require("../utils/errorHandler");

// Express 4-arg error-handling middleware — `next` is required in the
// signature even though it is not called; prefix with _ to satisfy ESLint.
module.exports = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.message    = err.message    || "Internal Server Error";

  // Cast error — wrong MongoDB ID/string type
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Mongoose duplicate key (e.g. duplicate email)
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered. Please use another value.`;
    err = new ErrorHandler(message, 400);
  }

  // Invalid JWT
  if (err.name === "JsonWebTokenError") {
    err = new ErrorHandler("Invalid token. Please log in again.", 400);
  }

  // Expired JWT
  if (err.name === "TokenExpiredError") {
    err = new ErrorHandler("Token has expired. Please log in again.", 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
