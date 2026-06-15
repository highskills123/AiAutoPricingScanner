/**
 * Performance monitoring and optimization utilities
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  /**
   * Start measuring operation duration
   */
  startTimer(key) {
    if (!this.metrics[key]) {
      this.metrics[key] = [];
    }
    return process.hrtime.bigint();
  }

  /**
   * End timer and record duration
   */
  endTimer(key, startTime) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to ms
    this.metrics[key].push(duration);
    return duration;
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(key) {
    if (!this.metrics[key] || this.metrics[key].length === 0) {
      return 0;
    }
    const sum = this.metrics[key].reduce((a, b) => a + b, 0);
    return sum / this.metrics[key].length;
  }

  /**
   * Get all metrics summary
   */
  getSummary() {
    const summary = {};
    Object.keys(this.metrics).forEach((key) => {
      const durations = this.metrics[key];
      summary[key] = {
        count: durations.length,
        average: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
      };
    });
    return summary;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {};
  }
}

/**
 * Middleware to log request duration
 */
function performanceMiddleware() {
  return (req, res, next) => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to ms
      console.log(`[PERF] ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    });

    next();
  };
}

module.exports = {
  PerformanceMonitor,
  performanceMiddleware,
};
