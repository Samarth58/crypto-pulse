import { useState, useEffect, useRef, useCallback } from 'react';
import { cryptoService } from '../services/cryptoService';

const CACHE_TTL = 120000;

export const useCryptoData = (currency = 'usd', pollIntervalMs = 60000) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const dataRef = useRef(data);
  const multiCurrencyCacheRef = useRef({});
  const abortControllerRef = useRef(null);
  const pageRef = useRef(1);
  const isPollingRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const hasDataChanged = (newData, oldData) => {
    if (!oldData || newData.length !== oldData.length) return true;
    // O(n) shallow comparison of key financial fields
    for (let i = 0; i < newData.length; i++) {
      if (
        newData[i].id !== oldData[i].id ||
        newData[i].current_price !== oldData[i].current_price ||
        newData[i].price_change_percentage_24h !== oldData[i].price_change_percentage_24h
      ) {
        return true;
      }
    }
    return false;
  };

  const loadData = useCallback(async (targetPage = 1, isPoll = false, signal) => {
    if (isPoll) {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
    } else {
      if (targetPage === 1 && dataRef.current.length === 0) setLoading(true);
      else if (targetPage > 1) setIsFetchingMore(true);
    }
    
    setIsFetching(true);

    if (targetPage === 1 && !isPoll) {
      const cached = multiCurrencyCacheRef.current[currency];
      const isFresh = cached && (new Date() - cached.timestamp < CACHE_TTL);
      if (isFresh) {
        setData(cached.data);
        setLastUpdated(cached.timestamp);
        setLoading(false);
        setIsFetching(false);
        setError(null);
        setIsRateLimited(false);
        return;
      }
    }

    const { data: resultData, error: fetchError } = await cryptoService.getTopCryptos(20 * targetPage, currency, signal);

    if (fetchError) {
      if (fetchError === 'Request was cancelled') {
        if (isPoll) isPollingRef.current = false;
        setIsFetching(false);
        return;
      }
      
      if (import.meta.env.DEV) {
        console.error(`Fetch Error [${currency}]:`, fetchError);
      }
      if (fetchError.includes('rate limit')) setIsRateLimited(true);
      
      if (resultData && resultData.length > 0) {
         if (hasDataChanged(resultData, dataRef.current)) {
           setData(resultData);
         }
      }
      setError(fetchError);
    } else {
      if (hasDataChanged(resultData, dataRef.current)) {
        setData(resultData);
      }
      
      multiCurrencyCacheRef.current[currency] = {
        data: resultData,
        timestamp: new Date()
      };

      setLastUpdated(new Date());
      setError(null);
      setIsRateLimited(false);
    }

    if (!signal || !signal.aborted) {
      setLoading(false);
      setIsFetching(false);
      setIsFetchingMore(false);
      if (isPoll) isPollingRef.current = false;
    }
  }, [currency]);

  useEffect(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setPage(1);
    loadData(1, false, controller.signal);

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [currency, loadData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const pollController = new AbortController();
        loadData(pageRef.current, true, pollController.signal);
      }
    }, pollIntervalMs);

    return () => clearInterval(intervalId);
  }, [pollIntervalMs, loadData]);

  const loadMore = () => {
    if (isFetchingMore || data.length >= 250) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, false);
  };

  const retry = () => {
    setError(null);
    loadData(page, false);
  };

  // Add visual indicator for data refresh
  useEffect(() => {
    if (isFetching) {
      setLastUpdated(new Date());
    }
  }, [isFetching]);

  return { 
    data, loading, isFetching, error, lastUpdated, isRateLimited, 
    loadMore, isFetchingMore, hasMore: data.length < 250, retry
  };
};
