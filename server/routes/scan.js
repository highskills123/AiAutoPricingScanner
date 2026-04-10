const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { analyzeImage } = require('../services/imageAnalysis');
const { getPricing } = require('../services/pricing');
const db = require('../db/database');

const router = express.Router();

const UPLOADS_DIR = path.resolve(path.join(__dirname, '..', 'uploads'));

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Always use a UUID filename to prevent path injection — never trust
    // the original filename provided by the client.
    const ext = /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i.test(file.originalname)
      ? path.extname(file.originalname).toLowerCase()
      : '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * POST /api/scan
 * Upload an image and get item identification + pricing.
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const sessionId = req.headers['x-session-id'] || uuidv4();
    const imageFile = req.file;

    // Build the safe file path solely from our trusted UPLOADS_DIR and the
    // basename of the filename (which multer sets to a UUID we generated).
    // We never use imageFile.path directly in file-system calls to avoid
    // any possibility of path traversal through user-controlled data.
    const safeFilename = path.basename(imageFile.filename);
    const safeImagePath = path.join(UPLOADS_DIR, safeFilename);

    // Read image as base64 using the sanitized path
    const imageBase64 = fs.readFileSync(safeImagePath).toString('base64');
    const imageUrl = `/uploads/${safeFilename}`;

    // Analyze image
    let analysisResult;
    try {
      analysisResult = await analyzeImage(imageBase64);
    } catch (analysisErr) {
      console.error('[Scan] Image analysis error:', analysisErr.message);
      return res.status(500).json({
        error: 'Failed to analyze image',
        details: analysisErr.message,
      });
    }

    // Get pricing
    let pricingResult;
    try {
      pricingResult = await getPricing(
        analysisResult.itemName,
        analysisResult.category,
        analysisResult.specifics
      );
    } catch (pricingErr) {
      console.error('[Scan] Pricing error:', pricingErr.message);
      pricingResult = null;
    }

    // Save to scan history
    const scanId = uuidv4();
    db.prepare(
      `INSERT INTO scan_history 
        (id, session_id, image_url, identified_item, category, specifics, pricing_data, confidence) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      scanId,
      sessionId,
      imageUrl,
      analysisResult.itemName,
      analysisResult.category,
      JSON.stringify(analysisResult.specifics),
      JSON.stringify(pricingResult),
      analysisResult.confidence
    );

    return res.json({
      scanId,
      imageUrl,
      itemName: analysisResult.itemName,
      category: analysisResult.category,
      specifics: analysisResult.specifics,
      confidence: analysisResult.confidence,
      labels: analysisResult.labels?.slice(0, 8) || [],
      textFound: analysisResult.textBlocks?.slice(0, 10) || [],
      pricing: pricingResult,
      demoMode: analysisResult.demoMode || pricingResult?.demoMode || false,
    });
  } catch (err) {
    console.error('[Scan] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/scan/history
 * Get recent scan history for the session.
 */
router.get('/history', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) {
    return res.json({ scans: [] });
  }

  const scans = db
    .prepare(
      `SELECT id, image_url, identified_item, category, confidence, created_at
       FROM scan_history
       WHERE session_id = ?
       ORDER BY created_at DESC
       LIMIT 20`
    )
    .all(sessionId);

  return res.json({ scans });
});

/**
 * GET /api/scan/:id
 * Get a specific scan result.
 */
router.get('/:id', (req, res) => {
  const scan = db
    .prepare('SELECT * FROM scan_history WHERE id = ?')
    .get(req.params.id);

  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  scan.specifics = JSON.parse(scan.specifics || '{}');
  scan.pricing_data = JSON.parse(scan.pricing_data || 'null');

  return res.json(scan);
});

module.exports = router;
