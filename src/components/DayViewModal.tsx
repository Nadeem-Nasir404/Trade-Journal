"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Minus, Plus, X, XCircle } from "lucide-react";

type DayTrade = {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  resultUsd: number;
  riskUsd: number;
  notes: string | null;
  tradeDate: string;
  journalEntryId?: number | null;
};

type Props = {
  isOpen: boolean;
  dateLabel: string;
  trades: DayTrade[];
  onClose: () => void;
  onAddJournal: (trade: DayTrade) => void;
  onViewJournal: (journalEntryId: number) => void;
};

function resultType(value: number) {
  if (value > 0) return "WIN";
  if (value < 0) return "LOSS";
  return "BREAKEVEN";
}

export function DayViewModal({ isOpen, dateLabel, trades, onClose, onAddJournal, onViewJournal }: Props) {
  const wins = trades.filter((t) => t.resultUsd > 0).length;
  const losses = trades.filter((t) => t.resultUsd < 0).length;
  const breakeven = trades.filter((t) => t.resultUsd === 0).length;
  const totalPnl = trades.reduce((sum, t) => sum + t.resultUsd, 0);

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{dateLabel}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{trades.length} trades logged</p>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Wins" value={wins} tone="text-emerald-500" />
              <Stat label="Losses" value={losses} tone="text-rose-500" />
              <Stat label="Breakeven" value={breakeven} tone="text-slate-500" />
              <Stat label="P&L" value={`${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}`} tone={totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"} />
            </div>

            <div className="space-y-3">
              {trades.length ? (
                trades.map((trade) => {
                  const type = resultType(trade.resultUsd);
                  return (
                    <div key={trade.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {type === "WIN" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : null}
                          {type === "LOSS" ? <XCircle className="h-5 w-5 text-rose-500" /> : null}
                          {type === "BREAKEVEN" ? <Minus className="h-5 w-5 text-slate-500" /> : null}
                          <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">{trade.symbol}</p>
                          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${trade.side === "LONG" ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"}`}>{trade.side}</span>
                        </div>
                        <p className={`font-mono text-lg font-bold ${trade.resultUsd >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {trade.resultUsd >= 0 ? "+" : ""}{trade.resultUsd.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Risk: ${trade.riskUsd.toFixed(2)}</p>
                      {trade.notes ? <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{trade.notes}</p> : null}
                      <div className="mt-3 flex items-center gap-2">
                        {trade.journalEntryId ? (
                          <button
                            className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-500 dark:text-blue-300"
                            onClick={() => onViewJournal(trade.journalEntryId as number)}
                          >
                            View Journal
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-500 dark:text-emerald-300"
                            onClick={() => onAddJournal(trade)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Journal
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No trades this day.</p>
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-900">
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
