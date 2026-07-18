const express = require("express");
const router = express.Router();
const { getCurrencyRates, getCurrencyCountries } = require("../controllers/currencyController");
const { cache } = require("../middleware/cache");

// Rates: 6h in-memory cache by URL (base in query)
router.get("/rates", cache(6 * 60 * 60), getCurrencyRates);

// Countries: 24h in-memory cache by URL
router.get("/countries", cache(24 * 60 * 60), getCurrencyCountries);

module.exports = router;
