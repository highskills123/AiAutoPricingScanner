import { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import PricingTable from '../components/PricingTable';

const CATEGORY_ICONS = {
  cards: '🃏',
  sports: '⚾',
  collectibles: '🏆',
  vintage: '🏺',
};

export default function ResultsPage() {
  const { scanId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [scan, setScan] = useState(location.state?.scan || null);
  const [loading, setLoading] = useState(!scan);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!scan && scanId) {
      setLoading(true);
      api.get(`/scan/${scanId}`)
        .then((r) => setScan({
          ...r.data,
          itemName: r.data.identified_item,
          pricing: r.data.pricing_data,
        }))
        .catch(() => setError('Failed to load scan results'))
        .finally(() => setLoading(false));
    }
  }, [scanId, scan]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <svg className="animate-spin w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-gray-500">Loading results...</span>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">😕</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Results Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">{error || 'Could not load scan results'}</p>
        <Link to="/scan" className="btn-primary">Scan Again</Link>
      </div>
    );
  }

  const categoryIcon = CATEGORY_ICONS[scan.category] || '🔍';
  const confidence = scan.confidence ? Math.round(scan.confidence * 100) : null;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Scan Results</h1>
          {scan.demoMode && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              Demo Mode — Add API keys for live data
            </span>
          )}
        </div>
      </div>

      {/* Item image */}
      {scan.imageUrl && (
        <div className="card overflow-hidden">
          <img
            src={scan.imageUrl}
            alt={scan.itemName}
            className="w-full max-h-72 object-contain bg-gray-50"
          />
        </div>
      )}

      {/* Item identification */}
      <div className="card p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{categoryIcon}</span>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-lg leading-tight">
              {scan.itemName}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="badge bg-brand-100 text-brand-700 capitalize">
                {scan.category}
              </span>
              {confidence && (
                <span className={`badge ${confidence >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {confidence}% confident
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Specifics */}
        {scan.specifics && Object.keys(scan.specifics).length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Identified Details
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(scan.specifics).map(([key, val]) => (
                <div key={key} className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text found in image */}
        {scan.textFound && scan.textFound.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Text Found in Image
            </div>
            <div className="flex flex-wrap gap-1">
              {scan.textFound.map((t, i) => (
                <span key={i} className="badge bg-gray-100 text-gray-600">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pricing */}
      {scan.pricing ? (
        <PricingTable pricing={scan.pricing} itemName={scan.itemName} />
      ) : (
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">😕</div>
          <p className="text-gray-600 text-sm">Could not fetch pricing data at this time.</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Link
          to="/sell"
          state={{ scan }}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4"
        >
          <span>🏪</span>
          List on Marketplace for ${scan.pricing?.recommendedPrice?.toFixed(2) || '—'}
        </Link>
        <Link to="/scan" className="btn-secondary w-full flex items-center justify-center gap-2">
          <span>🔍</span>
          Scan Another Item
        </Link>
      </div>

      {/* Fee note */}
      {scan.pricing && (
        <p className="text-xs text-center text-gray-400">
          5% platform fee (${scan.pricing.platformFee?.toFixed(2)}) applied on marketplace sale.
          You receive ${scan.pricing.sellerReceives?.toFixed(2)}.
        </p>
      )}
    </div>
  );
}
