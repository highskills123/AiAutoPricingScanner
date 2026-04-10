const SOURCE_COLORS = {
  'eBay Sold Listings': 'bg-yellow-50 border-yellow-200',
  'PriceCharting': 'bg-blue-50 border-blue-200',
  'TCGPlayer': 'bg-purple-50 border-purple-200',
  'Discogs': 'bg-green-50 border-green-200',
};

const SOURCE_ICONS = {
  'eBay Sold Listings': '🏷️',
  'PriceCharting': '📊',
  'TCGPlayer': '🃏',
  'Discogs': '🎵',
};

export default function PricingTable({ pricing, itemName }) {
  if (!pricing) return null;

  const realSources = pricing.sources?.filter((s) => !s.isReferenceOnly && s.averagePrice);
  const refSources = pricing.sources?.filter((s) => s.isReferenceOnly);

  return (
    <div className="space-y-4">
      {/* Summary price */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-5 text-white">
        <div className="text-sm opacity-80 mb-1">
          {pricing.demoMode ? '⚡ Demo Price (configure API keys for live data)' : 'Market Value — What Buyers Are Paying'}
        </div>
        <div className="text-4xl font-bold mb-1">
          ${pricing.recommendedPrice?.toFixed(2)}
        </div>
        <div className="text-sm opacity-80">
          Range: ${pricing.priceRange?.low?.toFixed(2)} – ${pricing.priceRange?.high?.toFixed(2)}
        </div>
        <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="opacity-70">Platform Fee (5%)</div>
            <div className="font-semibold">-${pricing.platformFee?.toFixed(2)}</div>
          </div>
          <div>
            <div className="opacity-70">You Receive</div>
            <div className="font-semibold text-green-300">${pricing.sellerReceives?.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Source breakdown */}
      {realSources && realSources.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Price Sources
          </h3>
          <div className="space-y-2">
            {realSources.map((source, idx) => (
              <div
                key={idx}
                className={`border rounded-xl p-3 ${SOURCE_COLORS[source.source] || 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{SOURCE_ICONS[source.source] || '💰'}</span>
                    <span className="font-semibold text-sm text-gray-800">
                      {source.source}
                    </span>
                  </div>
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View →
                  </a>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-bold text-gray-900">
                    ${source.averagePrice?.toFixed(2)}
                  </span>
                  {source.medianPrice && (
                    <span className="text-sm text-gray-500">
                      median: ${source.medianPrice?.toFixed(2)}
                    </span>
                  )}
                  {source.sampleSize && (
                    <span className="text-xs text-gray-400">
                      {source.sampleSize} sold
                    </span>
                  )}
                </div>

                {source.priceRange && (
                  <div className="text-xs text-gray-500 mt-1">
                    Range: ${source.priceRange.low?.toFixed(2)} – ${source.priceRange.high?.toFixed(2)}
                  </div>
                )}

                {/* Recent sales */}
                {source.recentSales && source.recentSales.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-medium text-gray-500">Recent Sales:</div>
                    {source.recentSales.slice(0, 3).map((sale, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate flex-1 mr-2">{sale.title}</span>
                        <span className="font-semibold text-gray-800 shrink-0">${sale.price?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reference sources */}
      {refSources && refSources.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Also Check
          </h3>
          <div className="flex flex-wrap gap-2">
            {refSources.map((source, idx) => (
              <a
                key={idx}
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>{SOURCE_ICONS[source.source] || '🔗'}</span>
                <span>{source.source}</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      {pricing.lastUpdated && (
        <p className="text-xs text-center text-gray-400">
          Updated {new Date(pricing.lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
