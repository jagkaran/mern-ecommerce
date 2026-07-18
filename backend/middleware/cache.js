/**
 * Cache Middleware
 * Provides in-memory caching for frequently accessed data
 */

const NodeCache = require("node-cache");

// Create cache instance with 10 minute default TTL
const cache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120, // Check for expired items every 2 minutes
  useClones: false, // Don't clone objects for better performance
});

/**
 * Cache middleware factory
 * @param {number} duration - Cache duration in seconds (default: 600)
 * @returns {Function} Express middleware
 */
exports.cache = (duration = 600) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Dev cache-bust: presence of ?v=<anything> flushes every cached entry
    // whose URL path matches this request, then re-runs the handler. Lets
    // us pick up schema edits without restarting the dev server. No-op in
    // production traffic — only triggers when the caller adds the param.
    if (req.query.v) {
      const pathKey = req.originalUrl.split("?")[0];
      cache.keys().forEach((key) => {
        if (key.includes(pathKey)) cache.del(key);
      });
      return next();
    }

    // Generate cache key from URL and query params
    const key = `cache:${req.originalUrl}`;

    // Check if data is cached
    const cachedData = cache.get(key);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (body) => {
      // Cache the response
      cache.set(key, body, duration);
      // Send response
      return originalJson(body);
    };

    next();
  };
};

/**
 * Cache invalidation middleware
 * @param {string} pattern - Cache key pattern to invalidate
 * @returns {Function} Express middleware
 */
exports.invalidateCache = (pattern) => {
  return (req, res, next) => {
    // Invalidate cache after successful POST/PUT/DELETE
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Invalidate cache keys matching pattern
      const keys = cache.keys();
      keys.forEach((key) => {
        if (key.includes(pattern)) {
          cache.del(key);
        }
      });

      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate specific cache key
 * @param {string} key - Cache key to invalidate
 */
exports.invalidateKey = (key) => {
  cache.del(key);
};

/**
 * Invalidate all cache keys matching a pattern
 * @param {string} pattern - Pattern to match
 */
exports.invalidatePattern = (pattern) => {
  return (req, res, next) => {
    // Invalidate cache keys matching pattern
    const keys = cache.keys();
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        cache.del(key);
      }
    });

    next();
  };
};

/**
 * Clear all cache
 */
exports.clearAll = () => {
  cache.flushAll();
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
exports.getStats = () => {
  return {
    keys: cache.keys().length,
    stats: cache.getStats(),
  };
};

/**
 * Get cached value
 * @param {string} key - Cache key
 * @returns {*} Cached value or undefined
 */
exports.get = (key) => {
  return cache.get(key);
};

/**
 * Set cached value
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 */
exports.set = (key, value, ttl) => {
  cache.set(key, value, ttl);
};

/**
 * Delete cached value
 * @param {string} key - Cache key
 */
exports.del = (key) => {
  cache.del(key);
};

module.exports = {
  cache: exports.cache,
  invalidateCache: exports.invalidateCache,
  invalidateKey: exports.invalidateKey,
  invalidatePattern: exports.invalidatePattern,
  clearAll: exports.clearAll,
  getStats: exports.getStats,
  get: exports.get,
  set: exports.set,
  del: exports.del,
};
