import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse space-y-3">
    <div className="flex justify-between items-center">
      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-750 rounded-xl"></div>
      <div className="w-20 h-4 bg-slate-200 dark:bg-slate-750 rounded-full"></div>
    </div>
    <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-750 rounded-md"></div>
    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-750 rounded-md"></div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-pulse">
    <div className="h-12 bg-slate-100 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center">
      <div className="w-full grid grid-cols-4 gap-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/4"></div>
      </div>
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-700">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 px-6 flex items-center">
          <div className="w-full grid grid-cols-4 gap-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-2/3"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const DetailSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse space-y-6">
    <div className="flex justify-between items-start">
      <div className="space-y-2 w-1/3">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-2/3"></div>
      </div>
      <div className="w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
    </div>
    <div className="border-t border-slate-100 dark:border-slate-700 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-2/3"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-2/3"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-2/3"></div>
      </div>
    </div>
    <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/4"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
    </div>
  </div>
);
