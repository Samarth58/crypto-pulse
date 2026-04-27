import { useState, useEffect, useRef, useCallback } from 'react';
import { cryptoService } from '../services/cryptoService';

export const useCryptoData = (currency = 'usd', pollIntervalMs = 60000) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const lastVersionRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadData = useCallback(async (targetPage = 1, isPoll = false) => {
    const isInitial = targetPage === 1 && data.length === 0 && !isPoll;
    const isManual = !isPoll;
    
    if (isInitial || isManual) {
      setLoading(true);
      setError(null);
    }
    
    if (targetPage > 1) setIsFetchingMore(true);
    else setIsFetching(true);

    try {
      const response = await cryptoService.getTopCryptos(20 * targetPage, currency, {
        forceRefresh: isManual
      });

      if (!isMountedRef.current || response.isOutdated) return;

      // Versioning Check
      if (response.version < lastVersionRef.current) return;
      lastVersionRef.current = response.version;

      if (response.data && response.data.length > 0) {
        setData(response.data);
        setLastUpdated(response.timestamp);
        setIsStale(response.isStale);
        
        if (!response.error) {
          setError(null);
        } else if (import.meta.env.DEV) {
          console.warn("[useCryptoData] Fetch had error but used cache:", response.error);
        }
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsFetching(false);
        setIsFetchingMore(false);
      }
    }
  }, [currency, data.length]);

  // Initial & Currency Change
  useEffect(() => {
    setPage(1);
    loadData(1, false);
  }, [currency]);

  // Polling
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && !isFetching && !loading) {
        loadData(page, true);
      }
    }, pollIntervalMs);

    return () => clearInterval(intervalId);
  }, [pollIntervalMs, loadData, isFetching, loading, page]);

  const loadMore = () => {
    if (isFetchingMore || isFetching || data.length >= 250) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, false);
  };

  const retry = () => {
    setError(null);
    loadData(page, false);
  };

  return { 
    data, loading, isFetching, error, lastUpdated, isStale,
    loadMore, isFetchingMore, hasMore: data.length < 250, retry
  };
};
