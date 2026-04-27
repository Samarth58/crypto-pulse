import { useState, useEffect, useCallback, useRef } from 'react';
import { cryptoService } from '../services/cryptoService';

export const useGlobalStats = (pollIntervalMs = 60000) => {
  const [stats, setStats] = useState(null);
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

  const loadStats = useCallback(async (isPoll = false) => {
    const isManual = !isPoll;
    if ((!stats && !isPoll) || isManual) {
      setLoading(true);
      setError(null);
    }
    setIsFetching(true);
    
    try {
      const response = await cryptoService.getGlobalStats({ forceRefresh: isManual });

      if (!isMountedRef.current || response.isOutdated) return;

      // Versioning check
      if (response.version < lastVersionRef.current) return;
      lastVersionRef.current = response.version;

      if (response.data) {
        setStats(response.data);
        setIsStale(response.isStale);
        
        if (!response.error) {
          setError(null);
        }
      } else if (response.error && !stats) {
        setError(response.error);
      }
    } catch (err) {
      if (isMountedRef.current && !stats) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [stats]);

  useEffect(() => {
    loadStats();
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
