"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Edit,
  Eye,
  Minus,
  Trash2,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

import type { TradeFormTrade } from "@/components/AddTradeModal";
import { TradesEmptyState } from "@/components/BeautifulEmptyStates";
import { SymbolLogo } from "@/components/symbol-logo";
import { TradeRecapCard } from "@/components/TradeRecapCard";

type ResultKey = "WIN" | "LOSS" | "BREAKEVEN" | "PENDING";

function toResultKey(status: TradeFormTrade["status"]): ResultKey {
  if (status === "PROFIT") return "WIN";
  if (status === "LOSS") return "LOSS";
  if (status === "BREAKEVEN") return "BREAKEVEN";
  return "PENDING";
}

function getResultConfig(result: ResultKey) {
  const configs = {
    WIN: { icon: CheckCircle2, bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    LOSS: { icon: XCircle, bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400" },
    BREAKEVEN: { icon: Minus, bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-400" },
    PENDING: { icon: AlertCircle, bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
  } as const;
  return configs[result] ?? configs.PENDING;
}

function calcRr(trade: TradeFormTrade) {
  if (!trade.entryPrice || !trade.exitPrice || !trade.stopLoss) return 0;
  const risk = trade.side === "LONG" ? trade.entryPrice - trade.stopLoss : trade.stopLoss - trade.entryPrice;
  const reward = trade.side === "LONG" ? trade.exitPrice - trade.entryPrice : trade.entryPrice - trade.exitPrice;
  if (risk <= 0) return 0;
  return reward / risk;
}

export default function TradeListView({
  date,
  trades,
  onAddTrade,
  onQuickAddTrade,
  onDuplicateTrade,
  onEditTrade,
  onDeleteTrade,
  onAddJournal,
  onViewJournal,
}: {
  date: string;
  trades: TradeFormTrade[];
  onAddTrade: () => void;
  onQuickAddTrade?: () => void;
  onDuplicateTrade?: (trade: TradeFormTrade) => void;
  onEditTrade: (trade: TradeFormTrade) => void;
  onDeleteTrade: (id: number) => void;
  onAddJournal?: (trade: TradeFormTrade) => void;
  onViewJournal?: (journalEntryId: number) => void;
}) {
  const [selectedTrade, setSelectedTrade] = useState<TradeFormTrade | null>(null);
  const [recapTrade, setRecapTrade] = useState<TradeFormTrade | null>(null);

  const daySummary = useMemo(() => {
    const mapped = trades.map((t) => ({ ...t, result: toResultKey(t.status), riskReward: calcRr(t), pnl: t.resultUsd }));
    return {
      totalTrades: mapped.length,
      wins: mapped.filter((t) => t.result === "WIN").length,
      losses: mapped.filter((t) => t.result === "LOSS").length,
      breakeven: mapped.filter((t) => t.result === "BREAKEVEN").length,
      pending: mapped.filter((t) => t.result === "PENDING").length,
      totalPnL: mapped.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0),
      avgRR:
        mapped.length > 0
          ? (mapped.reduce((sum, t) => sum + (Number(t.riskReward) || 0), 0) / mapped.length).toFixed(2)
          : "0",
    };
  }, [trades]);

  return (
    <div className="min-w-0 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-w-0 rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4 backdrop-blur-xl sm:p-6 dark:border-slate-700 dark:from-slate-900/90 dark:to-slate-900/50"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/20 p-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{daySummary.totalTrades} trades logged</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {onQuickAddTrade ? (
              <button
                onClick={onQuickAddTrade}
                className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-500 transition-all hover:bg-emerald-500/20 sm:w-auto"
              >
                Quick Entry
              </button>
            ) : null}
            <button
              onClick={onAddTrade}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-teal-700 sm:w-auto"
            >
              + Add Trade
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
          <div className="rounded-lg bg-slate-100 p-3 text-center dark:bg-slate-800/30"><div className="font-mono text-2xl font-bold text-emerald-500 dark:text-emerald-400">{daySummary.wins}</div><div className="text-xs text-slate-500">Wins</div></div>
          <div className="rounded-lg bg-slate-100 p-3 text-center dark:bg-slate-800/30"><div className="font-mono text-2xl font-bold text-rose-500 dark:text-rose-400">{daySummary.losses}</div><div className="text-xs text-slate-500">Losses</div></div>
          <div className="rounded-lg bg-slate-100 p-3 text-center dark:bg-slate-800/30"><div className="font-mono text-2xl font-bold text-slate-500 dark:text-slate-400">{daySummary.breakeven}</div><div className="text-xs text-slate-500">Breakeven</div></div>
          <div className="rounded-lg bg-slate-100 p-3 text-center dark:bg-slate-800/30"><div className={`font-mono text-2xl font-bold ${daySummary.totalPnL >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>${Math.abs(daySummary.totalPnL).toFixed(2)}</div><div className="text-xs text-slate-500">P&L</div></div>
          <div className="rounded-lg bg-slate-100 p-3 text-center dark:bg-slate-800/30"><div className="font-mono text-2xl font-bold text-blue-500 dark:text-blue-400">{daySummary.avgRR}</div><div className="text-xs text-slate-500">Avg R:R</div></div>
          <div className="rounded-lg bg-slate-100 p-3 text-center dark:bg-slate-800/30"><div className="font-mono text-2xl font-bold text-purple-500 dark:text-purple-400">{daySummary.totalTrades > 0 ? ((daySummary.wins / daySummary.totalTrades) * 100).toFixed(0) : 0}%</div><div className="text-xs text-slate-500">Win Rate</div></div>
        </div>
      </motion.div>

      {trades.length === 0 ? (
        <TradesEmptyState onAddTrade={onAddTrade} />
      ) : (
        <div className="space-y-4">
          {trades.map((trade, index) => (
            <TradeCard
              key={trade.id || index}
              trade={trade}
              delay={index * 0.05}
              onEdit={() => onEditTrade(trade)}
              onDuplicate={() => onDuplicateTrade?.(trade)}
              onDelete={() => onDeleteTrade(trade.id)}
              onView={() => setSelectedTrade(trade)}
              onAddJournal={() => onAddJournal?.(trade)}
              onViewJournal={() => {
                if (trade.journalEntryId) onViewJournal?.(trade.journalEntryId);
              }}
              onRecap={() => setRecapTrade(trade)}
            />
          ))}
        </div>
      )}

      {selectedTrade ? (
        <div className="hidden">{selectedTrade.id}</div>
      ) : null}
      {recapTrade ? (
        <TradeRecapCard
          trade={recapTrade}
          screenshot={recapTrade.screenshots?.[0]}
          onClose={() => setRecapTrade(null)}
        />
      ) : null}
    </div>
  );
}

function TradeCard({
  trade,
  delay,
  onEdit,
  onDuplicate,
  onDelete,
  onView,
  onAddJournal,
  onViewJournal,
  onRecap,
}: {
  trade: TradeFormTrade;
  delay: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onView: () => void;
  onAddJournal: () => void;
  onViewJournal: () => void;
  onRecap: () => void;
}) {
  const result = toResultKey(trade.status);
  const config = getResultConfig(result);
  const Icon = config.icon;
  const pnl = Number(trade.resultUsd) || 0;
  const isProfitable = pnl > 0;
  const rr = calcRr(trade);
  const emotions = (trade.emotions ?? "").split(",").map((e) => e.trim()).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -2 }}
      className={`group min-w-0 overflow-hidden rounded-xl border bg-white backdrop-blur-xl transition-all hover:shadow-lg dark:bg-slate-900/50 ${config.border}`}
    >
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-xl p-3 ${config.bg}`}><Icon className={`h-6 w-6 ${config.text}`} /></div>

            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <SymbolLogo symbol={trade.symbol} size={24} />
                <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">{trade.symbol}</span>
                {trade.source === "BYBIT" ? (
                  <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300">
                    BYBIT
                  </span>
                ) : null}
                <span className={`rounded px-2 py-1 text-xs font-semibold ${trade.side === "LONG" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                  {trade.side === "LONG" ? <><TrendingUp className="mr-1 inline h-3 w-3" />LONG</> : <><TrendingDown className="mr-1 inline h-3 w-3" />SHORT</>}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400 sm:gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(trade.tradeDate).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {trade.setup ? <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800/50">{trade.setup}</span> : null}
                {trade.grade ? (
                  <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500 dark:text-emerald-300">
                    Grade {trade.grade}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className={`font-mono text-2xl font-bold ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}>
              {isProfitable ? "+" : ""}{pnl.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">P&L</div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div><div className="mb-1 text-xs text-slate-500">Entry</div><div className="font-mono text-sm text-slate-700 dark:text-slate-300">{trade.entryPrice ? `$${trade.entryPrice.toFixed(2)}` : "-"}</div></div>
          <div><div className="mb-1 text-xs text-slate-500">Exit</div><div className="font-mono text-sm text-slate-700 dark:text-slate-300">{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "Pending"}</div></div>
          <div><div className="mb-1 text-xs text-slate-500">Stop Loss</div><div className="font-mono text-sm text-rose-400">{trade.stopLoss ? `$${trade.stopLoss.toFixed(2)}` : "-"}</div></div>
          <div><div className="mb-1 text-xs text-slate-500">R:R</div><div className={`font-mono text-sm ${rr >= 2 ? "text-emerald-400" : rr >= 1 ? "text-blue-400" : "text-amber-400"}`}>1:{rr ? rr.toFixed(2) : "N/A"}</div></div>
        </div>

        {emotions.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {emotions.map((emotion) => (
              <span key={emotion} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">{emotion}</span>
            ))}
          </div>
        ) : null}

        {trade.notes ? (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700/50 dark:bg-slate-800/30">
            <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{trade.notes}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/50">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onView} className="flex items-center gap-2 rounded-lg px-4 py-2 text-emerald-400 transition-colors hover:bg-emerald-500/10">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">View Details</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            {trade.journalEntryId && onViewJournal ? (
              <button onClick={onViewJournal} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-500 transition-colors hover:bg-blue-500/20 dark:text-blue-300">
                View Journal
              </button>
            ) : onAddJournal ? (
              <button onClick={onAddJournal} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-500 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300">
                Add Journal
              </button>
            ) : null}
            <button onClick={onRecap} className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm font-medium text-purple-500 transition-colors hover:bg-purple-500/20 dark:text-purple-300">
              Recap Card
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button onClick={onDuplicate} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-500 dark:hover:bg-slate-800 dark:hover:text-emerald-300" title="Duplicate">
              <Copy className="h-4 w-4" />
            </button>
            <button onClick={onEdit} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-500 dark:hover:bg-slate-800 dark:hover:text-blue-400"><Edit className="h-4 w-4" /></button>
            <button onClick={onDelete} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800 dark:hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
