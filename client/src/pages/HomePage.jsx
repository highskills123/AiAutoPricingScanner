import { Link } from 'react-router-dom';

const CATEGORIES = [
  { id: 'cards', label: 'Trading Cards', icon: '🃏', description: 'Sports, Pokémon, Magic, Yu-Gi-Oh' },
  { id: 'sports', label: 'Sports Memorabilia', icon: '⚾', description: 'Signed items, equipment, trophies' },
  { id: 'collectibles', label: 'Collectibles', icon: '🏆', description: 'Funko, comics, figurines, coins' },
  { id: 'vintage', label: 'Vintage Items', icon: '🏺', description: 'Antiques, retro, art deco' },
];

const STEPS = [
  { step: '1', title: 'Scan Item', desc: 'Take a photo or upload an image of your item', icon: '📸' },
  { step: '2', title: 'AI Identifies', desc: 'Our AI precisely identifies the item and finds exact matches', icon: '🤖' },
  { step: '3', title: 'Get Real Prices', desc: 'See what buyers are actually paying on eBay, TCGPlayer & more', icon: '💰' },
  { step: '4', title: 'List & Sell', desc: 'Post your item at the market price. 5% fee applies on sale', icon: '🛍️' },
];

export default function HomePage() {
  return (
    <div className="space-y-8 animate-slide-up">
      {/* Hero */}
      <div className="camera-area rounded-3xl p-8 text-white text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2">AI Pricing Scanner</h1>
        <p className="text-white/80 text-sm mb-6">
          Scan any collectible, card, or vintage item and instantly see what buyers are paying — not asking prices.
        </p>
        <Link to="/scan" className="inline-block bg-white text-brand-700 font-bold px-8 py-3 rounded-xl text-lg hover:bg-gray-50 transition-colors">
          Start Scanning
        </Link>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">How It Works</h2>
        <div className="grid grid-cols-2 gap-3">
          {STEPS.map(({ step, title, desc, icon }) => (
            <div key={step} className="card p-4">
              <div className="text-3xl mb-2">{icon}</div>
              <div className="text-xs font-bold text-brand-600 mb-1">STEP {step}</div>
              <div className="font-semibold text-sm text-gray-900 mb-1">{title}</div>
              <div className="text-xs text-gray-500">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Categories</h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(({ id, label, icon, description }) => (
            <Link
              key={id}
              to={`/marketplace?category=${id}`}
              className="card p-4 hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-2">{icon}</div>
              <div className="font-semibold text-sm text-gray-900">{label}</div>
              <div className="text-xs text-gray-500 mt-1">{description}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Marketplace CTA */}
      <div className="card p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Browse Marketplace</h3>
            <p className="text-sm text-gray-600 mt-1">
              Buy from sellers using AI-verified prices
            </p>
          </div>
          <Link
            to="/marketplace"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            Browse →
          </Link>
        </div>
      </div>

      {/* Fee disclosure */}
      <div className="text-center text-xs text-gray-400 pb-4">
        <p>5% platform fee charged on completed sales</p>
        <p className="mt-1">Prices sourced from eBay sold listings, PriceCharting, TCGPlayer & more</p>
      </div>
    </div>
  );
}
