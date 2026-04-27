import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, BarChart2, Coins, ArrowUp, ArrowDown, Activity, AlertCircle, RefreshCw, BellPlus } from 'lucide-react';
import { useCoinContext } from '../contexts/CoinContext';
import { cryptoService } from '../services/cryptoService';
import { formatCurrency, formatCompactNumber } from '../utils/formatters';
import CoinPriceChart from './CoinPriceChart';
import DCACalculator from './DCACalculator';
import SafeImage from './ui/SafeImage';
import { useAlerts } from '../contexts/AlertContext';
import { useToast } from './ui/ToastProvider';
import MarketInsights from './MarketInsights';
import { useGlobalStats } from '../hooks/useGlobalStats';
import CoinAboutSection from './CoinAboutSection';

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
  <div className="bg-white/40 dark:bg-slate-900/40 rounded-xl p-3 sm:p-4 border border-slate-200/60 dark:border-slate-700/40 flex flex-col gap-1.5">
    <div className="flex items-center gap-2 text-slate-400">
      <Icon size={14} />
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
    </div>
    <p className={`text-base sm:text-lg font-bold ${colorClass || 'text-slate-800 dark:text-white'}`}>{value}</p>
  </div>
);

// Basic module-level cache to avoid refetching detail objects unnecessarily
const detailCache = {};
const DETAIL_CACHE_TTL = 300000;

