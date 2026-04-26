const COINGECKO_BASE_URL = '/api';
const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY || '';

// Basic in-memory cache: { url: { data, timestamp } }
const cache = {};

/**
 * Core API call wrapper with retry logic, caching, and error handling.
 */
const apiCall = async (endpoint, options = {}, retries = 2, backoff = 500) => {
  const url = endpoint.startsWith('http') ? endpoint : `${COINGECKO_BASE_URL}${endpoint}`;
  
  const headers = { ...options?.headers };
  if (API_KEY) {
    // Note: Use 'x-cg-pro-api-key' and 'pro-api.coingecko.com' for Pro keys
    headers['x-cg-demo-api-key'] = API_KEY;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.ok) {
      const result = await response.json();
      if (!result) {
        throw new Error('Received empty data from API');
      }
      cache[url] = { data: result, timestamp: Date.now() };
      return { data: result, error: null };
    }

    // Handle non-OK responses
    let errorMessage = `API call failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.status?.error_message) {
        errorMessage = errorData.status.error_message;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch (_) {
      // Body is not JSON or couldn't be parsed
      errorMessage = `${errorMessage}: ${response.statusText}`;
    }

    if (response.status === 429) {
      if (retries > 0) {
        const delay = Math.max(backoff * 2, 5000);
        if (import.meta.env.DEV) {
          console.warn(`Rate limited on ${url}. Retrying in ${delay}ms...`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        return apiCall(endpoint, options, retries - 1, delay);
      }
      throw new Error('Rate limit exceeded. Please wait a moment.');
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authentication Error: ${errorMessage}. Please check your API key status.`);
    }

    throw new Error(errorMessage);
  } catch (error) {
    if (error.name === 'AbortError') {
      return { data: null, error: 'Request was cancelled' };
    }
    
    // "Failed to fetch" often masks a 429 (Rate Limit) error from CoinGecko 
    // because their 429 responses sometimes lack CORS headers.
    if (error.message === 'Failed to fetch') {
      return { data: null, error: 'CoinGecko API rate limit reached. Please wait 1-2 minutes or add an API key.' };
    }

    if (import.meta.env.DEV) {
      console.error(`Error fetching data from ${url}:`, error);
    }
    return { data: null, error: error?.message || 'An unknown network error occurred' };
  }
};

export const cryptoService = {
  getTopCryptos: async (limit = 20, currency = 'usd', signal) => {
    const endpoint = `/coins/markets?vs_currency=${currency.toLowerCase()}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    const response = await apiCall(endpoint, { signal });
    
    if (response.data && !Array.isArray(response.data)) {
        return { data: [], error: 'Invalid response format: Expected array of coins.' };
    }
    
    if (!response.data) {
        response.data = [];
    }
    
    return response;
  },

  getCoinHistory: async (coinId, currency = 'usd', days = 7, signal) => {
    const endpoint = `/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=${currency.toLowerCase()}&days=${days}`;
    const response = await apiCall(endpoint, { signal });
    
    if (response.data) {
      if (!response.data.prices || !Array.isArray(response.data.prices)) {
         return { data: [], error: 'Invalid response format: Missing price data.' };
      }
      return { data: response.data.prices, error: response.error };
    }
    
    response.data = [];
    return response;
  },

  getCoinDetails: async (coinId, signal) => {
    const endpoint = `/coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    return await apiCall(endpoint, { signal });
  },

  getGlobalStats: async (signal) => {
    const endpoint = `/global`;
    const response = await apiCall(endpoint, { signal });
    
    if (response.data) {
      if (!response.data.data) {
         return { data: null, error: 'Invalid response format: Missing global stats.' };
      }
      return { data: response.data.data, error: response.error };
    }
    
    return response;
  },

  getTrendingCoins: async (signal) => {
    const endpoint = `/search/trending`;
    const response = await apiCall(endpoint, { signal });
    
    if (response.data) {
       if (!response.data.coins || !Array.isArray(response.data.coins)) {
          return { data: [], error: 'Invalid response format: Missing trending coins.' };
       }
       return { data: response.data.coins, error: response.error };
    }
    
    response.data = [];
    return response;
  },

  getOHLC: async (coinId, currency = 'usd', days = 7, signal) => {
    // CoinGecko OHLC supports: 1, 7, 14, 30, 90, 180, 365
    // If days is not supported, we'll use the nearest supported value
    const supportedDays = [1, 7, 14, 30, 90, 180, 365];
    const targetDays = supportedDays.find(d => d >= days) || 365;
    
    const endpoint = `/coins/${encodeURIComponent(coinId)}/ohlc?vs_currency=${currency.toLowerCase()}&days=${targetDays}`;
    const response = await apiCall(endpoint, { signal });
    
    if (response.data) {
      if (!Array.isArray(response.data)) {
        return { data: [], error: 'Invalid response format: Expected array of OHLC data.' };
      }
      // Format: [ [time, open, high, low, close], ... ]
      return { data: response.data, error: response.error };
    }
    
    response.data = [];
    return response;
  }
};

export default cryptoService;
