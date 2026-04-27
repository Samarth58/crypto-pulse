import React from 'react';
import { Flame } from 'lucide-react';
import { useCoinContext } from '../contexts/CoinContext';
import { SkeletonCard } from './ui/Loaders';
import { ErrorState } from './ui/ErrorState';
import SectionCard from './layout/SectionCard';
import SafeImage from './ui/SafeImage';

const Trending = ({ trending, loading, error, isStale, onRetry }) => {
  const { openModal } = useCoinContext();

  if (loading && (!trending || trending.length === 0)) {
    return (
      <SectionCard title="Trending" icon={Flame} className="h-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </SectionCard>
    );
  }

  if (error && (!trending || trending.length === 0)) {
    return (
      <SectionCard title="Trending" icon={Flame} className="h-full">
        <ErrorState variant="partial" message="Trending data unavailable" onRetry={onRetry} />
      </SectionCard>
    );
  }

  return (
    <SectionCard 
      title="Trending" 
      icon={Flame} 
      className="h-full"
      badge={isStale ? "Cached" : null}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
        {trending.slice(0, 4).map((item) => {
          const coin = item.item;
          return (
            <div
              key={coin.id}
              onClick={() => openModal(coin.id)}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 transition-colors duration-200 cursor-pointer"
            >
              <SafeImage src={coin.small} alt={coin.name} className="w-6 h-6 rounded-full" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{coin.name}</p>
                <p className="text-xs text-slate-400 uppercase">{coin.symbol}</p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default Trending;
