const express = require("express");
const router = express.Router();
const { param, validationResult } = require("express-validator");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const { lookupPostalCode } = require("../services/geoService");

function handleErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorHandler(errors.array()[0].msg, 400));
  }
  next();
}

const validatePostalParams = [
  param("country")
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage("Country must be a 2-letter code")
    .isAlpha()
    .withMessage("Country must contain only letters"),
  param("code")
    .trim()
    .matches(/^[A-Za-z0-9 -]{1,10}$/)
    .withMessage("Invalid postal code"),
  handleErrors,
];

router.get(
  "/postal/:country/:code",
  validatePostalParams,
  catchAsyncErrors(async (req, res, next) => {
    const { country, code } = req.params;
    const result = await lookupPostalCode(country, code);
    // Empty result is NOT an error — callers (AddressForm) treat null gracefully.
    res.status(200).json({ success: true, hit: !!result, ...(result || {}) });
  })
);

module.exports = router;
