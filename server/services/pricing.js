const axios = require('axios');

const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_FINDING_API_URL =
  'https://svcs.ebay.com/services/search/FindingService/v1';

// PriceCharting API - free endpoint for many collectibles/cards
const PRICECHARTING_API_URL = 'https://www.pricecharting.com/api/products';
const PRICECHARTING_API_KEY = process.env.PRICECHARTING_API_KEY;

// Discogs API - free for music/vinyl
const DISCOGS_API_URL = 'https://api.discogs.com/database/search';
const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;

const PLATFORM_FEE_RATE = 0.05; // 5%

/**
 * Get pricing from all available sources for the identified item.
 */
async function getPricing(itemName, category, specifics) {
  const results = await Promise.allSettled([
    getEbayPricing(itemName, specifics),
    getPriceChartingPricing(itemName, category, specifics),
    category === 'cards' || category === 'collectibles'
      ? getTCGPlayerPricing(itemName, specifics)
      : Promise.resolve(null),
    category === 'vintage' || category === 'collectibles'
      ? getDiscogsPricing(itemName, specifics)
      : Promise.resolve(null),
  ]);

  const sources = [];
  const prices = [];

  const [ebayResult, priceChartingResult, tcgResult, discogsResult] = results;

  if (ebayResult.status === 'fulfilled' && ebayResult.value) {
    sources.push(ebayResult.value);
    if (ebayResult.value.averagePrice) prices.push(ebayResult.value.averagePrice);
  }

  if (priceChartingResult.status === 'fulfilled' && priceChartingResult.value) {
    sources.push(priceChartingResult.value);
    if (priceChartingResult.value.averagePrice)
      prices.push(priceChartingResult.value.averagePrice);
  }

  if (tcgResult.status === 'fulfilled' && tcgResult.value) {
    sources.push(tcgResult.value);
    if (tcgResult.value.averagePrice) prices.push(tcgResult.value.averagePrice);
  }

  if (discogsResult.status === 'fulfilled' && discogsResult.value) {
    sources.push(discogsResult.value);
    if (discogsResult.value.averagePrice)
      prices.push(discogsResult.value.averagePrice);
  }

  // If no real data, use demo pricing
  if (prices.length === 0) {
    return getDemoPricing(itemName, category, specifics);
  }

  const averagePrice =
    prices.reduce((a, b) => a + b, 0) / prices.length;
  const recommendedPrice = Math.round(averagePrice * 100) / 100;
  const platformFee = Math.round(recommendedPrice * PLATFORM_FEE_RATE * 100) / 100;

  return {
    sources,
    averagePrice: recommendedPrice,
    recommendedPrice,
    platformFee,
    sellerReceives: Math.round((recommendedPrice - platformFee) * 100) / 100,
    currency: 'USD',
    priceRange: {
      low: Math.min(...prices),
      high: Math.max(...prices),
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * eBay Finding API — searches completed/sold listings for real buyer prices.
 * This is the most accurate signal of what buyers will pay.
 */
async function getEbayPricing(itemName, specifics) {
  if (!EBAY_APP_ID) {
    console.warn('[Pricing] No eBay App ID configured');
    return null;
  }

  try {
    // Build a precise search query
    const query = buildEbayQuery(itemName, specifics);

    // Search completed (sold) listings for buyer price signal
    const params = {
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': EBAY_APP_ID,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'keywords': query,
      'itemFilter(0).name': 'SoldItemsOnly',
      'itemFilter(0).value': 'true',
      'sortOrder': 'EndTimeSoonest',
      'paginationInput.entriesPerPage': '20',
    };

    if (specifics?.grade) {
      params['keywords'] += ` PSA ${specifics.grade}`;
    }

    const response = await axios.get(EBAY_FINDING_API_URL, {
      params,
      timeout: 10000,
    });

    const searchResult =
      response.data?.findCompletedItemsResponse?.[0]?.searchResult?.[0];
    const items = searchResult?.item || [];

    if (items.length === 0) return null;

    const soldPrices = items
      .map((item) => parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__))
      .filter((p) => !isNaN(p) && p > 0);

    if (soldPrices.length === 0) return null;

    // Sort and remove outliers (top/bottom 10%)
    const sorted = soldPrices.sort((a, b) => a - b);
    const trimCount = Math.max(1, Math.floor(sorted.length * 0.1));
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

    const averagePrice =
      trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    const medianPrice = trimmed[Math.floor(trimmed.length / 2)];

    return {
      source: 'eBay Sold Listings',
      sourceUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Complete=1&LH_Sold=1`,
      averagePrice: Math.round(averagePrice * 100) / 100,
      medianPrice: Math.round(medianPrice * 100) / 100,
      sampleSize: soldPrices.length,
      priceRange: {
        low: Math.min(...soldPrices),
        high: Math.max(...soldPrices),
      },
      recentSales: items.slice(0, 5).map((item) => ({
        title: item.title?.[0],
        price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__),
        date: item.listingInfo?.[0]?.endTime?.[0],
        url: item.viewItemURL?.[0],
      })),
    };
  } catch (err) {
    console.error('[Pricing] eBay error:', err.message);
    return null;
  }
}

/**
 * Build a precise eBay search query from item name and specifics.
 */
function buildEbayQuery(itemName, specifics) {
  const parts = [itemName];

  if (specifics?.year && !itemName.includes(specifics.year)) {
    parts.unshift(specifics.year);
  }
  if (specifics?.cardNumber && !itemName.includes('#' + specifics.cardNumber)) {
    parts.push(`#${specifics.cardNumber}`);
  }
  if (specifics?.isRookie && !/RC|rookie/i.test(itemName)) {
    parts.push('RC');
  }
  if (specifics?.printRun) {
    parts.push(`/${specifics.printRun}`);
  }

  return parts.join(' ').substring(0, 300);
}

/**
 * PriceCharting — covers video games, Pokémon, sports cards (free API).
 */
async function getPriceChartingPricing(itemName, category, specifics) {
  if (!PRICECHARTING_API_KEY) {
    // PriceCharting has a simple free endpoint without key for basic lookups
    try {
      const response = await axios.get('https://www.pricecharting.com/api/product', {
        params: { id: itemName },
        timeout: 8000,
      });
      if (response.data && response.data['loose-price']) {
        const price = response.data['loose-price'] / 100; // Stored in cents
        return {
          source: 'PriceCharting',
          sourceUrl: `https://www.pricecharting.com/search-products?q=${encodeURIComponent(itemName)}`,
          averagePrice: price,
          loosePrice: price,
          gradedPrice: response.data['graded-price']
            ? response.data['graded-price'] / 100
            : null,
          newPrice: response.data['new-price']
            ? response.data['new-price'] / 100
            : null,
        };
      }
    } catch {
      // Silently fail - PriceCharting is optional
    }
    return null;
  }

  try {
    const response = await axios.get(PRICECHARTING_API_URL, {
      params: {
        t: PRICECHARTING_API_KEY,
        q: itemName,
        status: 'match',
      },
      timeout: 8000,
    });

    const products = response.data?.products || [];
    if (products.length === 0) return null;

    const best = products[0];
    const price = (best['loose-price'] || best['complete-price'] || 0) / 100;

    if (price <= 0) return null;

    return {
      source: 'PriceCharting',
      sourceUrl: `https://www.pricecharting.com${best.id ? '/game/' + best.id : ''}`,
      averagePrice: Math.round(price * 100) / 100,
      loosePrice: best['loose-price'] ? best['loose-price'] / 100 : null,
      gradedPrice: best['graded-price'] ? best['graded-price'] / 100 : null,
    };
  } catch (err) {
    console.error('[Pricing] PriceCharting error:', err.message);
    return null;
  }
}

/**
 * TCGPlayer pricing via PriceCharting's aggregated data.
 */
async function getTCGPlayerPricing(itemName, specifics) {
  // TCGPlayer requires seller approval; we use the public search page
  // as a reference link, and note pricing from our other sources
  try {
    const searchQuery = itemName;
    return {
      source: 'TCGPlayer',
      sourceUrl: `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(searchQuery)}`,
      averagePrice: null, // Requires API key
      note: 'Visit TCGPlayer for current market prices',
      isReferenceOnly: true,
    };
  } catch {
    return null;
  }
}

/**
 * Discogs — for vinyl records and music memorabilia.
 */
async function getDiscogsPricing(itemName, specifics) {
  if (!DISCOGS_TOKEN) return null;

  try {
    const response = await axios.get(DISCOGS_API_URL, {
      params: {
        q: itemName,
        type: 'release',
        token: DISCOGS_TOKEN,
      },
      headers: {
        'User-Agent': 'AiAutoPricingScanner/1.0 +https://github.com/highskills123/AiAutoPricingScanner',
      },
      timeout: 8000,
    });

    const results = response.data?.results || [];
    if (results.length === 0) return null;

    const best = results[0];
    const lowestPrice = best.lowest_price;

    return {
      source: 'Discogs',
      sourceUrl: `https://www.discogs.com/search/?q=${encodeURIComponent(itemName)}`,
      averagePrice: lowestPrice || null,
      lowestPrice,
      numForSale: best.num_for_sale,
      title: best.title,
    };
  } catch (err) {
    console.error('[Pricing] Discogs error:', err.message);
    return null;
  }
}

/**
 * Demo pricing data when no API keys are configured.
 * Returns realistic-looking demo data so the UI is functional.
 */
function getDemoPricing(itemName, category, specifics) {
  const demoData = {
    cards: {
      averagePrice: 2450.0,
      sources: [
        {
          source: 'eBay Sold Listings',
          sourceUrl: 'https://www.ebay.com/sch/i.html?_nkw=2003+topps+chrome+lebron+james&LH_Sold=1',
          averagePrice: 2450.0,
          medianPrice: 2300.0,
          sampleSize: 18,
          priceRange: { low: 1800.0, high: 3200.0 },
          recentSales: [
            { title: '2003 Topps Chrome LeBron James #111 PSA 10', price: 3200.0, date: '2024-01-15' },
            { title: '2003 Topps Chrome LeBron James #111 PSA 9', price: 2100.0, date: '2024-01-12' },
            { title: '2003 Topps Chrome LeBron James #111 Raw', price: 850.0, date: '2024-01-10' },
          ],
        },
        {
          source: 'PriceCharting',
          sourceUrl: 'https://www.pricecharting.com/search-products?q=lebron+james+rookie',
          averagePrice: 2300.0,
          loosePrice: 900.0,
          gradedPrice: 2800.0,
        },
        {
          source: 'TCGPlayer',
          sourceUrl: 'https://www.tcgplayer.com/search/all/product?q=lebron+james',
          averagePrice: null,
          note: 'Visit TCGPlayer for current market prices',
          isReferenceOnly: true,
        },
      ],
    },
    collectibles: {
      averagePrice: 185.0,
      sources: [
        {
          source: 'eBay Sold Listings',
          sourceUrl: 'https://www.ebay.com/sch/i.html?LH_Sold=1',
          averagePrice: 185.0,
          medianPrice: 175.0,
          sampleSize: 12,
          priceRange: { low: 120.0, high: 280.0 },
          recentSales: [
            { title: 'Demo Collectible - Mint Condition', price: 200.0, date: '2024-01-14' },
            { title: 'Demo Collectible - Near Mint', price: 175.0, date: '2024-01-11' },
          ],
        },
      ],
    },
    vintage: {
      averagePrice: 320.0,
      sources: [
        {
          source: 'eBay Sold Listings',
          sourceUrl: 'https://www.ebay.com/sch/i.html?LH_Sold=1',
          averagePrice: 320.0,
          medianPrice: 295.0,
          sampleSize: 8,
          priceRange: { low: 180.0, high: 550.0 },
          recentSales: [
            { title: 'Vintage Item - Excellent Condition', price: 350.0, date: '2024-01-13' },
          ],
        },
      ],
    },
    sports: {
      averagePrice: 450.0,
      sources: [
        {
          source: 'eBay Sold Listings',
          sourceUrl: 'https://www.ebay.com/sch/i.html?LH_Sold=1',
          averagePrice: 450.0,
          medianPrice: 400.0,
          sampleSize: 6,
          priceRange: { low: 250.0, high: 800.0 },
          recentSales: [
            { title: 'Sports Memorabilia - Signed', price: 500.0, date: '2024-01-15' },
          ],
        },
      ],
    },
  };

  const data = demoData[category] || demoData.collectibles;
  const platformFee = Math.round(data.averagePrice * PLATFORM_FEE_RATE * 100) / 100;

  return {
    sources: data.sources,
    averagePrice: data.averagePrice,
    recommendedPrice: data.averagePrice,
    platformFee,
    sellerReceives: Math.round((data.averagePrice - platformFee) * 100) / 100,
    currency: 'USD',
    priceRange: {
      low: data.sources[0]?.priceRange?.low || data.averagePrice * 0.7,
      high: data.sources[0]?.priceRange?.high || data.averagePrice * 1.4,
    },
    lastUpdated: new Date().toISOString(),
    demoMode: true,
  };
}

module.exports = { getPricing, PLATFORM_FEE_RATE };
