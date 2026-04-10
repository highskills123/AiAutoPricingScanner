require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many scan requests, please wait before scanning again.' },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
const scanRouter = require('./routes/scan');
const marketplaceRouter = require('./routes/marketplace');

app.use('/api/scan', scanLimiter, scanRouter);
app.use('/api/marketplace', generalLimiter, marketplaceRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    demoMode: !process.env.GOOGLE_VISION_API_KEY || !process.env.EBAY_APP_ID,
    features: {
      imageAnalysis: !!process.env.GOOGLE_VISION_API_KEY,
      ebayPricing: !!process.env.EBAY_APP_ID,
      priceCharting: !!process.env.PRICECHARTING_API_KEY,
      discogs: !!process.env.DISCOGS_TOKEN,
    },
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuildPath));
  app.get('*', generalLimiter, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AiAutoPricingScanner server running on http://localhost:${PORT}`);
  console.log(`📊 Demo mode: ${!process.env.GOOGLE_VISION_API_KEY ? 'ON' : 'OFF'}`);
  console.log(`📦 Configure .env for full API support`);
});

module.exports = app;
