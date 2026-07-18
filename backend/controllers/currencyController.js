const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const currencyService = require("../services/currencyService");
const ErrorHandler = require("../utils/errorHandler");

/**
 * GET /api/v1/currency/rates?base=USD
 * Always returns a well-formed response; falls back to USD-only on upstream failure.
 */
exports.getCurrencyRates = catchAsyncErrors(async (req, res, next) => {
  const base = (req.query.base || "USD").toUpperCase();
  // Validate currency code shape (3 letters)
  if (!/^[A-Z]{3}$/.test(base)) {
    return next(new ErrorHandler("Invalid base currency", 400));
  }
  const data = await currencyService.getRates(base);
  if (!data) {
    // Graceful degradation — return a USD-only fallback so the UI can still render.
    return res.status(200).json({
      success: true,
      base,
      date: null,
      rates: base === "USD" ? { USD: 1 } : { [base]: 1, USD: 1 },
      fallback: true,
    });
  }
  res.status(200).json({ success: true, ...data, fallback: false });
});

/**
 * GET /api/v1/currency/countries
 */
exports.getCurrencyCountries = catchAsyncErrors(async (req, res) => {
  const list = await currencyService.getCountries();
  if (!list.length) {
    return res.status(200).json({ success: true, countries: [], fallback: true });
  }
  res.status(200).json({ success: true, countries: list, fallback: false });
});
