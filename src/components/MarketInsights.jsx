import React, { useMemo } from 'react';
import { Target, PieChart, Info, Layers } from 'lucide-react';
import { formatCurrency, formatCompactNumber } from '../utils/formatters';

const MarketInsights = ({ coinData, globalStats, currency = 'usd' }) => {
  // 1. EXTRACT DATA
  const marketCap = coinData?.market_data?.market_cap?.[currency] || 0;
  const currentPrice = coinData?.market_data?.current_price?.[currency] || 0;
  const ath = coinData?.market_data?.ath?.[currency] || 0;
  const circulatingSupply = coinData?.market_data?.circulating_supply || 0;
  const totalSupply = coinData?.market_data?.total_supply || coinData?.market_data?.max_supply || 0;
  const totalGlobalMarketCap = globalStats?.total_market_cap?.[currency] || 0;

  // 2. CALCULATE METRICS
  const metrics = useMemo(() => {
    // Dominance
    const dominance = totalGlobalMarketCap > 0 
      ? (marketCap / totalGlobalMarketCap) * 100 
      : null;

    // Supply Progress
    const supplyPercentage = (totalSupply > 0 && circulatingSupply > 0)
      ? Math.min((circulatingSupply / totalSupply) * 100, 100)
      : null;

    // ATH Difference
    const athDiff = ath > 0 
      ? ((currentPrice - ath) / ath) * 100 
      : null;
    
    const isNearAth = athDiff !== null && athDiff > -5;

    return {
      dominance,
      supplyPercentage,
      athDiff,
      isNearAth
    };
  }, [marketCap, totalGlobalMarketCap, circulatingSupply, totalSupply, currentPrice, ath]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Market Insights</h3>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Market Dominance Card */}
        {metrics.dominance !== null && (
          <div className="bg-white dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400">
              <PieChart size={16} />
              <span className="text-xs font-bold uppercase tracking-tight">Market Dominance</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {metrics.dominance.toFixed(2)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Share of total crypto market capitalization.
            </p>
          </div>
        )}

        {/* All-Time High Card */}
        {ath > 0 && (
          <div className="bg-white dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Target size={16} />
              <span className="text-xs font-bold uppercase tracking-tight">All-Time High</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(ath, currency)}
              </span>
              <div className={`text-xs font-bold flex items-center gap-1 ${metrics.isNearAth ? 'text-emerald-500' : 'text-rose-500'}`}>
                {metrics.athDiff !== null && (
                  <>
                    <span>{metrics.athDiff.toFixed(2)}%</span>
                    <span>{metrics.athDiff >= 0 ? 'above' : 'from peak'}</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              The highest price recorded for this asset.
            </p>
          </div>
        )}

        {/* Supply Progress Card */}
        <div className="bg-white dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 md:col-span-1">
          <div className="flex items-center gap-2 text-slate-400">
            <Layers size={16} />
            <span className="text-xs font-bold uppercase tracking-tight">Supply Issued</span>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {formatCompactNumber(circulatingSupply)}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                / {totalSupply > 0 ? formatCompactNumber(totalSupply) : '∞'}
              </span>
            </div>
            
            {metrics.supplyPercentage !== null ? (
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${metrics.supplyPercentage}%` }}
                />
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 italic">Unlimited or unknown supply</div>
            )}
            
            {metrics.supplyPercentage !== null && (
              <span className="text-[10px] text-slate-400 font-medium self-end">
                {metrics.supplyPercentage.toFixed(1)}% circulating
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
