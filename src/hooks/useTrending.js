import { useState, useEffect, useCallback, useRef } from 'react';
import { cryptoService } from '../services/cryptoService';

export const useTrending = (pollIntervalMs = 60000) => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);

  const lastVersionRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadTrending = useCallback(async (isPoll = false) => {
    const isManual = !isPoll;
    if ((trending.length === 0 && !isPoll) || isManual) {
      setLoading(true);
      setError(null);
    }
    setIsFetching(true);
    
    try {
      const response = await cryptoService.getTrendingCoins({ forceRefresh: isManual });
      
      if (!isMountedRef.current || response.isOutdated) return;

      // Versioning Check
      if (response.version < lastVersionRef.current) return;
      lastVersionRef.current = response.version;

      if (response.data && response.data.length > 0) {
        setTrending(response.data);
        setIsStale(response.isStale);
        if (!response.error) {
          setError(null);
        }
      } else if (response.error && trending.length === 0) {
        setError(response.error);
      }
    } catch (err) {
      if (isMountedRef.current && trending.length === 0) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [trending.length]);

  useEffect(() => {
    loadTrending();
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
