import React, { useMemo, useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, ChevronDown, BarChart3, Star, LayoutList, Wallet, Bell, Activity } from 'lucide-react';

import { useCryptoData } from '../hooks/useCryptoData';
import { useTheme } from '../hooks/useTheme';
import { useDebounce } from '../hooks/useDebounce';
import { useGlobalStats } from '../hooks/useGlobalStats';
import { useTrending } from '../hooks/useTrending';

import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import CryptoTable from './CryptoTable';
import CoinDetailModal from './CoinDetailModal';
import { SkeletonRow, EmptyState } from './ui/Loaders';
import { ErrorState } from './ui/ErrorState';
import GlobalStats from './GlobalStats';
import TopGainers from './TopGainers';
import TopLosers from './TopLosers';
import Trending from './Trending';
import LastUpdated from './LastUpdated';
import DashboardLayout from './layout/DashboardLayout';
import SectionCard from './layout/SectionCard';
import { useCoinContext } from '../contexts/CoinContext';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useAlerts } from '../contexts/AlertContext';
import { useToast } from './ui/ToastProvider';
import PortfolioModal from './PortfolioModal';
import AlertsModal from './AlertsModal';
import { formatCurrency } from '../utils/formatters';

// ─── Currency config ────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'usd', label: 'USD', symbol: '$' },
  { code: 'inr', label: 'INR', symbol: '₹' },
  { code: 'eur', label: 'EUR', symbol: '€' },
];

