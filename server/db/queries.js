/**
 * Optimized database queries with indexing support
 */
const db = require('./database');

/**
 * Get recent scans for a session with pagination
 */
function getRecentScans(sessionId, limit = 20, offset = 0) {
  return db
    .prepare(
      `SELECT id, image_url, identified_item, category, confidence, created_at
       FROM scan_history
       WHERE session_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(sessionId, limit, offset);
}

/**
 * Get active listings with filters
 */
function getActiveListings(category = null, limit = 50, offset = 0) {
  let query = `SELECT * FROM listings WHERE status = 'active'`;
  const params = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

/**
 * Get listing with full details
 */
function getListingById(listingId) {
  const listing = db
    .prepare('SELECT * FROM listings WHERE id = ?')
    .get(listingId);

  if (listing) {
    listing.specifics = JSON.parse(listing.specifics || '{}');
    listing.pricing_sources = JSON.parse(listing.pricing_sources || '[]');
  }

  return listing;
}

/**
 * Count active listings
 */
function countActiveListings(category = null) {
  let query = 'SELECT COUNT(*) as count FROM listings WHERE status = "active"';
  const params = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  const result = db.prepare(query).get(...params);
  return result.count;
}

/**
 * Get scan statistics
 */
function getScanStatistics(sessionId) {
  return db
    .prepare(
      `SELECT 
        COUNT(*) as total_scans,
        AVG(confidence) as avg_confidence,
        MAX(created_at) as last_scan_at
       FROM scan_history
       WHERE session_id = ?`
    )
    .get(sessionId);
}

module.exports = {
  getRecentScans,
  getActiveListings,
  getListingById,
  countActiveListings,
  getScanStatistics,
};
