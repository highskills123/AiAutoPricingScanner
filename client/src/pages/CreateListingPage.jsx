import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useSession } from '../context/SessionContext';

const CATEGORIES = ['cards', 'sports', 'collectibles', 'vintage'];
const CONDITIONS = [
  { value: 'mint', label: 'Mint / Gem Mint' },
  { value: 'near-mint', label: 'Near Mint' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'used', label: 'Used / Ungraded' },
];

const PLATFORM_FEE_RATE = 0.05;

export default function CreateListingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useSession();
  const preScan = location.state?.scan;

  const [form, setForm] = useState({
    title: preScan?.itemName || '',
    description: '',
    category: preScan?.category || 'collectibles',
    condition: 'used',
    askingPrice: preScan?.pricing?.recommendedPrice?.toFixed(2) || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const platformFee = form.askingPrice
    ? Math.round(parseFloat(form.askingPrice) * PLATFORM_FEE_RATE * 100) / 100
    : 0;
  const youReceive = form.askingPrice
    ? Math.round((parseFloat(form.askingPrice) - platformFee) * 100) / 100
    : 0;

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.category || !form.askingPrice) {
      setError('Please fill in all required fields');
      return;
    }

    const price = parseFloat(form.askingPrice);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        sessionId,
        scanId: preScan?.scanId,
        title: form.title,
        description: form.description,
        category: form.category,
        condition: form.condition,
        askingPrice: price,
        scannedPrice: preScan?.pricing?.recommendedPrice || price,
        imageUrl: preScan?.imageUrl,
        specifics: preScan?.specifics,
        pricingSources: preScan?.pricing?.sources || [],
      };

      const response = await api.post('/marketplace', payload);

      setSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-5 animate-slide-up">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900">Listed!</h2>
        <div className="card p-5 w-full text-center space-y-2">
          <p className="text-gray-600">{success.title}</p>
          <p className="text-3xl font-bold text-brand-700">${success.askingPrice?.toFixed(2)}</p>
          <p className="text-sm text-gray-500">
            Platform fee: ${success.platformFee?.toFixed(2)} · You receive: ${success.sellerReceives?.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Link to="/marketplace" className="btn-primary text-center">
            View Marketplace
          </Link>
          <Link to="/my-listings" className="btn-secondary text-center">
            My Listings
          </Link>
          <Link to="/scan" className="btn-secondary text-center">
            Scan Another Item
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Listing</h1>
      </div>

      {/* Scan preview */}
      {preScan && (
        <div className="card p-4 bg-brand-50 border-brand-100">
          <div className="flex items-center gap-3">
            {preScan.imageUrl && (
              <img src={preScan.imageUrl} alt="Scanned" className="w-16 h-16 object-cover rounded-lg" />
            )}
            <div>
              <div className="text-xs font-semibold text-brand-600 uppercase tracking-wide">From Scan</div>
              <div className="font-semibold text-gray-900 text-sm">{preScan.itemName}</div>
              <div className="text-sm text-brand-700 font-bold">
                AI Price: ${preScan.pricing?.recommendedPrice?.toFixed(2) || '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g. 2003 Topps Chrome LeBron James #111 Rookie"
            className="input"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="select"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Condition</label>
          <select
            value={form.condition}
            onChange={(e) => handleChange('condition', e.target.value)}
            className="select"
          >
            {CONDITIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Asking Price (USD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.askingPrice}
              onChange={(e) => handleChange('askingPrice', e.target.value)}
              placeholder="0.00"
              className="input pl-8"
              required
            />
          </div>

          {/* Fee breakdown */}
          {form.askingPrice && parseFloat(form.askingPrice) > 0 && (
            <div className="mt-2 p-3 bg-gray-50 rounded-xl text-sm space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Platform fee (5%)</span>
                <span>-${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1">
                <span>You receive</span>
                <span className="text-green-600">${youReceive.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Add any additional details about the item..."
            rows={3}
            className="input resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Listing...
            </>
          ) : (
            <>🏪 List on Marketplace</>
          )}
        </button>
      </form>

      <p className="text-xs text-center text-gray-400">
        By listing, you agree to the 5% platform fee on sale. Prices are AI-verified from live market data.
      </p>
    </div>
  );
}
