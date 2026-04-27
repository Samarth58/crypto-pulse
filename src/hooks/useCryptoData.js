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

  const isMountedRef = useRef(true);
  const currentRequestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadData = useCallback(async (targetPage = 1, isPoll = false) => {
    const isInitial = targetPage === 1 && data.length === 0 && !isPoll;
    
    if (isInitial || (!isPoll && targetPage === 1)) {
      setLoading(true);
      setError(null);
    }
    
    if (targetPage > 1) setIsFetchingMore(true);
    else setIsFetching(true);

    const requestId = ++currentRequestIdRef.current;

    try {
      const response = await cryptoService.getTopCryptos(20 * targetPage, currency);

      if (!isMountedRef.current || requestId !== currentRequestIdRef.current) return;

      if (response.data && response.data.length > 0) {
        setData(response.data);
        setLastUpdated(response.timestamp);
        setIsStale(response.isCached);
        
        if (response.error) {
          if (import.meta.env.DEV) console.warn("[useCryptoData] Fetch error, using cache:", response.error);
          setError(response.error);
        } else {
          setError(null);
        }
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      if (isMountedRef.current && requestId === currentRequestIdRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current && requestId === currentRequestIdRef.current) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
