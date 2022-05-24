const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  //Cast error Handling. Ex: Wrong MongoDB string/ID type
  if (err.name === "CastError") {
    const message = `Resource not found, Invalid:${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Mongoose Duplicate key:{email} error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(
      err.keyValue
    )} entered, Please register will another email`;
    err = new ErrorHandler(message, 400);
  }

  //Wrong JWT error
  if (err.name === "JsonWebTokenError") {
    const message = `Invalid JWT, Please try again`;
    err = new ErrorHandler(message, 400);
  }

  //Expire JWT error
  if (err.name === "TokenExpiredError") {
    const message = `JWT has been expired, Please try again`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).send({
    success: false,
    message: err.message,
  });
};
