import React, { memo, useMemo } from 'react';
import { ChevronUp, ChevronDown, LayoutList } from 'lucide-react';
import CryptoRow, { CryptoCard } from './CryptoRow';
import { useWatchlist } from '../contexts/WatchlistContext';

const SortHeader = ({ label, sortKey, sortConfig, onSort, align = 'left', className = '' }) => {
  const isActive = sortConfig.key === sortKey;

  return (
    <th
      className={`py-3 px-3 sm:px-4 lg:px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-500 transition-colors ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        <div className="flex flex-col -space-y-1">
          <ChevronUp
            size={10}
            className={`${isActive && sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-slate-300 dark:text-slate-700'}`}
          />
          <ChevronDown
            size={10}
            className={`${isActive && sortConfig.direction === 'desc' ? 'text-blue-500' : 'text-slate-300 dark:text-slate-700'}`}
          />
        </div>
      </div>
    </th>
  );
};

const CryptoTable = ({ coins, currency, onSort, sortConfig, loading, isFetchingMore }) => {
  const { watchlist, toggleWatchlist } = useWatchlist();

  const sortedCoins = useMemo(() => {
    if (!coins) return [];
    return [...coins];
  }, [coins]);

  return (
    <div className="w-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
        {sortedCoins.map((coin) => (
          <CryptoCard 
            key={coin.id} 
            coin={coin} 
            currency={currency} 
            isStarred={watchlist.includes(coin.id)}
            onToggleWatchlist={() => toggleWatchlist(coin.id)}
          />
        ))}
        {isFetchingMore && (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortHeader label="Asset" sortKey="market_cap_rank" sortConfig={sortConfig} onSort={onSort} className="w-[35%]" />
              <SortHeader label="Price" sortKey="current_price" sortConfig={sortConfig} onSort={onSort} align="right" className="w-[20%]" />
              <SortHeader label="24h Change" sortKey="price_change_percentage_24h" sortConfig={sortConfig} onSort={onSort} align="right" className="w-[20%] hidden lg:table-cell" />
              <SortHeader label="Market Cap" sortKey="market_cap" sortConfig={sortConfig} onSort={onSort} align="right" className="w-[25%] hidden xl:table-cell" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {sortedCoins.length > 0 ? (
              sortedCoins.map((coin, index) => (
                <CryptoRow 
                  key={coin.id} 
                  coin={coin} 
                  currency={currency} 
                  index={index} 
                  isStarred={watchlist.includes(coin.id)}
                  onToggleWatchlist={() => toggleWatchlist(coin.id)}
                />
              ))
            ) : !loading && (
              <tr>
                <td colSpan="4" className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-full">
                      <LayoutList className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-white font-bold text-lg">No assets found</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            
            {isFetchingMore && (
               [...Array(5)].map((_, i) => (
                 <tr key={`loading-${i}`} className="animate-pulse">
                   <td className="py-4 px-6"><div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full" /></td>
                   <td className="py-4 px-6"><div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-3/4 ml-auto" /></td>
                   <td className="py-4 px-6 hidden lg:table-cell"><div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-1/2 ml-auto" /></td>
                   <td className="py-4 px-6 hidden xl:table-cell"><div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-2/3 ml-auto" /></td>
                 </tr>
               ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(CryptoTable);
