import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const PortfolioContext = createContext();

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider = ({ children }) => {
  // portfolio is an object mapping coinId to quantity: { 'bitcoin': 0.5, 'ethereum': 2 }
  const [portfolio, setPortfolio] = useState(() => {
    try {
      const saved = localStorage.getItem('crypto_portfolio');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to parse portfolio from localStorage:', error);
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('crypto_portfolio', JSON.stringify(portfolio));
    } catch (error) {
       if (import.meta.env.DEV) {
          console.error('Failed to save portfolio to localStorage:', error);
       }
    }
  }, [portfolio]);

  const updateQuantity = useCallback((id, quantity) => {
    setPortfolio((prev) => {
      const parsedQty = parseFloat(quantity);
      if (isNaN(parsedQty) || parsedQty < 0) {
         return prev; // Ignore invalid inputs, though UI allows typing
      }
      return prev.map(item => 
        item.coinId === id ? { ...item, quantity: parsedQty } : item
      );
    });
  }, []);

  const removeAsset = useCallback((id) => {
    setPortfolio((prev) => prev.filter(item => item.coinId !== id));
  }, []);

  const addAsset = useCallback((id) => {
    setPortfolio((prev) => {
      if (!prev.find(item => item.coinId === id)) {
        return [...prev, { coinId: id, quantity: 1 }];
      }
      return prev;
    });
  }, []);

  const value = {
    portfolio,
    updateQuantity,
    removeAsset,
    addAsset,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
};
