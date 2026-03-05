"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Hash,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SymbolLogo } from "@/components/symbol-logo";

type TradeStatus = "RUNNING" | "PROFIT" | "LOSS" | "BREAKEVEN";
type TradeSide = "LONG" | "SHORT";

export type TradeFormTrade = {
  id: number;
  tradeDate: string;
  source?: string | null;
  externalId?: string | null;
  symbol: string;
  side: TradeSide;
  entryPrice: number | null;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  quantity: number;
  riskUsd: number;
  resultUsd: number;
  status: TradeStatus;
  setup: string | null;
  strategy: string | null;
  emotions: string | null;
  notes: string | null;
  journalEntryId?: number | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSaved: () => Promise<void> | void;
  initialTrade?: TradeFormTrade | null;
};

type ResultOption = {
  value: TradeStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: string;
};

const resultOptions: ResultOption[] = [
  { value: "PROFIT", label: "Win", icon: CheckCircle2, active: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" },
  { value: "LOSS", label: "Loss", icon: XCircle, active: "bg-rose-500 text-white shadow-lg shadow-rose-500/30" },
  { value: "BREAKEVEN", label: "Break Even", icon: Minus, active: "bg-slate-500 text-white shadow-lg shadow-slate-500/30" },
  { value: "RUNNING", label: "Pending", icon: AlertCircle, active: "bg-amber-500 text-white shadow-lg shadow-amber-500/30" },
];

const emotionOptions = ["Confident", "Anxious", "Greedy", "Fearful", "Calm", "Impulsive", "Patient", "FOMO"];

function toNum(v: string) {
  if (!v.trim()) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function AddTradeModal({ isOpen, onClose, selectedDate, onSaved, initialTrade }: Props) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [symbolSuggestions, setSymbolSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    symbol: "",
    direction: "LONG" as TradeSide,
    entry: "",
    exit: "",
    stopLoss: "",
    takeProfit: "",
    quantity: "",
    result: "RUNNING" as TradeStatus,
    setup: "",
    strategy: "",
    notes: "",
    emotions: [] as string[],
  });

  useEffect(() => {
    if (!initialTrade) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      symbol: initialTrade.symbol,
      direction: initialTrade.side,
      entry: initialTrade.entryPrice?.toString() ?? "",
      exit: initialTrade.exitPrice?.toString() ?? "",
      stopLoss: initialTrade.stopLoss?.toString() ?? "",
      takeProfit: initialTrade.takeProfit?.toString() ?? "",
      quantity: initialTrade.quantity?.toString() ?? "1",
      result: initialTrade.status,
      setup: initialTrade.setup ?? "",
      strategy: initialTrade.strategy ?? "",
      notes: initialTrade.notes ?? "",
      emotions: (initialTrade.emotions ?? "").split(",").map((e) => e.trim()).filter(Boolean),
    });
  }, [initialTrade]);

  useEffect(() => {
    const q = formData.symbol.trim();
    if (!q) return;
    const id = setTimeout(async () => {
      const res = await fetch(`/api/symbols/search?q=${encodeURIComponent(q)}`);
      const json = (await res.json()) as { symbols?: string[] };
      setSymbolSuggestions(json.symbols ?? []);
    }, 180);
    return () => clearTimeout(id);
  }, [formData.symbol]);

  const riskReward = useMemo(() => {
    const entryPrice = toNum(formData.entry);
    const exitPrice = toNum(formData.exit);
    const stopPrice = toNum(formData.stopLoss);
    if (!entryPrice || !exitPrice || !stopPrice) return { risk: 0, reward: 0, ratio: 0 };

    if (formData.direction === "LONG") {
      const risk = entryPrice - stopPrice;
      const reward = exitPrice - entryPrice;
      return { risk, reward, ratio: risk > 0 ? reward / risk : 0 };
    }

    const risk = stopPrice - entryPrice;
    const reward = entryPrice - exitPrice;
    return { risk, reward, ratio: risk > 0 ? reward / risk : 0 };
  }, [formData.direction, formData.entry, formData.exit, formData.stopLoss]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setSaveError("");

    if (!formData.symbol.trim()) {
      setSaveError("Symbol is required.");
      return;
    }
    if (!formData.entry.trim()) {
      setSaveError("Entry price is required.");
      return;
    }
    if (!formData.stopLoss.trim()) {
      setSaveError("Stop loss is required.");
      return;
    }
    if (!formData.quantity.trim()) {
      setSaveError("Quantity is required.");
      return;
    }
    if (formData.result !== "RUNNING" && !formData.exit.trim()) {
      setSaveError("Exit price is required for closed trades.");
      return;
    }

    const entry = toNum(formData.entry);
    const exit = toNum(formData.exit);
    const stop = toNum(formData.stopLoss);
    const qty = toNum(formData.quantity) || 1;

    const perUnitRisk = entry && stop ? Math.abs(entry - stop) : 0;
    const riskUsd = perUnitRisk * qty;
    const pnlPerUnit = entry && exit ? (formData.direction === "LONG" ? exit - entry : entry - exit) : 0;
    const resultUsd = Number((pnlPerUnit * qty).toFixed(2));

    const payload = {
      tradeDate: selectedDate,
      symbol: formData.symbol,
      side: formData.direction,
      entryPrice: formData.entry || null,
      exitPrice: formData.exit || null,
      stopLoss: formData.stopLoss || null,
      takeProfit: formData.takeProfit || null,
      quantity: qty,
      riskUsd,
      resultUsd,
      status: formData.result,
      setup: formData.setup,
      strategy: formData.strategy,
      emotions: formData.emotions.join(", "),
      notes: formData.notes,
    };

    setSaving(true);
    const method = initialTrade ? "PATCH" : "POST";
    const url = initialTrade ? `/api/trades/${initialTrade.id}` : "/api/trades";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
      setSaveError(json?.error || json?.message || "Failed to save trade.");
      return;
    }
    await onSaved();
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="pointer-events-auto max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-6 py-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/20 p-2"><TrendingUp className="h-5 w-5 text-emerald-400" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{initialTrade ? "Edit Trade" : "Add Trade"}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                </div>
                <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5 text-slate-500 dark:text-slate-400" /></button>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="max-h-[calc(90vh-200px)] space-y-6 overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"><Hash className="mr-1 inline h-4 w-4" />Symbol / Ticker</label>
                    <input
                      type="text"
                      value={formData.symbol}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setFormData((p) => ({ ...p, symbol: value }));
                        if (!value.trim()) setSymbolSuggestions([]);
                      }}
                      placeholder="BTCUSD, AAPL, EURUSD..."
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-mono text-lg text-slate-900 placeholder-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                      required
                    />
                    {symbolSuggestions.length ? (
                      <div className="mt-2 max-h-32 overflow-auto rounded-md border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                        {symbolSuggestions.map((symbol) => (
                          <button key={symbol} type="button" onClick={() => setFormData((p) => ({ ...p, symbol }))} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                            <SymbolLogo symbol={symbol} size={18} />
                            {symbol}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Direction</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setFormData((p) => ({ ...p, direction: "LONG" }))} className={`rounded-xl px-4 py-3 font-semibold transition-all ${formData.direction === "LONG" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"}`}><TrendingUp className="mr-1 inline h-4 w-4" />Long</button>
                      <button type="button" onClick={() => setFormData((p) => ({ ...p, direction: "SHORT" }))} className={`rounded-xl px-4 py-3 font-semibold transition-all ${formData.direction === "SHORT" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"}`}><TrendingDown className="mr-1 inline h-4 w-4" />Short</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div><label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Entry Price</label><input type="number" step="0.01" value={formData.entry} onChange={(e) => setFormData((p) => ({ ...p, entry: e.target.value }))} placeholder="0.00" className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" required /></div>
                  <div><label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Exit Price</label><input type="number" step="0.01" value={formData.exit} onChange={(e) => setFormData((p) => ({ ...p, exit: e.target.value }))} placeholder="0.00" className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" /></div>
                  <div><label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Stop Loss</label><input type="number" step="0.01" value={formData.stopLoss} onChange={(e) => setFormData((p) => ({ ...p, stopLoss: e.target.value }))} placeholder="0.00" className="w-full rounded-xl border-2 border-rose-300 bg-white px-4 py-3 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-rose-900/30 dark:bg-slate-800/50 dark:text-white" required /></div>
                  <div><label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Take Profit</label><input type="number" step="0.01" value={formData.takeProfit} onChange={(e) => setFormData((p) => ({ ...p, takeProfit: e.target.value }))} placeholder="0.00" className="w-full rounded-xl border-2 border-emerald-300 bg-white px-4 py-3 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-emerald-900/30 dark:bg-slate-800/50 dark:text-white" /></div>
                </div>

                {riskReward.ratio > 0 ? (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="mb-1 text-xs text-slate-400">Risk/Reward Ratio</div>
                        <div className={`font-mono text-2xl font-bold ${riskReward.ratio >= 2 ? "text-emerald-400" : riskReward.ratio >= 1 ? "text-blue-400" : "text-amber-400"}`}>1 : {riskReward.ratio.toFixed(2)}</div>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <div className="mb-1">Risk: ${Math.abs(riskReward.risk).toFixed(2)}</div>
                        <div>Reward: ${riskReward.reward.toFixed(2)}</div>
                      </div>
                      <div className={`rounded-lg p-2 ${riskReward.ratio >= 2 ? "bg-emerald-500/20" : riskReward.ratio >= 1 ? "bg-blue-500/20" : "bg-amber-500/20"}`}><Target className={`h-6 w-6 ${riskReward.ratio >= 2 ? "text-emerald-400" : riskReward.ratio >= 1 ? "text-blue-400" : "text-amber-400"}`} /></div>
                    </div>
                  </motion.div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div><label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Position Size / Quantity</label><input type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))} placeholder="100" className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" required /></div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Trade Result</label>
                    <div className="grid grid-cols-4 gap-2">
                      {resultOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button key={option.value} type="button" onClick={() => setFormData((p) => ({ ...p, result: option.value }))} className={`rounded-xl px-3 py-3 font-semibold transition-all ${formData.result === option.value ? option.active : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"}`} title={option.label}>
                            <Icon className="mx-auto h-5 w-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Setup / Pattern</label>
                    <select value={formData.setup} onChange={(e) => setFormData((p) => ({ ...p, setup: e.target.value }))} className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white">
                      <option value="">Select setup...</option>
                      <option value="Breakout">Breakout</option>
                      <option value="Pullback">Pullback</option>
                      <option value="Reversal">Reversal</option>
                      <option value="Trend Following">Trend Following</option>
                      <option value="Range Trading">Range Trading</option>
                      <option value="Support/Resistance">Support/Resistance</option>
                      <option value="Chart Pattern">Chart Pattern</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div><label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Strategy</label><input type="text" value={formData.strategy} onChange={(e) => setFormData((p) => ({ ...p, strategy: e.target.value }))} placeholder="Scalping, Day Trade, Swing..." className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" /></div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">How did you feel during this trade?</label>
                  <div className="flex flex-wrap gap-2">
                    {emotionOptions.map((emotion) => {
                      const active = formData.emotions.includes(emotion);
                      return (
                        <button
                          key={emotion}
                          type="button"
                          onClick={() => {
                            const emotions = active ? formData.emotions.filter((e) => e !== emotion) : [...formData.emotions, emotion];
                            setFormData((p) => ({ ...p, emotions }));
                          }}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${active ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"}`}
                        >
                          {emotion}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Trade Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} placeholder="What was your thesis? What went well? What could be improved?" rows={4} className="w-full resize-none rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" />
                </div>
                {saveError ? (
                  <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
                    {saveError}
                  </p>
                ) : null}
              </form>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/50">
                <button type="button" onClick={onClose} className="rounded-lg px-6 py-2.5 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">Cancel</button>
                <Button type="button" onClick={() => void handleSubmit()} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                  {saving ? "Saving..." : "Save Trade"}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
