"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Hash,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSelectedAccount } from "@/hooks/use-selected-account";
import { SymbolLogo } from "@/components/symbol-logo";
import { AnnotationEditor } from "@/components/AnnotationEditor";
import { ScreenshotUpload, type TradeScreenshot } from "@/components/ScreenshotUpload";

type TradeStatus = "RUNNING" | "PROFIT" | "LOSS" | "BREAKEVEN";
type TradeSide = "LONG" | "SHORT";
type TradeTab = "BASIC" | "ANALYSIS" | "NOTES";

export type TradeAnalysis = {
  entryRetests: number;
  entryTimeframe: string;
  marketCondition: string;
  htfConfluence: string;
  confluences: string[];
};

export type TradeFormTrade = {
  id: number;
  source?: string | null;
  externalId?: string | null;
  accountId?: number | null;
  account?: { id: number; name: string; icon: string | null } | null;
  tradeDate: string;
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
  grade?: string | null;
  setup: string | null;
  strategy: string | null;
  analysis?: TradeAnalysis | null;
  emotions: string | null;
  notes: string | null;
  screenshots?: string[];
  journalEntryId?: number | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSaved: () => Promise<void> | void;
  initialTrade?: TradeFormTrade | null;
  mode?: "full" | "quick";
  duplicate?: boolean;
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
const timeframeOptions = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W"];
const marketConditionOptions = ["Trending", "Range", "Breakout", "Reversal", "Volatile", "Low Liquidity"];
const confluenceGroups = [
  {
    title: "Favorites",
    accent: "amber",
    items: ["Fibonacci", "Order Block", "Fair Value Gap", "Break of Structure", "Trend", "Liquidity Sweep"],
  },
  {
    title: "Order Flow",
    accent: "emerald",
    items: ["Absorption", "Delta Shift", "Bid/Ask Imbalance", "Stacked Orders"],
  },
  {
    title: "Technical Analysis",
    accent: "blue",
    items: ["VWAP", "RSI Divergence", "Moving Average", "Trendline Retest"],
  },
  {
    title: "Market Structure",
    accent: "violet",
    items: ["Higher High", "Lower Low", "Choch", "Breaker Block"],
  },
  {
    title: "Session / Time",
    accent: "rose",
    items: ["London Open", "NY Open", "Session Sweep", "Kill Zone"],
  },
];

const defaultAnalysis: TradeAnalysis = {
  entryRetests: 0,
  entryTimeframe: "15m",
  marketCondition: "",
  htfConfluence: "",
  confluences: [],
};

function toNum(v: string) {
  if (!v.trim()) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getAccentClasses(accent: string) {
  switch (accent) {
    case "amber":
      return "border-amber-300/30 bg-amber-500/5 text-amber-600 dark:text-amber-300";
    case "blue":
      return "border-blue-300/30 bg-blue-500/5 text-blue-600 dark:text-blue-300";
    case "violet":
      return "border-violet-300/30 bg-violet-500/5 text-violet-600 dark:text-violet-300";
    case "rose":
      return "border-rose-300/30 bg-rose-500/5 text-rose-600 dark:text-rose-300";
    case "emerald":
    default:
      return "border-emerald-300/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-300";
  }
}

export default function AddTradeModal({ isOpen, onClose, selectedDate, onSaved, initialTrade, mode = "full", duplicate = false }: Props) {
  const { selectedAccountId, setSelectedAccountId } = useSelectedAccount();
  const isQuick = mode === "quick";
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [symbolSuggestions, setSymbolSuggestions] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: number; name: string; icon: string | null; currentBalance: number }>>([]);
  const [screenshots, setScreenshots] = useState<TradeScreenshot[]>([]);
  const [annotating, setAnnotating] = useState<TradeScreenshot | null>(null);
  const [activeTab, setActiveTab] = useState<TradeTab>("BASIC");
  const [openConfluenceGroups, setOpenConfluenceGroups] = useState<Record<string, boolean>>({
    Favorites: true,
    "Order Flow": false,
    "Technical Analysis": false,
    "Market Structure": false,
    "Session / Time": false,
  });
  const [formData, setFormData] = useState({
    accountId: "",
    symbol: "",
    direction: "LONG" as TradeSide,
    entry: "",
    exit: "",
    stopLoss: "",
    takeProfit: "",
    quantity: "",
    result: "RUNNING" as TradeStatus,
    grade: "",
    setup: "",
    strategy: "",
    analysis: defaultAnalysis,
    notes: "",
    emotions: [] as string[],
  });

  useEffect(() => {
    if (!initialTrade) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      accountId: initialTrade.accountId ? String(initialTrade.accountId) : "",
      symbol: initialTrade.symbol,
      direction: initialTrade.side,
      entry: initialTrade.entryPrice?.toString() ?? "",
      exit: initialTrade.exitPrice?.toString() ?? "",
      stopLoss: initialTrade.stopLoss?.toString() ?? "",
      takeProfit: initialTrade.takeProfit?.toString() ?? "",
      quantity: initialTrade.quantity?.toString() ?? "1",
      result: initialTrade.status,
      grade: initialTrade.grade ?? "",
      setup: initialTrade.setup ?? "",
      strategy: initialTrade.strategy ?? "",
      analysis: {
        ...defaultAnalysis,
        ...(initialTrade.analysis ?? {}),
      },
      notes: initialTrade.notes ?? "",
      emotions: (initialTrade.emotions ?? "").split(",").map((e) => e.trim()).filter(Boolean),
    });
    setScreenshots((initialTrade.screenshots ?? []).map((url, idx) => ({ id: `${idx}-${url}`, preview: url, name: `Screenshot ${idx + 1}`, type: "link", url })));
  }, [initialTrade]);

  useEffect(() => {
    if (!isOpen || initialTrade) return;
    const timeoutId = window.setTimeout(() => {
      setFormData({
        accountId: selectedAccountId ? String(selectedAccountId) : "",
        symbol: "",
        direction: "LONG",
        entry: "",
        exit: "",
        stopLoss: "",
        takeProfit: "",
        quantity: "",
        result: "RUNNING",
        grade: "",
        setup: "",
        strategy: "",
        analysis: defaultAnalysis,
        notes: "",
        emotions: [],
      });
      setActiveTab("BASIC");
      setSaveError("");
      setScreenshots([]);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, initialTrade, selectedAccountId]);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(async () => {
      const res = await fetch("/api/accounts?status=ACTIVE", { cache: "no-store" });
      const json = (await res.json()) as { accounts?: Array<{ id: number; name: string; icon: string | null; currentBalance: number }> };
      const nextAccounts = json.accounts ?? [];
      setAccounts(nextAccounts);
      setFormData((prev) => ({
        ...prev,
        accountId:
          prev.accountId ||
          (initialTrade?.accountId ? String(initialTrade.accountId) : "") ||
          (selectedAccountId ? String(selectedAccountId) : "") ||
          (nextAccounts[0] ? String(nextAccounts[0].id) : ""),
      }));
    }, 10);
    return () => clearTimeout(id);
  }, [isOpen, initialTrade?.accountId, selectedAccountId]);

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

  function updateAnalysis<K extends keyof TradeAnalysis>(key: K, value: TradeAnalysis[K]) {
    setFormData((prev) => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        [key]: value,
      },
    }));
  }

  function toggleConfluence(item: string) {
    setFormData((prev) => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        confluences: prev.analysis.confluences.includes(item)
          ? prev.analysis.confluences.filter((value) => value !== item)
          : [...prev.analysis.confluences, item],
      },
    }));
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setSaveError("");

    if (!formData.symbol.trim()) {
      setSaveError("Symbol is required.");
      setActiveTab("BASIC");
      return;
    }
    if (!formData.accountId.trim()) {
      setSaveError("Account is required.");
      setActiveTab("BASIC");
      return;
    }
    if (!formData.entry.trim()) {
      setSaveError("Entry price is required.");
      setActiveTab("BASIC");
      return;
    }
    if (!formData.stopLoss.trim()) {
      setSaveError("Stop loss is required.");
      setActiveTab("BASIC");
      return;
    }
    if (!formData.quantity.trim()) {
      setSaveError("Quantity is required.");
      setActiveTab("BASIC");
      return;
    }
    if (formData.result !== "RUNNING" && !formData.exit.trim()) {
      setSaveError("Exit price is required for closed trades.");
      setActiveTab("BASIC");
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
      accountId: Number(formData.accountId),
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
      analysis: formData.analysis,
      grade: formData.grade,
      emotions: formData.emotions.join(", "),
      notes: formData.notes,
      screenshots: [] as string[],
    };

    const uploadedUrls: string[] = [];
    for (const shot of screenshots) {
      if (shot.file) {
        const uploadData = new FormData();
        uploadData.append("file", shot.file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
        if (!uploadRes.ok) {
          const uploadJson = (await uploadRes.json().catch(() => null)) as { message?: string } | null;
          setSaveError(uploadJson?.message ?? "Failed to upload screenshot.");
          return;
        }
        const uploadJson = (await uploadRes.json()) as { url: string };
        uploadedUrls.push(uploadJson.url);
      } else if (shot.url) {
        uploadedUrls.push(shot.url);
      } else if (shot.preview.startsWith("/uploads/")) {
        uploadedUrls.push(shot.preview);
      }
    }
    payload.screenshots = uploadedUrls;

    setSaving(true);
    const method = initialTrade && !duplicate ? "PATCH" : "POST";
    const url = initialTrade && !duplicate ? `/api/trades/${initialTrade.id}` : "/api/trades";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
      setSaveError(json?.error || json?.message || "Failed to save trade.");
      return;
    }
    setSelectedAccountId(Number(formData.accountId));
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
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {duplicate ? "Duplicate Trade" : initialTrade ? "Edit Trade" : "Add Trade"}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                </div>
                <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5 text-slate-500 dark:text-slate-400" /></button>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="max-h-[calc(90vh-200px)] space-y-6 overflow-y-auto p-6">
                {!isQuick ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-2 dark:border-slate-700 dark:bg-slate-800/30">
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: "BASIC", label: "Basic" },
                        { id: "ANALYSIS", label: "Analysis" },
                        { id: "NOTES", label: "Notes" },
                      ] as Array<{ id: TradeTab; label: string }>).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                            activeTab === tab.id
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                              : "text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeTab === "BASIC" ? (
                  <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Trading Account</label>
                    <select value={formData.accountId} onChange={(e) => setFormData((p) => ({ ...p, accountId: e.target.value }))} className="mb-4 h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white">
                      <option value="">Select account...</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {(account.icon ?? "??")} {account.name} - ${account.currentBalance.toLocaleString()}
                        </option>
                      ))}
                    </select>

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

                {!isQuick ? (
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
                ) : null}
                  </>
                ) : null}

                {!isQuick && activeTab === "ANALYSIS" ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr_1fr]">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Entry Retests</label>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => updateAnalysis("entryRetests", Math.max(0, formData.analysis.entryRetests - 1))} className="h-11 w-11 rounded-xl border border-slate-300 bg-white text-xl text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">-</button>
                          <div className="flex h-11 min-w-[56px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 font-mono text-lg dark:border-slate-700 dark:bg-slate-800">{formData.analysis.entryRetests}</div>
                          <button type="button" onClick={() => updateAnalysis("entryRetests", formData.analysis.entryRetests + 1)} className="h-11 w-11 rounded-xl border border-slate-300 bg-white text-xl text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">+</button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Entry Timeframe</label>
                        <select value={formData.analysis.entryTimeframe} onChange={(e) => updateAnalysis("entryTimeframe", e.target.value)} className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white">
                          {timeframeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Market Condition</label>
                        <select value={formData.analysis.marketCondition} onChange={(e) => updateAnalysis("marketCondition", e.target.value)} className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white">
                          <option value="">Select...</option>
                          {marketConditionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Trade Grade</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData((p) => ({ ...p, grade: e.target.value }))}
                        className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                      >
                        <option value="">Select grade...</option>
                        {["A+", "A", "B", "C", "D", "F"].map((grade) => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">HTF Confluence</label>
                      <input type="text" value={formData.analysis.htfConfluence} onChange={(e) => updateAnalysis("htfConfluence", e.target.value)} placeholder="Higher timeframe bias, major level, weekly structure..." className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Selected Confluences</span>
                        {formData.analysis.confluences.length ? formData.analysis.confluences.map((item) => (
                          <button key={item} type="button" onClick={() => toggleConfluence(item)} className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/25 dark:text-emerald-300">
                            {item} x
                          </button>
                        )) : <span className="text-xs text-slate-500 dark:text-slate-400">No confluences selected yet</span>}
                      </div>

                      <div className="space-y-3">
                        {confluenceGroups.map((group) => {
                          const groupOpen = openConfluenceGroups[group.title];
                          return (
                            <div key={group.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/60">
                              <button type="button" onClick={() => setOpenConfluenceGroups((prev) => ({ ...prev, [group.title]: !prev[group.title] }))} className="flex w-full items-center justify-between px-4 py-3 text-left">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{group.title}</span>
                                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${groupOpen ? "rotate-180" : ""}`} />
                              </button>
                              {groupOpen ? (
                                <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-700">
                                  <div className="flex flex-wrap gap-2">
                                    {group.items.map((item) => {
                                      const active = formData.analysis.confluences.includes(item);
                                      return (
                                        <button key={item} type="button" onClick={() => toggleConfluence(item)} className={`rounded-full border px-3 py-2 text-sm font-medium transition-all ${active ? getAccentClasses(group.accent) : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                                          {item}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {!isQuick && activeTab === "NOTES" ? (
                  <>
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
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Screenshots (Optional)</label>
                  <ScreenshotUpload
                    screenshots={screenshots}
                    onChange={setScreenshots}
                    maxFiles={10}
                    onAnnotate={(shot) => setAnnotating(shot)}
                  />
                </div>
                  </>
                ) : null}
                {saveError ? (
                  <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
                    {saveError}
                  </p>
                ) : null}
              </form>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/50">
                <button type="button" onClick={onClose} className="rounded-lg px-6 py-2.5 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">Cancel</button>
                <div className="flex items-center gap-3">
                  {!isQuick && activeTab !== "NOTES" ? (
                    <Button type="button" variant="outline" onClick={() => setActiveTab(activeTab === "BASIC" ? "ANALYSIS" : "NOTES")}>
                      Next
                    </Button>
                  ) : null}
                  <Button type="button" onClick={() => void handleSubmit()} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                    {saving ? "Saving..." : "Save Trade"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
          {annotating ? (
            <AnnotationEditor
              image={annotating.preview}
              onClose={() => setAnnotating(null)}
              onSave={(blob) => {
                const file = new File([blob], "annotated.png", { type: "image/png" });
                const preview = URL.createObjectURL(file);
                setScreenshots((prev) =>
                  prev.map((s) =>
                    s.id === annotating.id
                      ? { ...s, file, preview, name: "Annotated Screenshot", type: "upload", url: undefined }
                      : s,
                  ),
                );
                setAnnotating(null);
              }}
            />
          ) : null}
        </>
      ) : null}
    </AnimatePresence>
  );
}
