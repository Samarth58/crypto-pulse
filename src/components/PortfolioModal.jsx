import React, { useState, useMemo } from 'react';
import { X, Wallet, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolio } from '../contexts/PortfolioContext';
import { formatCurrency, formatCompactNumber } from '../utils/formatters';
import PortfolioChart from './PortfolioChart';

const PortfolioModal = ({ isOpen, onClose, data, currency = 'usd' }) => {
  const { portfolio, updateQuantity, removeAsset, addAsset } = usePortfolio();
  const [selectedCoinId, setSelectedCoinId] = useState('');

  // Calculate portfolio totals
  const { totalValue, totalProfitLoss, portfolioAssets } = useMemo(() => {
    let val = 0;
    let pl = 0;
    const assets = [];

    if (!data) return { totalValue: 0, totalProfitLoss: 0, portfolioAssets: [] };

    // Create a map for quick lookup
    const coinMap = new Map(data.map((c) => [c.id, c]));

    portfolio.forEach(({ coinId, quantity }) => {
      const coin = coinMap.get(coinId);
      if (coin) {
        const assetValue = coin.current_price * quantity;
        const assetPl = (assetValue * (coin.price_change_percentage_24h || 0)) / 100;
        
        val += assetValue;
        pl += assetPl;
        assets.push({ id: coinId, qty: quantity, coin, assetValue, assetPl });
      }
    });

    return { totalValue: val, totalProfitLoss: pl, portfolioAssets: assets };
  }, [portfolio, data]);

  const handleAddAsset = () => {
    if (selectedCoinId && !portfolio.find(item => item.coinId === selectedCoinId)) {
      addAsset(selectedCoinId);
      setSelectedCoinId('');
    }
  };

  // Available coins to add (not already in portfolio)
  const availableCoins = useMemo(() => {
    if (!data) return [];
    return data.filter((c) => !portfolio.find(item => item.coinId === c.id));
  }, [data, portfolio]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Your Portfolio</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Totals Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                 <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Balance</span>
                 <div className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
                   {formatCurrency(totalValue, currency)}
                 </div>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                 <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">24h Profit/Loss</span>
                 <div className={`text-3xl font-bold mt-1 flex items-center gap-2 ${totalProfitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                   {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss, currency)}
                   {totalProfitLoss >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                 </div>
               </div>
            </div>

            {/* Portfolio Performance Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <PortfolioChart
                portfolioAssets={portfolioAssets}
                currency={currency}
              />
            </div>

            {/* Add Asset Section */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedCoinId}
                onChange={(e) => setSelectedCoinId(e.target.value)}
                className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a coin to add...</option>
                {availableCoins.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>
                ))}
              </select>
              <button
                onClick={handleAddAsset}
                disabled={!selectedCoinId}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
              >
                <Plus size={18} /> Add Asset
              </button>
            </div>

            {/* Asset List */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Your Assets</h3>
              {portfolioAssets.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Your portfolio is empty. Add an asset above to start tracking.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {portfolioAssets.map(({ id, qty, coin, assetValue, assetPl }) => (
                    <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      
                      <div className="flex items-center gap-3">
                        <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white">{coin.name}</div>
                          <div className="text-sm text-slate-500">{formatCurrency(coin.current_price, currency)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-slate-400 mb-1">Holdings</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={qty}
                            onChange={(e) => updateQuantity(id, e.target.value)}
                            className="w-24 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="flex flex-col items-end min-w-[100px]">
                          <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(assetValue, currency)}</span>
                          <span className={`text-xs font-medium flex items-center gap-1 ${assetPl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {assetPl >= 0 ? '+' : ''}{formatCurrency(assetPl, currency)}
                          </span>
                        </div>

                        <button
                          onClick={() => removeAsset(id)}
                          className="p-2 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors ml-2"
                          title="Remove from portfolio"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PortfolioModal;
