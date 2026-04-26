import React, { createContext, useContext, useState, useCallback } from 'react';

const CoinContext = createContext();

export const useCoinContext = () => {
  const context = useContext(CoinContext);
  if (!context) {
    throw new Error('useCoinContext must be used within a CoinProvider');
  }
  return context;
};

export const CoinProvider = ({ children }) => {
  const [selectedCoinId, setSelectedCoinId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback((coinId) => {
    setSelectedCoinId(coinId);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // Add a slight delay before clearing selectedCoinId to allow exit animations
    setTimeout(() => setSelectedCoinId(null), 300);
  }, []);

  const value = {
    selectedCoinId,
    isModalOpen,
    openModal,
    closeModal,
  };

  return <CoinContext.Provider value={value}>{children}</CoinContext.Provider>;
};
