import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import PricingTable from '../components/PricingTable';

const CATEGORY_ICONS = {
  cards: '🃏', sports: '⚾', collectibles: '🏆', vintage: '🏺',
};

const CONDITION_LABELS = {
  mint: 'Mint',
  'near-mint': 'Near Mint',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  used: 'Used',
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bought, setBought] = useState(false);

  useEffect(() => {
    api.get(`/marketplace/${id}`)
      .then((r) => setListing(r.data))
      .catch(() => setError('Listing not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <svg className="animate-spin w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">😕</div>
        <p className="text-gray-600">{error}</p>
        <Link to="/marketplace" className="btn-primary mt-4 inline-block">Back to Marketplace</Link>
      </div>
    );
  }

  const icon = CATEGORY_ICONS[listing.category] || '🔍';
  const pricingSources = listing.pricing_sources || [];
  const totalWithFee = listing.asking_price + listing.platform_fee;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Image */}
      {listing.image_url ? (
        <div className="card overflow-hidden">
          <img src={listing.image_url} alt={listing.title} className="w-full max-h-80 object-contain bg-gray-50" />
        </div>
      ) : (
        <div className="card p-10 text-center text-6xl bg-gray-50">{icon}</div>
      )}

      {/* Info */}
      <div className="card p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${
              listing.category === 'cards' ? 'bg-blue-100 text-blue-700' :
              listing.category === 'sports' ? 'bg-green-100 text-green-700' :
              listing.category === 'vintage' ? 'bg-amber-100 text-amber-700' :
              'bg-purple-100 text-purple-700'
            } capitalize`}>
              {icon} {listing.category}
            </span>
            {listing.condition && (
              <span className="badge bg-gray-100 text-gray-600">
                {CONDITION_LABELS[listing.condition] || listing.condition}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{listing.title}</h1>
          {listing.description && (
            <p className="text-gray-600 text-sm mt-2">{listing.description}</p>
          )}
        </div>

        {/* Specifics */}
        {listing.specifics && Object.keys(listing.specifics).length > 0 && (
          <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-2">
            {Object.entries(listing.specifics).map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</div>
                <div className="text-sm font-semibold text-gray-800">
                  {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing breakdown */}
      <div className="card p-4 space-y-3">
        <h2 className="font-bold text-gray-900">Pricing</h2>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">AI-Verified Market Price</span>
            <span className="font-semibold">${listing.scanned_price?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Seller Asking Price</span>
            <span className="font-semibold">${listing.asking_price?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Platform Fee (5%)</span>
            <span>${listing.platform_fee?.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="font-bold text-gray-900">Total to Pay</span>
            <span className="font-bold text-brand-700 text-lg">${totalWithFee?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Pricing sources from scan */}
      {pricingSources && pricingSources.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Price Verification Sources</h2>
          <PricingTable
            pricing={{
              sources: pricingSources,
              recommendedPrice: listing.scanned_price,
              platformFee: listing.platform_fee,
              sellerReceives: listing.asking_price,
              priceRange: { low: listing.scanned_price * 0.8, high: listing.scanned_price * 1.2 },
            }}
          />
        </div>
      )}

      {/* Buy button */}
      {!bought && listing.status === 'active' && (
        <button
          onClick={() => setBought(true)}
          className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
        >
          <span>🛒</span>
          Buy for ${totalWithFee?.toFixed(2)}
        </button>
      )}

      {bought && (
        <div className="card p-6 text-center bg-green-50 border-green-100">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="font-bold text-green-800 text-lg">Purchase Requested!</h3>
          <p className="text-green-700 text-sm mt-1">
            The seller will be notified. Payment integration coming soon.
          </p>
          <Link to="/marketplace" className="btn-secondary mt-4 inline-block">
            Continue Browsing
          </Link>
        </div>
      )}

      <div className="text-center text-xs text-gray-400 pb-4">
        Listed {new Date(listing.created_at).toLocaleDateString()} · 
        AI-verified price from multiple market sources
      </div>
    </div>
  );
}
