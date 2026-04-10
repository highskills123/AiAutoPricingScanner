import { Link } from 'react-router-dom';

const CATEGORY_CONFIG = {
  cards: {
    label: 'Cards',
    color: 'bg-blue-100 text-blue-700',
    icon: '🃏',
  },
  collectibles: {
    label: 'Collectibles',
    color: 'bg-purple-100 text-purple-700',
    icon: '🏆',
  },
  vintage: {
    label: 'Vintage',
    color: 'bg-amber-100 text-amber-700',
    icon: '🏺',
  },
  sports: {
    label: 'Sports',
    color: 'bg-green-100 text-green-700',
    icon: '⚾',
  },
};

export default function ListingCard({ listing }) {
  const config = CATEGORY_CONFIG[listing.category] || CATEGORY_CONFIG.collectibles;

  const imageSrc = listing.image_url
    ? listing.image_url.startsWith('http')
      ? listing.image_url
      : listing.image_url
    : null;

  return (
    <Link to={`/marketplace/${listing.id}`} className="card block hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={listing.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center text-5xl ${!imageSrc ? 'flex' : 'hidden'}`}
          style={{ display: imageSrc ? 'none' : 'flex' }}
        >
          {config.icon}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
            {listing.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className={`badge ${config.color}`}>
            {config.icon} {config.label}
          </span>
          {listing.condition && (
            <span className="badge bg-gray-100 text-gray-600">
              {listing.condition}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">
              ${listing.asking_price?.toFixed(2)}
            </span>
            <div className="text-xs text-gray-400">
              + ${listing.platform_fee?.toFixed(2)} platform fee
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
