/**
 * Disposable-email check using the Disify public API.
 * Fails open: returns false on any upstream error so signup is never blocked.
 */

const { getJson } = require("./httpClient");
const cache = require("../middleware/cache");

const DISIFY_URL = "https://disify.com/api/email";

/**
 * @param {string} email
 * @returns {Promise<boolean>} true if the email's domain is known disposable
 */
async function isDisposableEmail(email) {
  if (!email || typeof email !== "string") return false;
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain) return false;

  // Cache per-domain for 24h so we hit the network once per disposable domain.
  const cacheKey = `disposable:${domain}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  const url = `${DISIFY_URL}/${encodeURIComponent(email)}`;
  const data = await getJson(url); // Disify returns { disposable: bool, ... }
  let disposable;
  if (data && typeof data.disposable === "boolean") {
    disposable = data.disposable;
  } else {
    // Upstream failure / parse error → fail-open
    disposable = false;
  }

  cache.set(cacheKey, disposable, 24 * 60 * 60); // 24h TTL
  return disposable;
}

module.exports = { isDisposableEmail };
