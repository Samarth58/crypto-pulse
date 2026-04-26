import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown, AlertCircle, BarChart2, CandlestickChart } from 'lucide-react';
import { cryptoService } from '../services/cryptoService';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../hooks/useTheme';
import CoinCandleChart from './CoinCandleChart';

const TIMEFRAMES = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '1Y', days: 365 },
];

export const chartCache = {}; // { 'bitcoin-usd-7': { data, timestamp } }
const CACHE_TTL = 300000; // 5 mins

// Custom tooltip
const ChartTooltip = ({ active, payload, label, currency }) => {
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

const CoinPriceChart = ({ coinId, currency = 'usd' }) => {
  const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAMES[0]);
  const [chartType, setChartType] = useState('line'); // 'line' | 'candle'
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const abortControllerRef = useRef(null);

  useEffect(() => {
    // If switching to candle for 1Y, fallback to line as OHLC is limited
    if (chartType === 'candle' && activeTimeframe.days > 365) {
      setChartType('line');
    }
  }, [activeTimeframe, chartType]);

  useEffect(() => {
    if (chartType !== 'line') return;

    let isMounted = true;

    const fetchChartData = async () => {
      const cacheKey = `${coinId}-${currency}-${activeTimeframe.days}`;

      // Check Cache
      const cached = chartCache[cacheKey];
      if (cached && (new Date() - cached.timestamp < CACHE_TTL)) {
        setChartData(cached.data);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      // Abort previous request if switching rapidly
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const { data, error: fetchError } = await cryptoService.getCoinHistory(
        coinId,
        currency,
        activeTimeframe.days,
        controller.signal
      );

      if (!isMounted) return;

      if (fetchError) {
        if (fetchError === 'Request was cancelled') return;
        setError('Chart data unavailable');
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError('No historical data available');
        setLoading(false);
        return;
      }

      // Format Data based on timeframe
      const formattedData = data.map(([ts, price]) => {
        const date = new Date(ts);
        let dateStr = '';
        
        if (activeTimeframe.days === 1) {
          // 24H view: show time HH:MM
          dateStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } else if (activeTimeframe.days <= 30) {
          dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          dateStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }

        return { date: dateStr, price };
      });

      chartCache[cacheKey] = {
        data: formattedData,
        timestamp: new Date()
      };

      setChartData(formattedData);
      setLoading(false);
    };

    fetchChartData();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [coinId, currency, activeTimeframe.days, chartType]);

  // Compute stats for current timeframe
  const stats = useMemo(() => {
    if (chartType !== 'line' || !chartData || chartData.length < 2) return null;
    const startPrice = chartData[0].price;
    const endPrice = chartData[chartData.length - 1].price;
    const isPositive = endPrice >= startPrice;
    const percentChange = ((endPrice - startPrice) / startPrice) * 100;
    
    return {
      isPositive,
      percentChange,
      color: isPositive ? '#10b981' : '#f43f5e'
    };
  }, [chartData, chartType]);

  return (
    <div className="flex flex-col gap-4">
      {/* Chart Header: Metrics & Timeframes & ChartType */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Price History ({activeTimeframe.label})
            </h3>
            
            {/* Chart Type Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setChartType('line')}
                className={`p-1 rounded-md transition-all ${chartType === 'line' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-slate-400 hover:text-slate-600'}`}
                title="Line Chart"
              >
                <BarChart2 size={14} />
              </button>
              <button
                onClick={() => setChartType('candle')}
                className={`p-1 rounded-md transition-all ${chartType === 'candle' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-slate-400 hover:text-slate-600'}`}
                title="Candlestick Chart"
              >
                <CandlestickChart size={14} />
              </button>
            </div>
          </div>

          {chartType === 'line' ? (
            loading && chartData.length === 0 ? (
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            ) : stats ? (
              <div className={`flex items-center gap-1.5 font-bold ${stats.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stats.isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                <span className="text-xl">{Math.abs(stats.percentChange).toFixed(2)}%</span>
              </div>
            ) : (
              <div className="h-8 text-slate-400 font-medium">---</div>
            )
          ) : (
            <div className="h-8 flex items-center text-xs text-slate-400 font-medium italic">
              Live Candlestick View
            </div>
          )}
        </div>

        {/* Timeframe Toggles */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
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
      <div className="h-64 w-full relative bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl p-2 border border-slate-100 dark:border-slate-800/50">
        {chartType === 'line' ? (
          loading && chartData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
               <Loader2 size={24} className="animate-spin" />
               <span className="text-sm font-medium">Loading line data...</span>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-rose-500">
               <AlertCircle size={24} />
               <span className="text-sm font-medium">{error}</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stats?.color || '#3b82f6'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={stats?.color || '#3b82f6'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  hide
                />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke={stats?.color || '#3b82f6'} 
                  strokeWidth={2}
                  fill="url(#colorPrice)" 
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: stats?.color || '#3b82f6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )
        ) : (
          <CoinCandleChart 
            coinId={coinId} 
            currency={currency} 
            days={activeTimeframe.days} 
            isDarkMode={isDarkMode} 
            onFallback={() => setChartType('line')}
          />
        )}
      </div>
    </div>
  );
};

export default CoinPriceChart;
