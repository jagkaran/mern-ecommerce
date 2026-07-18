/**
 * Currency service:
 *   - rates   from Frankfurter (ECB-based, keyless, CORS ok)
 *   - countries/currencies/flags from REST Countries (keyless)
 *
 * All calls funneled through httpClient so we get caching + timeouts for free.
 * Falls back to USD-only if any upstream is down.
 */

const { getJson } = require("./httpClient");

const FRANKFURTER = "https://api.frankfurter.app/latest";
const REST_COUNTRIES = "https://restcountries.com/v3.1/all";

const CACHE_TTL_RATES = 12 * 60 * 60; // 12h
const CACHE_TTL_COUNTRIES = 24 * 60 * 60; // 24h

/**
 * @param {string} [base='USD']
 * @returns {Promise<object|null>} { base, date, rates: {CODE:rate} } or null on failure
 */
async function getRates(base = "USD") {
  const url = `${FRANKFURTER}?from=${encodeURIComponent(base)}`;
  const data = await getJson(url, {
    cacheKey: `rates:${base}`,
    cacheTtl: CACHE_TTL_RATES,
  });
  if (!data || typeof data.rates !== "object") return null;
  // Always include the base currency (1:1)
  if (typeof data.rates[base] !== "number") {
    data.rates[base] = 1;
  }
  return data;
}

/**
 * @returns {Promise<Array<{cca2:string, currency:string, flag:string}>>}
 *          Compacted list — only countries with a primary currency and PNG flag.
 */
async function getCountries() {
  const data = await getJson(REST_COUNTRIES, {
    cacheKey: "countries:compact",
    cacheTtl: CACHE_TTL_COUNTRIES,
    timeoutMs: 5000,
  });
  if (!Array.isArray(data)) return [];
  return data
    .map((c) => {
      const code = c.cca2 || "";
      const flag = c?.flags?.png || c?.flags?.svg || "";
      const currency = c?.currencies ? Object.keys(c.currencies)[0] : "";
      return code && currency ? { cca2: code, currency, flag } : null;
    })
    .filter(Boolean);
}

module.exports = { getRates, getCountries };
