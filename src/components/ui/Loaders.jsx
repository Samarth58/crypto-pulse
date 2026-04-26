import React from 'react';
import { Loader2, SearchX } from 'lucide-react';

const SkeletonAssetCard = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full w-10" />
        </div>
      </div>
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-16" />
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-12" />
      <div className="flex flex-col items-end gap-1">
        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full w-14" />
        <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full w-16" />
      </div>
    </div>
  </div>
);

export const SkeletonRow = ({ rows = 1 }) => {
  return (
    <div className="w-full">
      {/* Mobile Card Skeleton */}
      <div className="md:hidden space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonAssetCard key={i} />
        ))}
      </div>

      {/* Desktop Table Skeleton */}
      <div className="hidden md:block">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 sm:px-4 lg:px-6 py-3 border-b border-slate-200 dark:border-slate-800 last:border-0 animate-pulse" role="status" aria-label="Loading row">
            <div className="w-5 h-4 bg-slate-200 dark:bg-slate-800 rounded flex-shrink-0" />
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-24 sm:w-28" />
              <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full w-12" />
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-16 sm:w-20 ml-auto" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-14 hidden md:block" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-20 hidden lg:block" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const SkeletonCard = () => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 animate-pulse" role="status" aria-label="Loading card">
    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
    <div className="flex flex-col gap-1.5 w-full">
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
      <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full w-10" />
    </div>
  </div>
);

export const SectionLoader = () => (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl" role="status" aria-label="Updating section">
    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    <span className="sr-only">Updating data...</span>
  </div>
);

export const EmptyState = ({ message = "No data available", subMessage }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl min-h-[300px]" role="alert">
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6 shadow-inner">
      <SearchX className="w-10 h-10 text-slate-300 dark:text-slate-600" />
    </div>
    <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{message}</h3>
    {subMessage && (
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
        {subMessage}
      </p>
    )}
  </div>
);
