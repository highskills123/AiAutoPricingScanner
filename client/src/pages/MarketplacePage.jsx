import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import ListingCard from '../components/ListingCard';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🔍' },
  { id: 'cards', label: 'Cards', icon: '🃏' },
  { id: 'sports', label: 'Sports', icon: '⚾' },
  { id: 'collectibles', label: 'Collectibles', icon: '🏆' },
  { id: 'vintage', label: 'Vintage', icon: '🏺' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'oldest', label: 'Oldest First' },
];

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = { page, limit: 20, sort };
    if (category !== 'all') params.category = category;

    api.get('/marketplace', { params })
      .then((r) => {
        setListings(r.data.listings || []);
        setTotal(r.data.total || 0);
      })
      .catch(() => setError('Failed to load marketplace'))
      .finally(() => setLoading(false));
  }, [category, sort, page]);

  const handleCategory = (cat) => {
    const next = new URLSearchParams(searchParams);
    next.set('category', cat);
    setSearchParams(next);
    setPage(1);
  };

  const handleSort = (s) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', s);
    setSearchParams(next);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
        <span className="text-sm text-gray-500">{total} items</span>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => handleCategory(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              category === id
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex justify-end">
        <select
          value={sort}
          onChange={(e) => handleSort(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Listings grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-5 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🛍️</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No Listings Yet</h2>
          <p className="text-gray-500 text-sm mb-6">
            Be the first to scan an item and list it here!
          </p>
          <a href="/scan" className="btn-primary inline-block">Scan & List</a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary px-4 py-2 text-sm"
          >
            ← Prev
          </button>
          <span className="flex items-center text-sm text-gray-600">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Next →
          </button>
        </div>
      )}

      {/* Fee notice */}
      <div className="text-center text-xs text-gray-400 pb-4">
        All prices verified by AI scan. 5% platform fee on completed sales.
      </div>
    </div>
  );
}
