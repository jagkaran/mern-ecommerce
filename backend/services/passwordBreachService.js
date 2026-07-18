/**
 * Password breach check using HaveIBeenPwned (HIBP) k-anonymity API.
 * Only the first 5 chars of the SHA1 hash ever leave the server.
 * Fail-open: returns false on any error so availability isn't tied to a third party.
 */

const crypto = require("crypto");
const logger = require("../utils/logger");

const HIBP_URL = "https://api.pwnedpasswords.com/range";
const TIMEOUT_MS = 2500;

/**
 * @param {string} password — plain-text password (not stored, not logged)
 * @returns {Promise<boolean>} true if password is in breach corpus
 */
async function isPasswordBreached(password) {
  if (!password || typeof password !== "string") return false;

  const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const url = `${HIBP_URL}/${prefix}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "mern-ecommerce" },
    });
    if (!res.ok) {
      logger.warn(`HIBP API failed [${url}]: HTTP ${res.status}`);
      return false;
    }
    const text = await res.text();
    // Line format: SUFFIX:COUNT  (e.g. "0018A45C4D1DEF81644B54AB7F969B88D65:1")
    // Match suffix on the left of the colon, case-insensitive.
    // Simple check: if the response text contains the suffix, breach found.
    if (text.includes(suffix)) {
      return true;
    }
    return false;
  } catch (err) {
    logger.warn(`HIBP check aborted/error: ${err.message}`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { isPasswordBreached };
