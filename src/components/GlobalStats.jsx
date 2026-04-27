import React from 'react';
import { Globe, BarChart3, PieChart, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatCompactNumber, formatPercentage } from '../utils/formatters';

const StatItem = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-2 px-4 py-2 border-r border-slate-200 dark:border-slate-800 last:border-0">
    <Icon size={14} className="text-blue-500 flex-shrink-0" />
    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{label}:</span>
    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{value}</span>
  </div>
);

const GlobalStats = ({ stats, loading, error, isStale, currency = 'usd', onRetry }) => {
  if (loading && !stats) return (
    <div className="h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl animate-pulse" role="status" aria-label="Loading market statistics">
      <span className="sr-only">Loading market statistics...</span>
    </div>
  );

  if (error && !stats) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
           <AlertTriangle size={16} className="text-rose-500" />
           <span className="text-sm font-medium text-rose-600 dark:text-rose-400">{error || 'Market metrics unavailable'}</span>
        </div>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>
    );
  }

  if (!stats) return null;

  const SYMBOLS = { usd: '$', eur: '€', inr: '₹' };
  const symbol = SYMBOLS[currency.toLowerCase()] || '$';

  return (
    <div className="relative">
      <div className={`bg-white dark:bg-slate-900 border ${isStale ? 'border-amber-200 dark:border-amber-900/30' : 'border-slate-200 dark:border-slate-800'} shadow-sm rounded-xl px-2 py-1 flex items-center overflow-x-auto no-scrollbar whitespace-nowrap transition-colors duration-500`}>
        <StatItem 
          label="Market Cap" 
          value={`${symbol}${formatCompactNumber(stats.total_market_cap[currency.toLowerCase()] || stats.total_market_cap.usd)}`} 
          icon={Globe} 
        />
        <StatItem 
          label="24h Volume" 
          value={`${symbol}${formatCompactNumber(stats.total_volume[currency.toLowerCase()] || stats.total_volume.usd)}`} 
          icon={BarChart3} 
        />
        <StatItem 
          label="BTC Dominance" 
          value={formatPercentage(stats.market_cap_percentage.btc)} 
          icon={PieChart} 
        />
        <div className="flex items-center gap-2 px-4 py-2 border-r border-slate-200 dark:border-slate-800 last:border-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Assets:</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{stats.active_cryptocurrencies}</span>
        </div>
        
        {isStale && (
          <div className="flex items-center gap-1.5 px-4 py-2 text-amber-500 animate-pulse">
            <RefreshCw size={12} className="animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Cached</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalStats;
