import { useState, useEffect, useCallback, useRef } from 'react';
import { cryptoService } from '../services/cryptoService';

export const useTrending = (pollIntervalMs = 60000) => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);

  const trendingRef = useRef(trending);
  const isPollingRef = useRef(false);

  useEffect(() => {
    trendingRef.current = trending;
  }, [trending]);

  const loadTrending = useCallback(async (signal, isPoll = false) => {
    if (isPoll) {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
    }

    if (trendingRef.current.length === 0) {
      setLoading(true);
    }
    
    setIsFetching(true);
    
    const { data, error: fetchError } = await cryptoService.getTrendingCoins(signal);
    
    if (fetchError) {
      if (fetchError === 'Request was cancelled') {
        if (isPoll) isPollingRef.current = false;
        setIsFetching(false);
        return;
      }
      console.error("Trending Stats Error:", fetchError);
      setError(fetchError);
      
      if (data && data.length > 0) {
         if (trendingRef.current.length === 0 || data[0].item.id !== trendingRef.current[0].item.id) {
           setTrending(data);
         }
      }
    } else {
      // Basic check: only update if the top trending coin id changed to avoid re-renders
      if (trendingRef.current.length === 0 || data[0]?.item?.id !== trendingRef.current[0]?.item?.id) {
         setTrending(data);
      }
      setError(null);
    }
    
    if (!signal || !signal.aborted) {
      setLoading(false);
      setIsFetching(false);
      if (isPoll) isPollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadTrending(controller.signal);
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const pollController = new AbortController();
        loadTrending(pollController.signal, true);
      }
    }, pollIntervalMs);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [loadTrending, pollIntervalMs]);

  return { trending, loading, isFetching, error, retry: () => loadTrending() };
};
