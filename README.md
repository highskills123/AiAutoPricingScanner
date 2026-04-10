# 🔍 AiAutoPricingScanner

An AI-powered pricing scanner for collectibles, trading cards, vintage items, and sports memorabilia. Scan any item with your phone camera or upload an image to instantly see what **buyers are actually paying** — not just asking prices — sourced from eBay sold listings, PriceCharting, TCGPlayer, and more.

Includes a **built-in marketplace** with a 5% platform fee on sales.

---

## ✨ Features

- 📸 **Camera or image upload** — works on mobile and desktop
- 🤖 **AI-powered item identification** — Google Vision API extracts text, labels, and web entities to precisely identify items (card number, year, player name, grade, etc.)
- 💰 **Real buyer prices** — searches **eBay completed/sold listings** so you see what buyers actually paid, not what sellers are asking
- 📊 **Multi-source pricing** — eBay, PriceCharting, TCGPlayer, Discogs
- 🏪 **Marketplace** — list scanned items at the AI-verified price
- 💸 **5% platform fee** — automatically calculated and displayed to both buyer and seller
- 📱 **PWA-ready** — installable on mobile as a native-like app
- 🎭 **Demo mode** — works without API keys using realistic demo data

## 🗂️ Categories

- 🃏 **Cards** — Sports cards (Topps, Panini, Upper Deck), Pokémon, Magic: The Gathering, Yu-Gi-Oh
- ⚾ **Sports Memorabilia** — Signed items, equipment, trophies, championships
- 🏆 **Collectibles** — Funko Pop, action figures, comics, coins, stamps
- 🏺 **Vintage** — Antiques, art deco, mid-century, retro items

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone https://github.com/highskills123/AiAutoPricingScanner
cd AiAutoPricingScanner
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example server/.env
# Edit server/.env with your API keys
```

### 3. Run in development

```bash
npm run dev
```

- **Client** → http://localhost:5173
- **Server** → http://localhost:3001

---

## 🔑 API Keys (All Free Tiers)

### Required for live scanning

| Service | Purpose | Get Key |
|---------|---------|---------|
| **Google Vision API** | Image analysis & text extraction | [console.cloud.google.com](https://console.cloud.google.com/apis/library/vision.googleapis.com) · 1000 free requests/month |
| **eBay Finding API** | Sold listing prices (buyer prices) | [developer.ebay.com](https://developer.ebay.com) · Free developer account |

### Optional (more pricing sources)

| Service | Purpose | Get Key |
|---------|---------|---------|
| **PriceCharting** | Retro games, Pokémon, sports cards | [pricecharting.com/api](https://www.pricecharting.com/api) |
| **Discogs** | Vinyl records, music memorabilia | [discogs.com/settings/developers](https://www.discogs.com/settings/developers) |

> **Demo Mode**: Without API keys, the app runs in demo mode with realistic example data so you can explore all features.

---

## 🏗️ Architecture

```
AiAutoPricingScanner/
├── server/                    # Node.js + Express API
│   ├── index.js               # Server entry point
│   ├── routes/
│   │   ├── scan.js            # POST /api/scan — image upload & analysis
│   │   └── marketplace.js     # CRUD /api/marketplace
│   ├── services/
│   │   ├── imageAnalysis.js   # Google Vision API integration
│   │   └── pricing.js         # eBay, PriceCharting, Discogs pricing
│   └── db/
│       └── database.js        # SQLite via better-sqlite3
│
├── client/                    # React + Vite + Tailwind PWA
│   └── src/
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── ScanPage.jsx          # Camera/upload interface
│       │   ├── ResultsPage.jsx       # Pricing results
│       │   ├── MarketplacePage.jsx   # Browse listings
│       │   ├── CreateListingPage.jsx # List scanned item
│       │   ├── ListingDetailPage.jsx
│       │   └── MyListingsPage.jsx
│       └── components/
│           ├── PricingTable.jsx      # Multi-source price display
│           └── ListingCard.jsx
│
├── .env.example               # API key configuration template
└── package.json               # Root scripts
```

---

## 💰 Marketplace & Fees

- Sellers list items at the AI-verified market price (editable)
- **5% platform fee** on each sale (displayed transparently to both parties)
- Fee breakdown shown before listing and on every listing page
- `sellerReceives = askingPrice × 0.95`

---

## 🔬 How Pricing Works

The scanner is designed to find **exact items**, not just similar ones:

1. **Google Vision** extracts all text from the image (player name, year, set, card number, grade)
2. **Specifics are parsed**: card number, print run, grading company + grade, rookie designation
3. **eBay `findCompletedItems`** searches sold listings with the exact query, filtering to `SoldItemsOnly=true`
4. Outliers (top/bottom 10%) are trimmed for a clean average
5. The **median sold price** is shown alongside the average
6. Multiple sources are aggregated for the final recommended price

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Tailwind CSS, Vite |
| Backend | Node.js, Express 4 |
| Database | SQLite (better-sqlite3) |
| Image AI | Google Cloud Vision API |
| Pricing | eBay Finding API, PriceCharting API, Discogs API |
| File Upload | Multer |
| Mobile | PWA (installable on iOS/Android) |

---

## 📸 Scanning Tips

- **Cards**: Lay flat, good lighting, capture all text (player name, year, set name, card number)
- **Graded cards**: Include the full PSA/BGS/SGC label in the shot
- **Vintage items**: Show maker's marks, hallmarks, and any dates
- **Sports memorabilia**: Show any signatures, tags, or certificates of authenticity
- Avoid glare — natural diffused light works best

---

## 🧪 Running Tests

```bash
# Start server in demo mode (no API keys needed)
cd server && npm start

# Test health
curl http://localhost:3001/api/health

# Test scan (demo mode returns LeBron James rookie card example)
curl -X POST http://localhost:3001/api/scan -F "image=@/path/to/image.jpg"

# Test marketplace
curl http://localhost:3001/api/marketplace
```

---

## 📱 Mobile Installation

Since the app is a PWA:
1. Open http://your-server-url in Safari (iOS) or Chrome (Android)
2. Tap **Share → Add to Home Screen** (iOS) or **Install App** (Android)
3. The app icon appears on your home screen like a native app

---

## 🔒 Privacy

- Images are stored temporarily on the server for analysis
- No personal data is collected
- Session-based identity (no account required)
- All pricing lookups are read-only against public APIs
