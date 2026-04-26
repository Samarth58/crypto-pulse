import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import { formatCurrency, formatCompactNumber } from '../utils/formatters';
import { useCoinContext } from '../contexts/CoinContext';
import SafeImage from './ui/SafeImage';

export const CryptoCard = ({ coin, currency = 'usd', isStarred, onToggleWatchlist }) => {
  const { openModal } = useCoinContext();
  const isPositive = (coin?.price_change_percentage_24h ?? 0) >= 0;

  const handleStarClick = (e) => {
    e.stopPropagation();
    onToggleWatchlist?.();
  };

  return (
    <div
      onClick={() => openModal(coin?.id)}
      className="bg-white dark:bg-slate-900 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
            <SafeImage src={coin?.image} alt={coin?.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{coin?.name || '--'}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest truncate">{coin?.symbol || '--'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(coin?.current_price ?? 0, currency)}
            </span>
          </div>
          <button
            onClick={handleStarClick}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Star size={16} className={`${isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(coin?.price_change_percentage_24h ?? 0).toFixed(2)}%
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mr-2">MCap</span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {formatCurrency(coin?.market_cap ?? 0, currency).replace(/[\d,.]+/, formatCompactNumber(coin?.market_cap ?? 0))}
          </span>
        </div>
      </div>
    </div>
  );
};

const CryptoRow = ({ coin, index, currency = 'usd', isStarred, onToggleWatchlist }) => {
  const { openModal } = useCoinContext();
  const isPositive = (coin?.price_change_percentage_24h ?? 0) >= 0;
  const [flashType, setFlashType] = useState(null); 
  const prevPriceRef = useRef(coin?.current_price);

  useEffect(() => {
    if (coin?.current_price && prevPriceRef.current !== coin.current_price) {
      setFlashType(coin.current_price > prevPriceRef.current ? 'up' : 'down');
      prevPriceRef.current = coin.current_price;
      const timer = setTimeout(() => setFlashType(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [coin?.current_price]);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      onClick={() => openModal(coin?.id)}
      className={`cursor-pointer group transition-colors duration-300 ${
        flashType === 'up' ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : 
        flashType === 'down' ? 'bg-rose-500/5 dark:bg-rose-500/10' : 
        'hover:bg-slate-50 dark:hover:bg-slate-800/40'
      }`}
    >
      <td className="py-4 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWatchlist?.(); }}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Star size={16} className={`${isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
          </button>
          <span className="text-[10px] text-slate-400 font-bold w-4 text-right hidden sm:block">
            {coin?.market_cap_rank ?? '--'}
          </span>
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
            <SafeImage src={coin?.image} alt={coin?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{coin?.name || '--'}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest truncate">{coin?.symbol || '--'}</span>
          </div>
        </div>
      </td>

      <td className="py-4 px-4 lg:px-6 text-right">
        <span className={`text-sm font-bold tabular-nums transition-colors duration-500 ${
          flashType === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 
          flashType === 'down' ? 'text-rose-600 dark:text-rose-400' : 
          'text-slate-900 dark:text-white'
        }`}>
          {formatCurrency(coin?.current_price ?? 0, currency)}
        </span>
      </td>

      <td className="py-4 px-4 lg:px-6 text-right hidden lg:table-cell">
        <div className={`flex items-center justify-end gap-1.5 text-sm font-bold tabular-nums ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(coin?.price_change_percentage_24h ?? 0).toFixed(2)}%</span>
        </div>
      </td>

      <td className="py-4 px-4 lg:px-6 text-right hidden xl:table-cell">
        <span className="text-sm font-bold text-slate-600 dark:text-slate-400 tabular-nums">
          {formatCurrency(coin?.market_cap ?? 0, currency).replace(/[\d,.]+/, formatCompactNumber(coin?.market_cap ?? 0))}
        </span>
      </td>
    </motion.tr>
  );
};

export default memo(CryptoRow, (prev, next) => (
  prev.coin?.current_price === next.coin?.current_price &&
  prev.coin?.price_change_percentage_24h === next.coin?.price_change_percentage_24h &&
  prev.isStarred === next.isStarred &&
  prev.currency === next.currency
));