const CoinDetailModal = ({ currency = 'usd' }) => {
  const { selectedCoinId, isModalOpen, closeModal } = useCoinContext();
  const { stats: globalStats } = useGlobalStats();
  const [coinDetails, setCoinDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Smart Alert State
  const { addAlert } = useAlerts();
  const { showToast } = useToast();
  const [alertType, setAlertType] = useState('price'); // 'price' | 'percentage'
  const [alertValue, setAlertValue] = useState('');
  const [alertCondition, setAlertCondition] = useState('above');
  const [alertRepeat, setAlertRepeat] = useState(false);
  const [alertDuration, setAlertDuration] = useState('24h');

  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!isModalOpen || !selectedCoinId) return;

    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await cryptoService.getCoinDetails(selectedCoinId);

        if (!isMounted) return;

        if (response.data) {
          setCoinDetails(response.data);
          setLoading(false);
          
          if (response.error && import.meta.env.DEV) {
            console.warn("[CoinDetailModal] Fetch error but used cache:", response.error);
          }
        } else if (response.error) {
          setError(response.error);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [selectedCoinId, isModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  const handleCreateAlert = () => {
    if (!alertValue || isNaN(parseFloat(alertValue))) {
      showToast('Please enter a valid value.', 'alert');
      return;
    }

    const durationMap = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      'never': null
    };

    addAlert({
      coinId: coinDetails.id,
      coinName: coinDetails.name,
      coinSymbol: coinDetails.symbol,
      type: alertType,
      targetValue: parseFloat(alertValue),
      condition: alertCondition,
      repeat: alertRepeat,
      durationMs: durationMap[alertDuration],
      currency
    });
    
    const displayTarget = alertType === 'price' 
      ? formatCurrency(parseFloat(alertValue), currency)
      : `${alertValue}%`;

    showToast(`Smart Alert set for ${coinDetails.name} ${alertCondition} ${displayTarget}`);
    setAlertValue('');
  };

  if (!isModalOpen) return null;

  // Safe extractors
  const currentPrice = coinDetails?.market_data?.current_price?.[currency] || 0;
  const priceChange = coinDetails?.market_data?.price_change_percentage_24h || 0;
  const isPositive = priceChange >= 0;
  const high24h = coinDetails?.market_data?.high_24h?.[currency] || 0;
  const low24h = coinDetails?.market_data?.low_24h?.[currency] || 0;
  const marketCap = coinDetails?.market_data?.market_cap?.[currency] || 0;
  const totalVolume = coinDetails?.market_data?.total_volume?.[currency] || 0;
  const circulatingSupply = coinDetails?.market_data?.circulating_supply || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 pointer-events-none"
      >
        <div
          className="w-full h-full sm:h-auto max-w-2xl bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col sm:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            // Skeleton Loader State
            <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
               <div className="flex items-center justify-between animate-pulse">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="flex flex-col gap-2">
                       <div className="w-24 h-6 bg-slate-200 dark:bg-slate-800 rounded" />
                       <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full" />
               </div>
               <div className="w-32 h-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
               <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
               <div className="grid grid-cols-2 gap-4 animate-pulse">
                 {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />)}
               </div>
            </div>
          ) : error ? (
            // Error State
            <div className="flex flex-col items-center justify-center p-10 h-full text-center space-y-4">
              <AlertCircle size={48} className="text-rose-500" />
              <p className="text-lg font-bold text-slate-800 dark:text-white">Failed to load details</p>
              <p className="text-sm text-slate-500">{error}</p>
              <button
                onClick={() => {
                   setLoading(true);
                   setError(null);
                   detailCache[selectedCoinId] = null; // force clear cache
                   // Let effect run again by clearing error
                }}
                className="px-4 py-2 mt-4 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          ) : (
            // Success State
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700/60 flex-shrink-0 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-10">
                <div className="flex items-center gap-4">
                  <SafeImage src={coinDetails.image?.large || coinDetails.image?.small} alt={coinDetails.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-md" />
                  <div>
                    <h2 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl">{coinDetails.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-slate-400 uppercase font-semibold tracking-wider">
                        {coinDetails.symbol}
                      </span>
                      {coinDetails.market_cap_rank && (
                        <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">
                          Rank #{coinDetails.market_cap_rank}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
                
                {/* Primary Price Metric */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1 font-medium">Current Price</p>
                    <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {formatCurrency(currentPrice, currency)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${isPositive
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    }`}>
                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {Math.abs(priceChange).toFixed(2)}%
                  </div>
                </div>

                {/* Interactive Chart */}
                <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                  <CoinPriceChart coinId={selectedCoinId} currency={currency} />
                </div>

                {/* DCA Investment Calculator */}
                <DCACalculator
                  coinId={selectedCoinId}
                  coinName={coinDetails.name}
                  coinSymbol={coinDetails.symbol}
                  currency={currency}
                  currentPrice={currentPrice}
                />

                {/* Advanced Market Insights Panel */}
                <MarketInsights 
                  coinData={coinDetails} 
                  globalStats={globalStats} 
                  currency={currency} 
                />

                {/* Smart Price Alerts Section */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <BellPlus className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-white">Smart Alerts</h3>
                    </div>
                    
                    {/* Alert Type Toggle */}
                    <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider">
                      <button 
                        onClick={() => setAlertType('price')}
                        className={`px-2 py-1 rounded-md transition-all ${alertType === 'price' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400'}`}
                      >
                        Price
                      </button>
                      <button 
                        onClick={() => setAlertType('percentage')}
                        className={`px-2 py-1 rounded-md transition-all ${alertType === 'percentage' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400'}`}
                      >
                        % Change
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Condition & Target */}
                      <div className="flex flex-1 gap-2">
                        <select 
                          value={alertCondition}
                          onChange={(e) => setAlertCondition(e.target.value)}
                          className="w-1/3 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="above">Above</option>
                          <option value="below">Below</option>
                        </select>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold uppercase">
                            {alertType === 'price' ? currency.toUpperCase() : '%'}
                          </span>
                          <input 
                            type="number" 
                            value={alertValue}
                            onChange={(e) => setAlertValue(e.target.value)}
                            placeholder={alertType === 'price' ? "Price" : "Change %"}
                            className="w-full pl-12 pr-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Expiry Selector */}
                      <select 
                        value={alertDuration}
                        onChange={(e) => setAlertDuration(e.target.value)}
                        className="sm:w-32 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="1h">Exp: 1 Hour</option>
                        <option value="24h">Exp: 24 Hours</option>
                        <option value="7d">Exp: 7 Days</option>
                        <option value="never">Never Expire</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative inline-flex items-center">
                          <input 
                            type="checkbox" 
                            checked={alertRepeat}
                            onChange={(e) => setAlertRepeat(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Repeat Notification</span>
                      </label>

                      <button 
                        onClick={handleCreateAlert}
                        disabled={!alertValue || parseFloat(alertValue) === 0}
                        className="px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95"
                      >
                        Set Smart Alert
                      </button>
                    </div>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Market Statistics</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <StatCard
                      label="24h High"
                      value={formatCurrency(high24h, currency)}
                      icon={ArrowUp}
                      colorClass="text-emerald-600 dark:text-emerald-400"
                    />
                    <StatCard
                      label="24h Low"
                      value={formatCurrency(low24h, currency)}
                      icon={ArrowDown}
                      colorClass="text-rose-500 dark:text-rose-400"
                    />
                    <StatCard
                      label="Market Cap"
                      value={formatCurrency(marketCap, currency).replace(/[\d,.]+/, formatCompactNumber(marketCap))}
                      icon={BarChart2}
                    />
                    <StatCard
                      label="Volume (24h)"
                      value={formatCurrency(totalVolume, currency).replace(/[\d,.]+/, formatCompactNumber(totalVolume))}
                      icon={Activity}
                    />
                  </div>
                  {circulatingSupply > 0 && (
                    <div className="mt-3 sm:mt-4 grid grid-cols-1">
                      <StatCard
                        label="Circulating Supply"
                        value={`${formatCompactNumber(circulatingSupply)} ${coinDetails.symbol?.toUpperCase() || ''}`}
                        icon={Coins}
                      />
                    </div>
                  )}
                </div>

                {/* Enhanced About Section */}
                <CoinAboutSection coinDetails={coinDetails} />
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CoinDetailModal;
