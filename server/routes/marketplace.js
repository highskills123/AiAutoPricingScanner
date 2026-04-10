const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { PLATFORM_FEE_RATE } = require('../services/pricing');

const router = express.Router();

/**
 * GET /api/marketplace
 * List active marketplace listings with optional filters.
 */
router.get('/', (req, res) => {
  const { category, page = 1, limit = 20, sort = 'newest' } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT id, title, description, category, condition, asking_price, 
           platform_fee, image_url, specifics, status, created_at
    FROM listings
    WHERE status = 'active'
  `;
  const params = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  const orderMap = {
    newest: 'created_at DESC',
    oldest: 'created_at ASC',
    price_asc: 'asking_price ASC',
    price_desc: 'asking_price DESC',
  };
  query += ` ORDER BY ${orderMap[sort] || orderMap.newest}`;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const listings = db.prepare(query).all(...params);

  const countResult = db
    .prepare(
      `SELECT COUNT(*) as count FROM listings WHERE status = 'active'${
        category && category !== 'all' ? ' AND category = ?' : ''
      }`
    )
    .get(...(category && category !== 'all' ? [category] : []));

  listings.forEach((l) => {
    l.specifics = JSON.parse(l.specifics || '{}');
  });

  return res.json({
    listings,
    total: countResult.count,
    page: parseInt(page),
    totalPages: Math.ceil(countResult.count / parseInt(limit)),
  });
});

/**
 * GET /api/marketplace/:id
 * Get a specific listing.
 */
router.get('/:id', (req, res) => {
  const listing = db
    .prepare('SELECT * FROM listings WHERE id = ?')
    .get(req.params.id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  listing.specifics = JSON.parse(listing.specifics || '{}');
  listing.pricing_sources = JSON.parse(listing.pricing_sources || '[]');

  return res.json(listing);
});

/**
 * POST /api/marketplace
 * Create a new marketplace listing from a scan.
 */
router.post('/', (req, res) => {
  const {
    sessionId,
    scanId,
    title,
    description,
    category,
    condition,
    askingPrice,
    scannedPrice,
    imageUrl,
    imageData,
    specifics,
    pricingSources,
  } = req.body;

  if (!title || !category || !askingPrice || !scannedPrice) {
    return res.status(400).json({
      error: 'Missing required fields: title, category, askingPrice, scannedPrice',
    });
  }

  const price = parseFloat(askingPrice);
  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'Invalid asking price' });
  }

  const platformFee = Math.round(price * PLATFORM_FEE_RATE * 100) / 100;

  const id = uuidv4();
  db.prepare(
    `INSERT INTO listings 
      (id, session_id, title, description, category, condition, scanned_price, 
       asking_price, platform_fee, image_url, image_data, specifics, pricing_sources, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
  ).run(
    id,
    sessionId || uuidv4(),
    title,
    description || '',
    category,
    condition || 'used',
    parseFloat(scannedPrice),
    price,
    platformFee,
    imageUrl || null,
    imageData || null,
    JSON.stringify(specifics || {}),
    JSON.stringify(pricingSources || [])
  );

  return res.status(201).json({
    id,
    title,
    category,
    askingPrice: price,
    platformFee,
    sellerReceives: Math.round((price - platformFee) * 100) / 100,
    status: 'active',
    message: 'Listing created successfully',
  });
});

/**
 * PATCH /api/marketplace/:id
 * Update a listing (e.g., mark as sold or update price).
 */
router.patch('/:id', (req, res) => {
  const { status, askingPrice } = req.body;
  const sessionId = req.headers['x-session-id'];

  const listing = db
    .prepare('SELECT * FROM listings WHERE id = ?')
    .get(req.params.id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if (sessionId && listing.session_id !== sessionId) {
    return res.status(403).json({ error: 'Not authorized to update this listing' });
  }

  const updates = {};
  if (status && ['active', 'sold', 'removed'].includes(status)) {
    updates.status = status;
  }
  if (askingPrice) {
    const price = parseFloat(askingPrice);
    if (!isNaN(price) && price > 0) {
      updates.asking_price = price;
      updates.platform_fee = Math.round(price * PLATFORM_FEE_RATE * 100) / 100;
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.updated_at = new Date().toISOString();

  const setClauses = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(', ');
  const values = [...Object.values(updates), req.params.id];

  db.prepare(`UPDATE listings SET ${setClauses} WHERE id = ?`).run(...values);

  return res.json({ message: 'Listing updated successfully' });
});

/**
 * DELETE /api/marketplace/:id
 * Remove a listing.
 */
router.delete('/:id', (req, res) => {
  const sessionId = req.headers['x-session-id'];

  const listing = db
    .prepare('SELECT * FROM listings WHERE id = ?')
    .get(req.params.id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if (sessionId && listing.session_id !== sessionId) {
    return res.status(403).json({ error: 'Not authorized to delete this listing' });
  }

  db.prepare("UPDATE listings SET status = 'removed' WHERE id = ?").run(
    req.params.id
  );

  return res.json({ message: 'Listing removed successfully' });
});

/**
 * GET /api/marketplace/my/listings
 * Get listings for the current session.
 */
router.get('/my/listings', (req, res) => {
  const sessionId = req.headers['x-session-id'];

  if (!sessionId) {
    return res.json({ listings: [] });
  }

  const listings = db
    .prepare(
      `SELECT id, title, category, condition, asking_price, platform_fee, 
              image_url, status, created_at
       FROM listings
       WHERE session_id = ?
       ORDER BY created_at DESC`
    )
    .all(sessionId);

  return res.json({ listings });
});

module.exports = router;
