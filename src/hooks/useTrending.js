import { useState, useEffect, useCallback, useRef } from 'react';
import { cryptoService } from '../services/cryptoService';

export const useTrending = (pollIntervalMs = 60000) => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);

  const isMountedRef = useRef(true);
  const currentRequestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadTrending = useCallback(async (isPoll = false) => {
    const isInitial = trending.length === 0 && !isPoll;
    
    if (isInitial || !isPoll) {
      setLoading(true);
      setError(null);
    }
    setIsFetching(true);
    
    const requestId = ++currentRequestIdRef.current;
    
    try {
      const response = await cryptoService.getTrendingCoins();
      
      if (!isMountedRef.current || requestId !== currentRequestIdRef.current) return;

      if (response.data && response.data.length > 0) {
        setTrending(response.data);
        setIsStale(response.isCached);
        if (response.error) {
          if (import.meta.env.DEV) console.warn("[useTrending] Fetch error, using cache:", response.error);
          setError(response.error);
        } else {
          setError(null);
        }
      } else if (response.error && trending.length === 0) {
        setError(response.error);
      }
    } catch (err) {
      if (isMountedRef.current && requestId === currentRequestIdRef.current && trending.length === 0) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current && requestId === currentRequestIdRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [trending.length]);

  useEffect(() => {
    loadTrending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isFetching && !loading) {
        loadTrending(true);
      }
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [loadTrending, pollIntervalMs, isFetching, loading]);

  return { trending, loading, isFetching, error, isStale, retry: () => loadTrending() };
};
