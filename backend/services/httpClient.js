/**
 * HTTP client helper for external API calls.
 * Centralises timeout, caching, and error handling so every integration
 * follows the same safe-fail pattern: returns null on any failure, callers
 * decide the fallback.
 */

const logger = require("../utils/logger");
const cache = require("../middleware/cache");

/**
 * Fetch JSON from a URL with timeout, optional caching, and graceful failure.
 *
 * @param {string}  url               — fully-qualified URL (params must already be encoded)
 * @param {object}  [opts]
 * @param {number}  [opts.timeoutMs=2500] — AbortController timeout
 * @param {string}  [opts.cacheKey]      — if provided, check/set node-cache
 * @param {number}  [opts.cacheTtl]      — TTL in seconds for the cache entry
 * @param {object}  [opts.headers]       — extra request headers
 * @returns {Promise<object|null>}       — parsed JSON or null on any failure
 */
async function getJson(url, { timeoutMs = 2500, cacheKey, cacheTtl, headers = {} } = {}) {
  // Check cache first
  if (cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit !== undefined) return hit;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "mern-ecommerce", ...headers },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (cacheKey && cacheTtl) {
      cache.set(cacheKey, data, cacheTtl);
    }

    return data;
  } catch (err) {
    logger.warn(`External API failed [${url}]: ${err.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { getJson };
