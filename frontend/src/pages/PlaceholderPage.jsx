import React from 'react';

export default function PlaceholderPage({ title }) {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center p-8 text-center dashboard-card border-dashed bg-transparent shadow-none dark:border-slate-700">
      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
        {/* Simple spanner icon placeholder */}
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      </div>
      <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">{title}</h2>
      <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
        This section is currently under construction for the Hackathon. Check back later to see the live integration!
      </p>
    </div>
  );
}
