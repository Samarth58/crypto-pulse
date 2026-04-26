import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const WatchlistContext = createContext();

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('crypto_watchlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure it's an array and unique
        if (Array.isArray(parsed)) {
          return Array.from(new Set(parsed));
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to parse watchlist from localStorage:', error);
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('crypto_watchlist', JSON.stringify(watchlist));
    } catch (error) {
       if (import.meta.env.DEV) {
          console.error('Failed to save watchlist to localStorage:', error);
       }
    }
  }, [watchlist]);

  const addToWatchlist = useCallback((id) => {
    setWatchlist((prev) => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
  }, []);

  const removeFromWatchlist = useCallback((id) => {
    setWatchlist((prev) => prev.filter((coinId) => coinId !== id));
  }, []);

  const toggleWatchlist = useCallback((id) => {
     setWatchlist((prev) => {
        if (prev.includes(id)) {
           return prev.filter((coinId) => coinId !== id);
        } else {
           return [...prev, id];
        }
     });
  }, []);

  const isInWatchlist = useCallback((id) => {
    return watchlist.includes(id);
  }, [watchlist]);

  const value = {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
  };

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
};
