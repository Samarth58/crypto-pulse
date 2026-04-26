import React, { useState, useMemo, useCallback } from 'react';
import { Calculator, DollarSign, TrendingUp, TrendingDown, X } from 'lucide-react';
import { chartCache } from './CoinPriceChart';
import { cryptoService } from '../services/cryptoService';
import { formatCurrency } from '../utils/formatters';

const PERIODS = [
  { label: '7 Days', days: 7 },
  { label: '1 Month', days: 30 },
  { label: '1 Year', days: 365 },
];

const DCACalculator = ({ coinId, coinName, coinSymbol, currency = 'usd', currentPrice }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[1]);
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  const SYMBOLS = { usd: '$', eur: '€', inr: '₹' };
  const symbol = SYMBOLS[currency] || '$';

  const resetState = useCallback(() => {
    setMonthlyAmount('');
    setSelectedPeriod(PERIODS[1]);
    setResult(null);
    setError(null);
    setCalculating(false);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  const getHistoricalPrices = async (days) => {
    const cacheKey = `${coinId}-${currency}-${days}`;
    const cached = chartCache[cacheKey];
    if (cached && (new Date() - cached.timestamp < 300000)) {
      return cached.data.map(d => d.price);
    }

    // Fetch if not cached
    const { data, error: fetchError } = await cryptoService.getCoinHistory(coinId, currency, days);
    if (fetchError || !data || data.length === 0) {
      return null;
    }
    return data.map(([, price]) => price);
  };

  const handleCalculate = async () => {
    const amount = parseFloat(monthlyAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    setCalculating(true);
    setError(null);
    setResult(null);

    try {
      const prices = await getHistoricalPrices(selectedPeriod.days);
      if (!prices || prices.length < 2) {
        setError('Historical price data unavailable for this period');
        setCalculating(false);
        return;
      }

      // Determine investment intervals
      let intervalCount;
      if (selectedPeriod.days <= 7) {
        // Daily investment for 7-day period
        intervalCount = selectedPeriod.days;
      } else if (selectedPeriod.days <= 30) {
        // Weekly investment for 1-month period
        intervalCount = 4;
      } else {
        // Monthly investment for 1-year period
        intervalCount = 12;
      }

      const investmentPerInterval = amount;
      const totalInvested = investmentPerInterval * intervalCount;

      // Pick evenly-spaced price points from the historical data
      const step = Math.max(1, Math.floor(prices.length / intervalCount));
      let totalCryptoAccumulated = 0;

      for (let i = 0; i < intervalCount; i++) {
        const priceIndex = Math.min(i * step, prices.length - 1);
        const priceAtInterval = prices[priceIndex];
        if (priceAtInterval > 0) {
          totalCryptoAccumulated += investmentPerInterval / priceAtInterval;
        }
      }

      const currentValue = totalCryptoAccumulated * currentPrice;
      const profitLoss = currentValue - totalInvested;
      const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

      setResult({
        totalInvested,
        totalCryptoAccumulated,
        currentValue,
        profitLoss,
        profitLossPercent,
        intervalCount,
        intervalLabel: selectedPeriod.days <= 7 ? 'daily' : selectedPeriod.days <= 30 ? 'weekly' : 'monthly',
      });
    } catch {
      setError('Calculation failed. Please try again.');
    }

    setCalculating(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <Calculator size={16} />
        DCA Calculator
      </button>
    );
  }

  const isProfit = result && result.profitLoss >= 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator size={18} className="text-blue-500" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            DCA Investment Simulator
          </h3>
        </div>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400"
          aria-label="Close calculator"
        >
          <X size={16} />
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Simulate periodic investments in <span className="font-semibold text-slate-700 dark:text-slate-300">{coinName}</span> over a selected time period.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Investment per interval ({symbol})
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign size={14} className="text-slate-400" />
            </div>
            <input
              type="number"
              min="1"
              step="1"
              value={monthlyAmount}
              onChange={(e) => {
                setMonthlyAmount(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 100"
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="Investment amount"
            />
          </div>
        </div>

        {/* Period */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Time Period
          </label>
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setSelectedPeriod(p);
                  setResult(null);
                }}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  selectedPeriod.label === p.label
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        disabled={calculating || !monthlyAmount}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        aria-label="Calculate DCA investment"
      >
        {calculating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Calculating...
          </>
        ) : (
          'Calculate Investment'
        )}
      </button>

      {/* Error */}
      {error && (
        <p className="text-xs text-rose-500 font-medium text-center" role="alert">{error}</p>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-400">
            {result.intervalCount} {result.intervalLabel} investments of {symbol}{parseFloat(monthlyAmount).toLocaleString()}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 font-medium mb-1">Total Invested</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                {formatCurrency(result.totalInvested, currency)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 font-medium mb-1">Current Value</p>
              <p className={`text-sm font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(result.currentValue, currency)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 font-medium mb-1">{coinSymbol?.toUpperCase()} Accumulated</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                {result.totalCryptoAccumulated.toFixed(6)}
              </p>
            </div>
            <div className={`rounded-lg p-3 border ${
              isProfit 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
            }`}>
              <p className="text-xs text-slate-400 font-medium mb-1">Profit / Loss</p>
              <div className="flex items-center gap-1.5">
                {isProfit ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
                <p className={`text-sm font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isProfit ? '+' : ''}{formatCurrency(result.profitLoss, currency)} ({isProfit ? '+' : ''}{result.profitLossPercent.toFixed(2)}%)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DCACalculator;
