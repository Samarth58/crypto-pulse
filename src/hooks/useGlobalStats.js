import { useState, useEffect, useCallback, useRef } from 'react';
import { cryptoService } from '../services/cryptoService';

export const useGlobalStats = (pollIntervalMs = 60000) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  
  const statsRef = useRef(stats);
  const isPollingRef = useRef(false);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const loadStats = useCallback(async (signal, isPoll = false) => {
    if (isPoll) {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
    }

    if (!statsRef.current) {
      setLoading(true);
    }
    
    setIsFetching(true);
    
    const { data, error: fetchError } = await cryptoService.getGlobalStats(signal);

    if (signal?.aborted) {
      if (isPoll) isPollingRef.current = false;
      return;
    }
    
    if (fetchError) {
      if (fetchError === 'Request was cancelled') {
        if (isPoll) isPollingRef.current = false;
        setIsFetching(false);
        return;
      }
      if (import.meta.env.DEV) {
        console.error("Global Stats Error:", fetchError);
      }
      setError(fetchError);
    } else if (data) {
      // SUCCESS: data is valid, update stats and clear any previous error
      const hasChanged = !statsRef.current ||
        data.total_market_cap?.usd !== statsRef.current.total_market_cap?.usd ||
        data.total_volume?.usd !== statsRef.current.total_volume?.usd ||
        data.market_cap_percentage?.btc !== statsRef.current.market_cap_percentage?.btc;

      if (hasChanged) {
        setStats(data);
      }
      setError(null);
    } else {
      // data is null and no error string — treat as empty
      setError('Market metrics unavailable');
    }
    
    setLoading(false);
    setIsFetching(false);
    if (isPoll) isPollingRef.current = false;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadStats(controller.signal);
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const pollController = new AbortController();
        loadStats(pollController.signal, true);
      }
    }, pollIntervalMs); 

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [loadStats, pollIntervalMs]); 

  const retry = useCallback(() => {
    setError(null);
    const controller = new AbortController();
    loadStats(controller.signal);
  }, [loadStats]);

  return { stats, loading, isFetching, error, retry };
};
