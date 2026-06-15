/**
 * Response caching middleware for pricing and listing data.
 * Implements TTL-based cache invalidation.
 */
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 min default TTL

/**
 * Create a cache key from request URL and query params
 */
function getCacheKey(req) {
  const path = req.originalUrl || req.url;
  return `cache:${path}`;
}

/**
 * Middleware to cache GET requests
 * @param {number} ttl - Time to live in seconds (default: 300)
 */
function cacheMiddleware(ttl = 300) {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = getCacheKey(req);
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to cache response
    res.json = function (data) {
      cache.set(cacheKey, data, ttl);
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidate cache for a specific pattern
 */
function invalidateCache(pattern) {
  const keys = cache.keys();
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      cache.del(key);
    }
  });
}

/**
 * Clear all cache
 */
function clearCache() {
  cache.flushAll();
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearCache,
};
