import { useState, useEffect, useCallback, useRef } from 'react';
import { cryptoService } from '../services/cryptoService';

export const useGlobalStats = (pollIntervalMs = 60000) => {
  const [stats, setStats] = useState(null);
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

  const loadStats = useCallback(async (isPoll = false) => {
    const isInitial = !stats && !isPoll;
    
    if (isInitial || !isPoll) {
      setLoading(true);
      setError(null);
    }
    setIsFetching(true);
    
    const requestId = ++currentRequestIdRef.current;
    
    try {
      const response = await cryptoService.getGlobalStats();

      if (!isMountedRef.current || requestId !== currentRequestIdRef.current) return;

      if (response.data) {
        setStats(response.data);
        setIsStale(response.isCached);
        
        if (response.error) {
          if (import.meta.env.DEV) console.warn("[useGlobalStats] Fetch error, using cache:", response.error);
          setError(response.error);
        } else {
          setError(null);
        }
      } else if (response.error && !stats) {
        setError(response.error);
      }
    } catch (err) {
      if (isMountedRef.current && requestId === currentRequestIdRef.current && !stats) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current && requestId === currentRequestIdRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [stats]);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isFetching && !loading) {
        loadStats(true);
      }
    }, pollIntervalMs); 

    return () => clearInterval(interval);
  }, [loadStats, pollIntervalMs, isFetching, loading]); 

  const retry = useCallback(() => {
    setError(null);
    loadStats();
  }, [loadStats]);

  return { stats, loading, isFetching, error, isStale, retry };
};
