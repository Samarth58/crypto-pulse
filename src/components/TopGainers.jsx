import React from 'react';
import { TrendingUp } from 'lucide-react';

import { formatCurrency } from '../utils/formatters';
import { useCoinContext } from '../contexts/CoinContext';
import { SkeletonCard } from './ui/Loaders';
import SectionCard from './layout/SectionCard';
import SafeImage from './ui/SafeImage';

const TopGainers = ({ coins, loading, currency = 'usd' }) => {
  const { openModal } = useCoinContext();

  if (loading || !coins || coins.length === 0) {
    return (
      <SectionCard title="Top Gainers" icon={TrendingUp} className="h-full">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </SectionCard>
    );
  }

  const gainers = [...coins]
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
    .slice(0, 4);

  return (
    <SectionCard title="Top Gainers" icon={TrendingUp} className="h-full">
      <div className="grid grid-cols-2 gap-4">
        {gainers.map((coin) => (
          <div
            key={coin.id}
            onClick={() => openModal(coin.id)}
            className="flex flex-col gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition-colors duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <SafeImage src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
              <p className="text-xs font-semibold text-slate-400 uppercase truncate">{coin.symbol}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{coin.name}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatCurrency(coin.current_price, currency)}
                </p>
                <p className="text-xs font-semibold text-emerald-500">
                  +{coin.price_change_percentage_24h.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default TopGainers;
