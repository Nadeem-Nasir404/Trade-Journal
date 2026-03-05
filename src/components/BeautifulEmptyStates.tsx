"use client";

import { Plus, Sparkles, TrendingUp } from "lucide-react";

export function TradesEmptyState({ onAddTrade }: { onAddTrade: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 opacity-50 blur-2xl" />
        <div className="relative rounded-full border-4 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
          <TrendingUp className="h-12 w-12 text-emerald-600" />
        </div>
        <div className="absolute -right-1 -top-1 rounded-full bg-emerald-500 p-1.5 text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">No trades yet</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">Start logging your trades to track performance and improve your edge.</p>
      <button onClick={onAddTrade} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-teal-700">
        <Plus className="h-4 w-4" />
        Add First Trade
      </button>
    </div>
  );
}

export function JournalEmptyState({ onNewEntry }: { onNewEntry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 opacity-50 blur-2xl" />
        <div className="relative rounded-full border-4 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-5xl">💚</div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">No entries found</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">Start journaling to track what worked, what to improve, and your key lessons.</p>
      <button onClick={onNewEntry} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-teal-700">
        <Plus className="h-4 w-4" />
        Create First Entry
      </button>
    </div>
  );
}
