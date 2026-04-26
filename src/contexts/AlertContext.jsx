import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AlertContext = createContext();

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('crypto_alerts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clean up expired alerts on load
          const now = Date.now();
          return parsed.filter(a => !a.expiryTime || a.expiryTime > now);
        }
      }
    } catch (error) {
      console.error('Failed to parse alerts:', error);
    }
    return [];
  });

  // Persist alerts
  useEffect(() => {
    localStorage.setItem('crypto_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Periodic cleanup of expired alerts (every 5 mins)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAlerts(prev => {
        const active = prev.filter(a => !a.expiryTime || a.expiryTime > now);
        return active.length !== prev.length ? active : prev;
      });
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const addAlert = useCallback((alertData) => {
    // alertData: { coinId, coinName, coinSymbol, type, targetValue, condition, repeat, durationMs, currency }
    const now = Date.now();
    const newAlert = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
      coinId: alertData.coinId,
      coinName: alertData.coinName,
      coinSymbol: alertData.coinSymbol,
      type: alertData.type || 'price', // 'price' | 'percentage'
      targetValue: parseFloat(alertData.targetValue),
      condition: alertData.condition, // 'above' | 'below'
      repeat: !!alertData.repeat,
      expiryTime: alertData.durationMs ? now + alertData.durationMs : null,
      currency: alertData.currency,
      isTriggered: false,
      createdAt: now
    };

    setAlerts((prev) => {
      // Prevent duplicates for same condition/target
      const isDuplicate = prev.some(
        (a) => a.coinId === newAlert.coinId && 
               a.type === newAlert.type &&
               a.condition === newAlert.condition && 
               a.targetValue === newAlert.targetValue &&
               a.currency === newAlert.currency &&
               !a.isTriggered
      );
      if (isDuplicate) return prev;
      return [...prev, newAlert];
    });
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const markAsTriggered = useCallback((id, shouldRepeat) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          // If repeat is true, don't mark as triggered (keep active)
          // or mark as triggered but allow re-check logic to handle it.
          // Requirement says: "keep active" if repeat is true.
          if (shouldRepeat) return a;
          return { ...a, isTriggered: true };
        }
        return a;
      })
    );
  }, []);

  const value = {
    alerts,
    addAlert,
    removeAlert,
    markAsTriggered,
  };

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};
