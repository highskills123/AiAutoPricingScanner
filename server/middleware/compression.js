/**
 * Compression middleware for optimized response delivery
 */
const compression = require('compression');

/**
 * Apply gzip compression with optimal settings
 */
function compressionMiddleware() {
  return compression({
    level: 6, // Balance between compression ratio and speed
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  });
}

module.exports = compressionMiddleware;
