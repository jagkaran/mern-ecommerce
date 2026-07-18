/**
 * Delivery ETA service using Nager.Date public holidays API.
 * Provides business-day calculations excluding weekends + public holidays.
 */

const { getJson } = require("./httpClient");

const NAGER_BASE = "https://date.nager.at/api/v3/PublicHolidays";
const CACHE_HOLIDAYS_TTL = 24 * 60 * 60; // 24h

/**
 * Fetch public holidays for a given year and ISO country code.
 * @param {number} year
 * @param {string} countryCode - ISO 3166-1 alpha-2, e.g. "US", "GB"
 * @returns {Promise<Array<{date: string}>> | null}
 */
async function fetchHolidays(year, countryCode) {
  if (!year || typeof year !== "number" || year < 1900) return null;
  if (!countryCode || typeof countryCode !== "string" || countryCode.length !== 2) return null;

  const url = `${NAGER_BASE}/${year}/${countryCode}`;
  const data = await getJson(url, {
    cacheKey: `holidays:${year}:${countryCode}`,
    cacheTtl: CACHE_HOLIDAYS_TTL,
  });
  if (!Array.isArray(data)) return null;
  return data.map((d) => ({ date: d.date }));
}

/**
 * Calculate estimated delivery date based on business days, excluding weekends
 * and public holidays for the given country.
 *
 * @param {string} countryCode
 * @param {Date|string} fromDate - start date (defaults to today if missing/invalid)
 * @param {number} [businessDays=5]
 * @returns {Date|null}
 */
async function estimateDelivery(countryCode, fromDate, businessDays = 5) {
  if (!countryCode || typeof countryCode !== "string" || countryCode.length !== 2) return null;
  if (typeof businessDays !== "number" || !isFinite(businessDays) || businessDays < 1) return null;

  // Strict guard: explicit invalid fromDate string → null (don't silently fall back to today)
  if (fromDate !== undefined && fromDate !== null) {
    const test = new Date(fromDate);
    if (isNaN(test.getTime())) return null;
  }

  let current = new Date(fromDate);
  if (isNaN(current.getTime())) current = new Date();

  const year = current.getFullYear();
  const holidays = await fetchHolidays(year, countryCode);

  let count = 0;
  // Move to the *next* calendar day before counting, matching the test contract:
  // From a Sunday, the first candidate business day is Monday (count=1).
  current.setDate(current.getDate() + 1);

  if (!holidays) {
    // Fallback: weekends-only when holidays are unavailable.
    const w = current.getDay();
    if (w !== 0 && w !== 6) count = 1;
    while (count < businessDays) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
    }
    return current;
  }

  const holidaySet = new Set(holidays.map((h) => h.date));
  const w = current.getDay();
  if (w !== 0 && w !== 6 && !holidaySet.has(iso(current))) count = 1;

  while (count < businessDays) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day === 0 || day === 6) continue;
    if (holidaySet.has(iso(current))) continue;
    count++;
  }
  return current;
}

function iso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

module.exports = { estimateDelivery };
