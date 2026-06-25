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

  // Invalid JWT — map to 401 (was 400). Status code is 401 even though
  // ErrorHandler defaults to 400; we pass 401 explicitly so the client
  // can distinguish "expired/invalid session" from "bad request body".
  if (err.name === "JsonWebTokenError") {
    err = new ErrorHandler("Invalid token. Please log in again.", 401);
  }

  // Expired JWT
  if (err.name === "TokenExpiredError") {
    err = new ErrorHandler("Token has expired. Please log in again.", 401);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
