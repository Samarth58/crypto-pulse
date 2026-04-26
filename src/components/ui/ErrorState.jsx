import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorState = ({ 
  variant = 'partial', // 'full' | 'partial'
  message = "Failed to load data", 
  onRetry 
}) => {
  const isFull = variant === 'full';

  return (
    <div 
      className={`flex flex-col items-center justify-center text-center ${
        isFull ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl px-6 py-16' : 'p-6 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30'
      }`}
      role="alert"
    >
      <div className={`rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center ${isFull ? 'w-16 h-16 mb-4' : 'w-10 h-10 mb-3'}`}>
        <AlertTriangle className={`text-rose-500 ${isFull ? 'w-8 h-8' : 'w-5 h-5'}`} />
      </div>
      <p className={`font-bold text-rose-600 dark:text-rose-400 ${isFull ? 'text-lg mb-6' : 'text-sm mb-4'}`}>
        {message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className={`flex items-center gap-2 font-bold transition-all focus:ring-2 focus:ring-rose-500 focus:outline-none ${
            isFull 
              ? 'px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/25' 
              : 'px-4 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-sm'
          }`}
          aria-label="Retry loading data"
        >
          <RefreshCw className={isFull ? 'w-4 h-4' : 'w-3 h-3'} />
          Retry Request
        </button>
      )}
    </div>
  );
};
