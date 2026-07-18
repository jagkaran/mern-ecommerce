/**
 * Geo service: postal-code lookup (Zippopotam proxy).
 * Zippopotam is HTTP-only, so we MUST go through the backend to avoid
 * mixed-content / CORS issues. Returns { city, state } or null.
 */

const { getJson } = require("./httpClient");

const ZIP_BASE = "http://api.zippopotam.us";

/**
 * @param {string} country — ISO 3166-1 alpha-2 country code, e.g. "US"
 * @param {string} zip     — postal code
 * @returns {Promise<{city:string, state:string, country:string}|null>}
 */
async function lookupPostalCode(country, zip) {
  if (!country || !zip) return null;
  const cc = String(country).trim().toUpperCase();
  const code = String(zip).trim();
  if (!/^[A-Z]{2}$/.test(cc) || !/^[A-Z0-9 -]{1,10}$/i.test(code)) {
    return null;
  }

  const url = `${ZIP_BASE}/${encodeURIComponent(cc)}/${encodeURIComponent(code)}`;
  const cacheKey = `zip:${cc}:${code}`;

  const data = await getJson(url, {
    cacheKey,
    cacheTtl: 24 * 60 * 60, // 24h
  });
  if (!data || !Array.isArray(data.places) || !data.places.length) {
    return null;
  }
  const place = data.places[0];
  return {
    city: place["place name"] || null,
    state: place["state abbreviation"] || place.state || null,
    country: data["country abbreviation"] || cc,
  };
}

module.exports = { lookupPostalCode };
