import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { Loader2, AlertCircle } from 'lucide-react';
import { cryptoService } from '../services/cryptoService';

const candleCache = {}; 
const CACHE_TTL = 300000; // 5 mins

const CoinCandleChart = ({ coinId, currency = 'usd', days = 7, isDarkMode = false, onFallback }) => {
  const chartContainerRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOHLC = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await cryptoService.getOHLC(coinId, currency, days);

        if (!isMounted) return;

        if (response.data && response.data.length > 0) {
          // 1. DATA TRANSFORMATION & VALIDATION
          const processed = response.data
            .map(([ts, open, high, low, close]) => {
              if ([ts, open, high, low, close].some(v => v === null || v === undefined || isNaN(v))) {
                return null;
              }
              return {
                time: Math.floor(ts / 1000), // Seconds (required by lightweight-charts)
                open: Number(open),
                high: Number(high),
                low: Number(low),
                close: Number(close)
              };
            })
            .filter(Boolean);

          // 2. ENSURE UNIQUE & SORTED TIMESTAMPS
          const validatedData = [];
          const seenTimes = new Set();
          
          processed.sort((a, b) => a.time - b.time);
          
          for (const item of processed) {
            if (!seenTimes.has(item.time)) {
              validatedData.push(item);
              seenTimes.add(item.time);
            }
          }

          if (validatedData.length < 2) {
            throw new Error('Insufficient data points for candle chart');
          }

          setChartData(validatedData);
          setLoading(false);
          
          if (response.error && import.meta.env.DEV) {
            console.warn("[CoinCandleChart] Fetch error but used cache:", response.error);
          }
        } else if (response.error) {
          throw new Error(response.error);
        } else {
          throw new Error('No candlestick data available');
        }
      } catch (err) {
        if (isMounted) {
          console.error("OHLC Fetch Error:", err);
          setError(err.message);
          setLoading(false);
          if (onFallback) setTimeout(onFallback, 2000);
        }
      }
    };

    fetchOHLC();

    return () => {
      isMounted = false;
    };
  }, [coinId, currency, days]);

  useEffect(() => {
    if (loading || error || chartData.length === 0 || !chartContainerRef.current) return;

    const container = chartContainerRef.current;
    let chart;
    let isMounted = true;

    const initTimeout = setTimeout(() => {
      if (!isMounted || !container) return;

      try {
        chart = createChart(container, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: isDarkMode ? '#94a3b8' : '#64748b',
          },
          grid: {
            vertLines: { color: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
            horzLines: { color: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
          },
          width: container.clientWidth || 400,
          height: 256,
          timeScale: {
            borderVisible: false,
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderVisible: false,
            autoScale: true,
          },
        });

        // Robust series creation: Try addSeries (V5) first, then fallback to addCandlestickSeries (V4)
        let candleSeries;
        const options = {
          upColor: '#10b981',
          downColor: '#f43f5e',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#f43f5e',
        };

        if (typeof chart.addSeries === 'function' && CandlestickSeries) {
          candleSeries = chart.addSeries(CandlestickSeries, options);
        } else if (typeof chart.addCandlestickSeries === 'function') {
          candleSeries = chart.addCandlestickSeries(options);
        } else {
          throw new Error('Could not initialize candlestick series');
        }

        candleSeries.setData(chartData);
        chart.timeScale().fitContent();

        const handleResize = () => {
          if (container && chart) {
            chart.applyOptions({ width: container.clientWidth });
          }
        };

        window.addEventListener('resize', handleResize);
        chart._resizeHandler = handleResize;

      } catch (err) {
        console.error("Candle Chart Error:", err);
        setError(`Chart initialization failed: ${err.message}`);
        if (onFallback) setTimeout(onFallback, 3000);
      }
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      if (chart) {
        if (chart._resizeHandler) window.removeEventListener('resize', chart._resizeHandler);
        chart.remove();
      }
    };
  }, [chartData, loading, error, isDarkMode]);

  if (loading) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl">
        <Loader2 size={24} className="animate-spin text-blue-500" />
        <span className="text-sm font-medium">Fetching candle data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center gap-2 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl p-4 text-center">
        <AlertCircle size={24} className="text-rose-500" />
        <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</span>
        <span className="text-xs text-slate-400 mt-1">Switching back to line chart...</span>
      </div>
    );
  }

  return <div ref={chartContainerRef} className="w-full h-64" />;
};

export default CoinCandleChart;
