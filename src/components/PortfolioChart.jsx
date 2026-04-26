import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Loader2, AlertCircle, BarChart2 } from 'lucide-react';
import { cryptoService } from '../services/cryptoService';
import { formatCurrency } from '../utils/formatters';

// Separate raw-data cache for portfolio chart (stores [ts, price] pairs)
const rawDataCache = {}; // key: `${coinId}-${currency}-${days}` → { data: [[ts, price]], timestamp }
const CACHE_TTL = 300000; // 5 minutes

const TIMEFRAMES = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
];

const PortfolioTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-white">
          {formatCurrency(payload[0].value, currency)}
        </p>
      </div>
    );
  }
  return null;
};

const PortfolioChart = ({ portfolioAssets, currency = 'usd' }) => {
  const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAMES[0]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllersRef = useRef([]);

  const hasAssets = portfolioAssets && portfolioAssets.length > 0;

  useEffect(() => {
    if (!hasAssets) return;

    let isMounted = true;

    const fetchAllHistories = async () => {
      setLoading(true);
      setError(null);

      // Abort any in-flight requests
      abortControllersRef.current.forEach(c => c.abort());
      abortControllersRef.current = [];

      try {
        // Fetch historical prices for each asset in parallel
        const results = await Promise.all(
          portfolioAssets.map(({ id: coinId, qty }) => {
            const cacheKey = `${coinId}-${currency}-${activeTimeframe.days}`;
            const cached = rawDataCache[cacheKey];

            // Use cache if fresh
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
              return Promise.resolve({ coinId, qty, data: cached.data });
            }

            const controller = new AbortController();
            abortControllersRef.current.push(controller);

            return cryptoService
              .getCoinHistory(coinId, currency, activeTimeframe.days, controller.signal)
              .then(({ data, error: fetchError }) => {
                if (fetchError || !data || data.length === 0) return { coinId, qty, data: [] };
                // Store raw [ts, price] pairs in dedicated cache
                rawDataCache[cacheKey] = { data, timestamp: Date.now() };
                return { coinId, qty, data };
              });
          })
        );

        if (!isMounted) return;

        // Find the asset with most data points to use as the timeline
        const longestResult = results.reduce((a, b) => (b.data.length > a.data.length ? b : a), results[0]);
        if (!longestResult || longestResult.data.length === 0) {
          setError('No historical data available for your holdings.');
          setLoading(false);
          return;
        }

        // Build portfolio value series by aligning timestamps
        // Strategy: use the longestResult timestamps as base, for each ts find nearest price in other coins
        const aggregated = longestResult.data.map(([ts]) => {
          const date = new Date(ts);
          let label = '';

          if (activeTimeframe.days === 1) {
            label = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          } else if (activeTimeframe.days <= 30) {
            label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else {
            label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          }

          let totalValue = 0;
          results.forEach(({ qty, data }) => {
            if (!data || data.length === 0) return;
            // Find the nearest data point by timestamp
            let nearest = data[0];
            let minDiff = Math.abs(data[0][0] - ts);
            for (const point of data) {
              const diff = Math.abs(point[0] - ts);
              if (diff < minDiff) {
                minDiff = diff;
                nearest = point;
              }
            }
            totalValue += (nearest[1] || 0) * qty;
          });

          return { date: label, value: totalValue };
        });

        // Downsample to at most 100 points for performance
        const step = Math.max(1, Math.floor(aggregated.length / 100));
        const downsampled = aggregated.filter((_, i) => i % step === 0);

        setChartData(downsampled);
      } catch (e) {
        if (isMounted && e?.name !== 'AbortError') {
          setError('Failed to load portfolio chart.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllHistories();

    return () => {
      isMounted = false;
      abortControllersRef.current.forEach(c => c.abort());
    };
  }, [portfolioAssets, currency, activeTimeframe.days, hasAssets]);

  // Compute % change over the timeframe
  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const start = chartData[0].value;
    const end = chartData[chartData.length - 1].value;
    if (start === 0) return null;
    const pct = ((end - start) / start) * 100;
    return { pct, isPositive: pct >= 0, color: pct >= 0 ? '#10b981' : '#f43f5e' };
  }, [chartData]);

  // Empty portfolio state
  if (!hasAssets) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
        <BarChart2 size={32} className="text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
          Add assets to view portfolio performance
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Portfolio Value ({activeTimeframe.label})
          </h3>
          {loading ? (
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ) : trend ? (
            <div className={`text-lg font-bold ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend.isPositive ? '+' : ''}{trend.pct.toFixed(2)}%
              <span className="text-xs ml-1 font-medium opacity-70">over {activeTimeframe.label}</span>
            </div>
          ) : null}
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl self-start sm:self-auto">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.label}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTimeframe.label === tf.label
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-56 w-full relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm font-medium">Building portfolio chart...</span>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-rose-500 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl">
            <AlertCircle size={22} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trend?.color || '#3b82f6'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={trend?.color || '#3b82f6'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.1)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                minTickGap={32}
              />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip content={<PortfolioTooltip currency={currency} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={trend?.color || '#3b82f6'}
                strokeWidth={2}
                fill="url(#portfolioGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: trend?.color || '#3b82f6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PortfolioChart;