// ─── Currency Selector ───────────────────────────────────────────────────────
const CurrencySelector = ({ currency, onChange }) => (
  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
    {CURRENCIES.map((c) => (
      <button
        key={c.code}
        onClick={() => onChange(c.code)}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
          currency === c.code
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
        }`}
      >
        {c.symbol} {c.label}
      </button>
    ))}
  </div>
);

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const Dashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('selectedCurrency') || 'usd';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('all'); // 'all' or 'watchlist'
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const { openModal } = useCoinContext();
  const { watchlist } = useWatchlist();
  const { alerts, markAsTriggered } = useAlerts();
  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem('selectedCurrency', currency);
  }, [currency]);
  
  const { data, loading, isFetching, error, lastUpdated, isRateLimited, loadMore, isFetchingMore, hasMore, retry } = useCryptoData(currency);
  const { stats, loading: globalLoading, isFetching: globalIsFetching, error: globalError, retry: retryGlobal } = useGlobalStats();
  const { trending, loading: trendingLoading, isFetching: trendingIsFetching, error: trendingError, retry: retryTrending } = useTrending();
  
  // Alert Checking Logic
  useEffect(() => {
    if (!data || alerts.length === 0) return;
    
    const now = Date.now();
    const coinMap = new Map(data.map(c => [c.id, c]));
    
    alerts.forEach(alert => {
      // Basic Skip Conditions
      if (alert.isTriggered) return;
      if (alert.type === 'price' && alert.currency !== currency) return;
      if (alert.expiryTime && now > alert.expiryTime) return;

      const coin = coinMap.get(alert.coinId);
      if (!coin) return;

      let isMet = false;
      let currentValue = 0;
      let displayValue = '';

      if (alert.type === 'percentage') {
        currentValue = coin.price_change_percentage_24h;
        displayValue = `${currentValue.toFixed(2)}%`;
        if (alert.condition === 'above' && currentValue >= alert.targetValue) isMet = true;
        if (alert.condition === 'below' && currentValue <= alert.targetValue) isMet = true;
      } else {
        // Default to price alert
        currentValue = coin.current_price;
        displayValue = formatCurrency(currentValue, currency);
        if (alert.condition === 'above' && currentValue >= alert.targetValue) isMet = true;
        if (alert.condition === 'below' && currentValue <= alert.targetValue) isMet = true;
      }
      
      if (isMet) {
        const message = alert.type === 'percentage'
          ? `📈 ${alert.coinName} 24h change is ${alert.condition} ${alert.targetValue}% (Current: ${displayValue})`
          : `🚨 ${alert.coinName} price is ${alert.condition} ${formatCurrency(alert.targetValue, currency)} (Current: ${displayValue})`;
        
        showToast(message, 'alert', 10000);
        markAsTriggered(alert.id, alert.repeat);
      }
    });
  }, [data, alerts, currency, markAsTriggered, showToast]);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'market_cap_rank', direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Memoized filtering and sorting
  const filteredAndSortedCoins = useMemo(() => {
    if (!data) return [];
    
    let results = data;

    if (view === 'watchlist') {
      results = results.filter(c => watchlist.includes(c.id));
    }

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      results = results.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    }

    return [...results].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, debouncedQuery, sortConfig, view, watchlist]);

  const handleSelectCoin = (coin) => {
    const coinId = coin.item ? coin.item.id : coin.id;
    openModal(coinId);
  };

  const handleRefreshAll = () => {
    retry();
    retryGlobal();
    retryTrending();
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Activity size={24} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Crypto <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Pulse</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <LastUpdated timestamp={lastUpdated} />
            {(isFetching || globalIsFetching || trendingIsFetching) && !loading && (
              <RefreshCw size={12} className="text-blue-500 animate-spin ml-1" aria-label="Fetching updates in background" />
            )}
            {error && !loading && (
              <AlertTriangle size={14} className="text-rose-500 ml-1" title="Background update failed" />
            )}
            {isRateLimited && <span className="text-amber-500 ml-2">(Cached Data)</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
            <button
              onClick={() => setView('all')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'all' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <LayoutList size={16} /> All
            </button>
            <button
              onClick={() => setView('watchlist')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'watchlist' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Star size={16} className={view === 'watchlist' ? 'fill-amber-400 text-amber-400' : ''} /> Watchlist
            </button>
          </div>
          <button
            onClick={() => setIsPortfolioOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Wallet size={16} /> Portfolio
          </button>
          <button
            onClick={() => setIsAlertsOpen(true)}
            className="relative p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-amber-500 hover:border-amber-500/50 transition-all"
            title="Manage Alerts"
          >
            <Bell size={18} />
            {alerts.filter(a => !a.isTriggered).length > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </button>
          <button 
            onClick={handleRefreshAll}
            disabled={isFetching || globalIsFetching || trendingIsFetching}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-blue-500 hover:border-blue-500/50 transition-all disabled:opacity-50"
            title="Refresh all data"
          >
            <RefreshCw size={18} className={isFetching || globalIsFetching || trendingIsFetching ? 'animate-spin' : ''} />
          </button>
          <CurrencySelector currency={currency} onChange={setCurrency} />
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </header>

      {/* Global Market Stats */}
      <GlobalStats 
        stats={stats} 
        loading={globalLoading} 
        error={globalError} 
        currency={currency}
        onRetry={retryGlobal} 
      />

      {/* Secondary Sections — 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TopGainers coins={data} loading={loading} currency={currency} />
        <TopLosers coins={data} loading={loading} currency={currency} />
        <Trending 
          trending={trending} 
          loading={trendingLoading} 
          error={trendingError} 
          onRetry={retryTrending} 
        />
      </div>

      {/* Main Table Section */}
      <main>
        {loading ? (
          <SectionCard title="Market Assets" icon={BarChart3} noPadding>
            <SkeletonRow rows={10} />
          </SectionCard>
        ) : (
          <div className="space-y-6">
            <SectionCard title="Market Assets" icon={BarChart3} noPadding>
              {error && (!data || data.length === 0) ? (
                <div className="p-12">
                  <ErrorState variant="full" message={error} onRetry={retry} />
                </div>
              ) : (
                <CryptoTable 
                  coins={filteredAndSortedCoins} 
                  onSelectCoin={handleSelectCoin} 
                  currency={currency}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                  loading={loading}
                  isFetchingMore={isFetchingMore}
                />
              )}
              
              {!loading && filteredAndSortedCoins.length === 0 && !error && (
                <div className="p-6">
                  {view === 'watchlist' && !searchQuery.trim() ? (
                     <EmptyState 
                       message="Your watchlist is empty" 
                       subMessage="Click the star icon next to any coin to add it to your watchlist."
                     />
                  ) : (
                    <EmptyState 
                      message={searchQuery.trim() ? `No results for "${searchQuery}"` : "No assets available"} 
                      subMessage="Try adjusting your search criteria or checking back later."
                    />
                  )}
                </div>
              )}
            </SectionCard>
            
            {hasMore && filteredAndSortedCoins.length > 0 && view === 'all' && (
              <div className="flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={isFetchingMore}
                  className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl text-sm font-semibold text-slate-700 dark:text-white flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isFetchingMore ? (
                    <>
                      <RefreshCw size={16} className="animate-spin text-blue-500" />
                      Loading Assets...
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} className="text-blue-500" />
                      Load More Assets
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 pt-2 pb-6">
        Powered by <a href="https://www.coingecko.com" className="text-blue-500 hover:underline">CoinGecko API</a>
      </footer>

      <CoinDetailModal currency={currency} />
      <PortfolioModal 
        isOpen={isPortfolioOpen} 
        onClose={() => setIsPortfolioOpen(false)} 
        data={data} 
        currency={currency} 
      />
      <AlertsModal 
        isOpen={isAlertsOpen} 
        onClose={() => setIsAlertsOpen(false)} 
        currency={currency} 
      />
    </DashboardLayout>
  );
};

export default Dashboard;
