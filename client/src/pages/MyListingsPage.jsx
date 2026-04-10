import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useSession } from '../context/SessionContext';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  sold: 'bg-blue-100 text-blue-700',
  removed: 'bg-gray-100 text-gray-500',
};

export default function MyListingsPage() {
  const { sessionId } = useSession();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;

    api.get('/marketplace/my/listings')
      .then((r) => setListings(r.data.listings || []))
      .catch(() => setError('Failed to load your listings'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleRemove = async (id) => {
    if (!confirm('Remove this listing?')) return;
    try {
      await api.delete(`/marketplace/${id}`);
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: 'removed' } : l))
      );
    } catch {
      alert('Failed to remove listing');
    }
  };

  const handleMarkSold = async (id) => {
    try {
      await api.patch(`/marketplace/${id}`, { status: 'sold' });
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: 'sold' } : l))
      );
    } catch {
      alert('Failed to update listing');
    }
  };

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

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Link to="/scan" className="text-sm text-brand-600 font-semibold hover:underline">
          + Scan & List
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {listings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏷️</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No Listings Yet</h2>
          <p className="text-gray-500 text-sm mb-6">
            Scan an item and list it on the marketplace!
          </p>
          <Link to="/scan" className="btn-primary inline-block">Scan Your First Item</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="card p-4">
              <div className="flex gap-3">
                {listing.image_url ? (
                  <img
                    src={listing.image_url}
                    alt={listing.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    🏷️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{listing.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge text-xs ${STATUS_COLORS[listing.status] || 'bg-gray-100 text-gray-500'}`}>
                      {listing.status}
                    </span>
                    <span className="text-sm font-bold text-brand-700">
                      ${listing.asking_price?.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Fee: ${listing.platform_fee?.toFixed(2)} · {new Date(listing.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {listing.status === 'active' && (
                <div className="flex gap-2 mt-3 border-t border-gray-100 pt-3">
                  <Link
                    to={`/marketplace/${listing.id}`}
                    className="flex-1 text-center text-sm text-brand-600 font-medium py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleMarkSold(listing.id)}
                    className="flex-1 text-center text-sm text-green-600 font-medium py-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    Mark Sold
                  </button>
                  <button
                    onClick={() => handleRemove(listing.id)}
                    className="flex-1 text-center text-sm text-red-600 font-medium py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
