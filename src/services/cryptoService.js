const COINGECKO_BASE_URL = '/api';
const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY || '';

// Per-URL versioning to allow concurrent requests to different endpoints
const urlVersions = new Map();

// Cache: { url: { data, timestamp } }
const cache = {};

// Cache duration (60 seconds)
const CACHE_DURATION = 60000;

/**
 * Standardized response formatter
 */
const formatResponse = (data, error = null, url = null, version = 0) => {
  const cached = url ? cache[url] : null;
  return {
    data: data || (cached ? cached.data : null),
    error,
    isStale: !!(!data && cached),
    timestamp: cached ? cached.timestamp : Date.now(),
    version: version || (url ? (urlVersions.get(url) || 0) : 0),
    isOutdated: false
  };
};

/**
 * Core API call wrapper with retry logic, caching, and versioning.
 */
const apiCall = async (endpoint, options = {}, retries = 3, backoff = 1000) => {
  const url = endpoint.startsWith('http') ? endpoint : `${COINGECKO_BASE_URL}${endpoint}`;
  
  // Increment version for THIS specific URL
  const currentVersion = (urlVersions.get(url) || 0) + 1;
  urlVersions.set(url, currentVersion);
  
  // 1. Check Cache for freshness (Bypass if forceRefresh is true)
  if (options.forceRefresh) {
    delete cache[url];
  } else {
    const cached = cache[url];
    const now = Date.now();
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      return formatResponse(cached.data, null, url, currentVersion);
    }
  }

  const headers = { ...options?.headers };
  if (API_KEY) {
    headers['x-cg-demo-api-key'] = API_KEY;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if this request is still the latest for THIS URL
    if (currentVersion < (urlVersions.get(url) || 0)) {
      return { isOutdated: true };
    }

    if (response.ok) {
      const result = await response.json();
      if (!result) throw new Error('Empty API response');
      
      // Update cache
      cache[url] = { data: result, timestamp: Date.now() };
      return formatResponse(result, null, url, currentVersion);
    }

    // Handle Rate Limiting (429)
    if (response.status === 429) {
      if (retries > 0) {
        const delay = Math.min(backoff * 2, 8000); // Max 8s backoff
        if (import.meta.env.DEV) console.warn(`[cryptoService] 429 Rate Limit. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        return apiCall(endpoint, options, retries - 1, delay);
      }
      throw new Error('API Rate limit reached. Using cached data.');
    }

    let errorMessage = `API ${response.status}`;
    try {
      const err = await response.json();
      errorMessage = err.status?.error_message || err.error || errorMessage;
    } catch (_) {}
    throw new Error(errorMessage);

  } catch (error) {
    if (import.meta.env.DEV) console.error(`[cryptoService] Error:`, error.message);
    return formatResponse(null, error.message || 'Network error', url, currentVersion);
  }
};

export const cryptoService = {
  getTopCryptos: async (limit = 20, currency = 'usd', options = {}) => {
    const endpoint = `/coins/markets?vs_currency=${currency.toLowerCase()}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    const res = await apiCall(endpoint, options);
    return { ...res, data: Array.isArray(res.data) ? res.data : [] };
  },

  getCoinHistory: async (coinId, currency = 'usd', days = 7, options = {}) => {
    const endpoint = `/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=${currency.toLowerCase()}&days=${days}`;
    const res = await apiCall(endpoint, options);
    return { ...res, data: res.data?.prices || [] };
  },

  getCoinDetails: async (coinId, options = {}) => {
    const endpoint = `/coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    return await apiCall(endpoint, options);
  },

  getGlobalStats: async (options = {}) => {
    const res = await apiCall(`/global`, options);
    return { ...res, data: res.data?.data || null };
  },

  getTrendingCoins: async (options = {}) => {
    const res = await apiCall(`/search/trending`, options);
    return { ...res, data: res.data?.coins || [] };
  },

  getOHLC: async (coinId, currency = 'usd', days = 7, options = {}) => {
    const supportedDays = [1, 7, 14, 30, 90, 180, 365];
    const targetDays = supportedDays.find(d => d >= days) || 365;
    const endpoint = `/coins/${encodeURIComponent(coinId)}/ohlc?vs_currency=${currency.toLowerCase()}&days=${targetDays}`;
    const res = await apiCall(endpoint, options);
    return { ...res, data: Array.isArray(res.data) ? res.data : [] };
  }
};

export default cryptoService;