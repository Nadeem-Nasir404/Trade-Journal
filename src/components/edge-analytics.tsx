"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, subDays } from "date-fns";
import { AlertTriangle, Award, Brain, Calendar, Copy, Shield, Target, TrendingUp, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PnlLineChart } from "@/components/ui/ChartWrapper";
import { useSelectedAccount } from "@/hooks/use-selected-account";

type AnalyticsFilters = {
  symbols: string[];
  from: string;
  to: string;
  maxTrades: string;
};

type ApiTrade = {
  id: number;
  tradeDate: string;
  symbol: string;
  side: "LONG" | "SHORT";
  resultUsd: number;
  riskUsd: number;
  status: "RUNNING" | "PROFIT" | "LOSS" | "BREAKEVEN";
  setup: string | null;
  emotions: string | null;
};

type TimeRange = "WEEK" | "MONTH" | "QUARTER" | "ALL";

function usd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function metricTone(value: number, good = 0) {
  if (value > good) return "text-emerald-500";
  if (value < good) return "text-rose-500";
  return "text-slate-500";
}

export function EdgeAnalytics({ filters }: { filters?: AnalyticsFilters }) {
  const { selectedAccountId } = useSelectedAccount();
  const [timeRange, setTimeRange] = useState<TimeRange>("MONTH");
  const [trades, setTrades] = useState<ApiTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedRecap, setCopiedRecap] = useState<"weekly" | "monthly" | null>(null);
  const [goals, setGoals] = useState({ dailyTradeLimit: 5, winRateTarget: 55, maxLossLimit: 500 });

  useEffect(() => {
    const stored = window.localStorage.getItem("alpha-goals");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as typeof goals;
      setGoals({
        dailyTradeLimit: Number(parsed.dailyTradeLimit) || 5,
        winRateTarget: Number(parsed.winRateTarget) || 55,
        maxLossLimit: Number(parsed.maxLossLimit) || 500,
      });
    } catch {
      // ignore invalid storage
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("alpha-goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (filters?.symbols?.length) params.set("symbols", filters.symbols.join(","));
        if (selectedAccountId) params.set("accountId", String(selectedAccountId));
        if (filters?.from) params.set("from", filters.from);
        if (filters?.to) params.set("to", filters.to);
        params.set("maxTrades", filters?.maxTrades || "500");

        const res = await fetch(`/api/trades?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load trades");
        const json = (await res.json()) as { trades?: ApiTrade[] };
        setTrades(json.trades ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [filters, selectedAccountId]);

  const filtered = useMemo(() => {
    if (timeRange === "ALL") return trades;
    const now = new Date();
    const from =
      timeRange === "WEEK" ? subDays(now, 7) : timeRange === "MONTH" ? subDays(now, 30) : subDays(now, 90);
    return trades.filter((t) => new Date(t.tradeDate) >= from);
  }, [trades, timeRange]);

  const analytics = useMemo(() => {
    const totalTrades = filtered.length;
    const wins = filtered.filter((t) => t.resultUsd > 0).length;
    const losses = filtered.filter((t) => t.resultUsd < 0).length;
    const winRate = totalTrades ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;

    const grossProfit = filtered.filter((t) => t.resultUsd > 0).reduce((sum, t) => sum + t.resultUsd, 0);
    const grossLoss = Math.abs(filtered.filter((t) => t.resultUsd < 0).reduce((sum, t) => sum + t.resultUsd, 0));
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 9.99 : 0;

    const bySymbol = new Map<string, { pnl: number; trades: number }>();
    for (const t of filtered) {
      const row = bySymbol.get(t.symbol) ?? { pnl: 0, trades: 0 };
      row.pnl += t.resultUsd;
      row.trades += 1;
      bySymbol.set(t.symbol, row);
    }
    const topSymbolEntry = [...bySymbol.entries()].sort((a, b) => b[1].pnl - a[1].pnl)[0];
    const topSymbol = topSymbolEntry?.[0] ?? "N/A";
    const topSymbolProfit = Number((topSymbolEntry?.[1].pnl ?? 0).toFixed(2));

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const byWeekDay = new Map<number, number>();
    for (const t of filtered) {
      const d = new Date(t.tradeDate).getDay();
      byWeekDay.set(d, (byWeekDay.get(d) ?? 0) + t.resultUsd);
    }
    const bestDayEntry = [...byWeekDay.entries()].sort((a, b) => b[1] - a[1])[0];
    const bestDay = bestDayEntry ? dayNames[bestDayEntry[0]] : "N/A";
    const bestDayProfit = Number((bestDayEntry?.[1] ?? 0).toFixed(2));

    const emotionMap = new Map<string, { trades: number; wins: number }>();
    for (const t of filtered) {
      const emotions = (t.emotions ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      for (const emotion of emotions) {
        const row = emotionMap.get(emotion) ?? { trades: 0, wins: 0 };
        row.trades += 1;
        if (t.resultUsd > 0) row.wins += 1;
        emotionMap.set(emotion, row);
      }
    }
    const emotionStats = [...emotionMap.entries()]
      .map(([name, row]) => ({
        name,
        trades: row.trades,
        winRate: clampPct((row.wins / Math.max(row.trades, 1)) * 100),
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 6);

    const setupMap = new Map<string, { trades: number; wins: number; pnl: number }>();
    for (const t of filtered) {
      const key = t.setup?.trim() || "Unlabeled";
      const row = setupMap.get(key) ?? { trades: 0, wins: 0, pnl: 0 };
      row.trades += 1;
      row.pnl += t.resultUsd;
      if (t.resultUsd > 0) row.wins += 1;
      setupMap.set(key, row);
    }
    const setupStats = [...setupMap.entries()]
      .map(([name, row]) => ({
        name,
        trades: row.trades,
        winRate: clampPct((row.wins / Math.max(row.trades, 1)) * 100),
        avgPnL: Number((row.pnl / Math.max(row.trades, 1)).toFixed(2)),
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 6);
    const bestSetup = setupStats.slice().sort((a, b) => b.avgPnL - a.avgPnL)[0];
    const worstSetup = setupStats.slice().sort((a, b) => a.avgPnL - b.avgPnL)[0];

    const sorted = [...filtered].sort((a, b) => +new Date(a.tradeDate) - +new Date(b.tradeDate));
    let currentWinStreak = 0;
    let bestWinStreak = 0;
    let running = 0;
    for (const t of sorted) {
      if (t.resultUsd > 0) {
        running += 1;
        bestWinStreak = Math.max(bestWinStreak, running);
      } else {
        running = 0;
      }
    }
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      if (sorted[i].resultUsd > 0) currentWinStreak += 1;
      else break;
    }

    const avgWin = filtered.filter((t) => t.resultUsd > 0).reduce((s, t) => s + t.resultUsd, 0) / Math.max(wins, 1);
    const avgLoss = filtered.filter((t) => t.resultUsd < 0).reduce((s, t) => s + t.resultUsd, 0) / Math.max(losses, 1);
    const rMultiples = filtered.filter((t) => t.riskUsd > 0).map((t) => t.resultUsd / t.riskUsd);
    const avgRMultiple = rMultiples.length
      ? Number((rMultiples.reduce((s, v) => s + v, 0) / rMultiples.length).toFixed(2))
      : 0;

    const byHour = new Map<number, number>();
    for (const t of filtered) {
      const hour = new Date(t.tradeDate).getHours();
      byHour.set(hour, (byHour.get(hour) ?? 0) + t.resultUsd);
    }
    const bestHourEntry = [...byHour.entries()].sort((a, b) => b[1] - a[1])[0];
    const bestHour = bestHourEntry ? bestHourEntry[0] : null;
    const bestHourPnL = Number((bestHourEntry?.[1] ?? 0).toFixed(2));
    const bestHourLabel = bestHour === null ? "N/A" : `${String(bestHour).padStart(2, "0")}:00`;

    const warnings: string[] = [];
    const worstSetup = setupStats.filter((s) => s.trades >= 5).sort((a, b) => a.winRate - b.winRate)[0];
    if (worstSetup && worstSetup.winRate < 40) warnings.push(`${worstSetup.name} setup has ${worstSetup.winRate}% win rate.`);
    const fomo = emotionStats.find((e) => e.name.toLowerCase() === "fomo");
    if (fomo && fomo.winRate < 40) warnings.push("FOMO-tagged trades are underperforming.");
    const recent7 = filtered.filter((t) => new Date(t.tradeDate) >= subDays(new Date(), 7)).length;
    const prev7 = filtered.filter((t) => {
      const d = new Date(t.tradeDate);
      return d >= subDays(new Date(), 14) && d < subDays(new Date(), 7);
    }).length;
    if (prev7 > 0 && recent7 > prev7 * 1.4) warnings.push("Trade frequency is up >40% vs previous week.");
    if (!warnings.length) warnings.push("No major risk alerts right now. Keep journaling consistently.");

    const byDate = new Map<string, number>();
    const start = subDays(new Date(), timeRange === "WEEK" ? 7 : timeRange === "MONTH" ? 30 : 90);
    for (let d = start; d <= new Date(); d = addDays(d, 1)) {
      byDate.set(format(d, "MM/dd"), 0);
    }
    for (const t of filtered) {
      const key = format(new Date(t.tradeDate), "MM/dd");
      byDate.set(key, (byDate.get(key) ?? 0) + t.resultUsd);
    }
    const trend = [...byDate.entries()].map(([date, pnl]) => ({ date, pnl: Number(pnl.toFixed(2)) }));

    let equity = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let maxDrawdownPct = 0;
    for (const t of sorted) {
      equity += t.resultUsd;
      peak = Math.max(peak, equity);
      const drawdown = peak - equity;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPct = peak > 0 ? (drawdown / peak) * 100 : 0;
      }
    }
    const currentDrawdown = peak - equity;
    const currentDrawdownPct = peak > 0 ? (currentDrawdown / peak) * 100 : 0;

    function buildRecap(days: number) {
      const since = subDays(new Date(), days);
      const slice = trades.filter((t) => new Date(t.tradeDate) >= since);
      const totalTrades = slice.length;
      const wins = slice.filter((t) => t.resultUsd > 0).length;
      const losses = slice.filter((t) => t.resultUsd < 0).length;
      const totalPnL = slice.reduce((s, t) => s + t.resultUsd, 0);
      const winRate = totalTrades ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;
      return {
        totalTrades,
        wins,
        losses,
        totalPnL: Number(totalPnL.toFixed(2)),
        winRate,
      };
    }

    return {
      totalTrades,
      wins,
      losses,
      winRate,
      profitFactor,
      topSymbol,
      topSymbolProfit,
      bestDay,
      bestDayProfit,
      emotionStats,
      setupStats,
      currentWinStreak,
      bestWinStreak,
      warnings,
      avgWin: Number(avgWin.toFixed(2)),
      avgLoss: Number(avgLoss.toFixed(2)),
      avgRMultiple,
      bestHourLabel,
      bestHourPnL,
      trend,
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
      currentDrawdown: Number(currentDrawdown.toFixed(2)),
      currentDrawdownPct: Number(currentDrawdownPct.toFixed(2)),
      recapWeekly: buildRecap(7),
      recapMonthly: buildRecap(30),
      bestSetup,
      worstSetup,
    };
  }, [filtered, timeRange, trades]);

  if (loading) return <Card><CardContent className="pt-6 text-sm text-slate-500">Loading analytics...</CardContent></Card>;
  if (error) return <Card><CardContent className="pt-6 text-sm text-rose-500">{error}</CardContent></Card>;

  const totalAbs = Math.max(Math.abs(analytics.avgWin) + Math.abs(analytics.avgLoss), 1);
  const winWidth = (Math.abs(analytics.avgWin) / totalAbs) * 100;
  const lossWidth = (Math.abs(analytics.avgLoss) / totalAbs) * 100;

  function copyRecap(type: "weekly" | "monthly") {
    const recap = type === "weekly" ? analytics.recapWeekly : analytics.recapMonthly;
    const label = type === "weekly" ? "Weekly" : "Monthly";
    const text = [
      `${label} Recap`,
      `Trades: ${recap.totalTrades}`,
      `Wins/Losses: ${recap.wins}/${recap.losses}`,
      `Win Rate: ${recap.winRate}%`,
      `PnL: ${usd(recap.totalPnL)}`,
    ].join("\n");
    void navigator.clipboard.writeText(text);
    setCopiedRecap(type);
    window.setTimeout(() => setCopiedRecap(null), 1500);
  }

  const weeklyTrades = analytics.recapWeekly.totalTrades;
  const weeklyWinRate = analytics.recapWeekly.winRate;
  const weeklyLoss = Math.abs(Math.min(0, analytics.recapWeekly.totalPnL));

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Advanced Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Deep insights into your trading performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "Week", value: "WEEK" },
            { label: "Month", value: "MONTH" },
            { label: "Quarter", value: "QUARTER" },
            { label: "All Time", value: "ALL" },
          ].map((range) => (
            <Button key={range.value} size="sm" variant={timeRange === range.value ? "default" : "outline"} onClick={() => setTimeRange(range.value as TimeRange)}>
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard icon={<Target className="h-4 w-4" />} label="Most Profitable Symbol" value={analytics.topSymbol} subtitle={`${usd(analytics.topSymbolProfit)} total`} tone="emerald" />
        <MetricCard icon={<Calendar className="h-4 w-4" />} label="Best Trading Day" value={analytics.bestDay} subtitle={usd(analytics.bestDayProfit)} tone="blue" />
        <MetricCard icon={<Zap className="h-4 w-4" />} label="Win Rate" value={`${analytics.winRate}%`} subtitle={`${analytics.wins}/${analytics.totalTrades} wins`} tone={analytics.winRate >= 50 ? "emerald" : "amber"} />
        <MetricCard icon={<TrendingUp className="h-4 w-4" />} label="Profit Factor" value={analytics.profitFactor.toString()} subtitle="Gross profit / Gross loss" tone={analytics.profitFactor >= 1.5 ? "emerald" : "rose"} />
        <MetricCard icon={<Target className="h-4 w-4" />} label="Adjusted R-Multiple" value={`${analytics.avgRMultiple}R`} subtitle="Avg result / risk" tone={analytics.avgRMultiple >= 0.5 ? "emerald" : "amber"} />
        <MetricCard icon={<Calendar className="h-4 w-4" />} label="Best Trading Hour" value={analytics.bestHourLabel} subtitle={usd(analytics.bestHourPnL)} tone={analytics.bestHourPnL >= 0 ? "emerald" : "rose"} />
      </div>

      <div className="grid gap-4">
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Brain className="h-4 w-4 text-emerald-500" />Emotion Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.emotionStats.length ? analytics.emotionStats.map((emotion) => (
              <div key={emotion.name} className="flex items-center gap-3">
                <span className="w-24 text-sm text-slate-600 dark:text-slate-300">{emotion.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className={`h-full ${emotion.winRate >= 60 ? "bg-emerald-500" : emotion.winRate >= 40 ? "bg-sky-500" : "bg-rose-500"}`} style={{ width: `${emotion.winRate}%` }} />
                </div>
                <span className={`w-12 text-right text-sm font-mono ${metricTone(emotion.winRate, 50)}`}>{emotion.winRate}%</span>
              </div>
            )) : <p className="text-sm text-slate-500">No emotion tags found yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4 text-amber-500" />Setup Performance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {analytics.setupStats.map((setup) => (
            <div key={setup.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{setup.name}</p>
                <p className="text-xs text-slate-500">{setup.trades} trades</p>
              </div>
              <div className="mb-1 flex items-center justify-between text-xs"><span className="text-slate-500">Win rate</span><span className={metricTone(setup.winRate, 50)}>{setup.winRate}%</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Avg P&L</span><span className={setup.avgPnL >= 0 ? "text-emerald-500" : "text-rose-500"}>{setup.avgPnL >= 0 ? "+" : ""}{setup.avgPnL}</span></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-emerald-500" />Correlation Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs text-emerald-500">Best Setup</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{analytics.bestSetup?.name ?? "N/A"}</p>
              <p className="text-xs text-slate-500">Avg P&L: {analytics.bestSetup ? usd(analytics.bestSetup.avgPnL) : "N/A"} • Win rate: {analytics.bestSetup?.winRate ?? 0}%</p>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <p className="text-xs text-rose-500">Needs Attention</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{analytics.worstSetup?.name ?? "N/A"}</p>
              <p className="text-xs text-slate-500">Avg P&L: {analytics.worstSetup ? usd(analytics.worstSetup.avgPnL) : "N/A"} • Win rate: {analytics.worstSetup?.winRate ?? 0}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-sky-500" />Performance Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs text-slate-500">Daily Trade Limit</label>
                <input
                  type="number"
                  min={1}
                  value={goals.dailyTradeLimit}
                  onChange={(e) => setGoals((p) => ({ ...p, dailyTradeLimit: Number(e.target.value) || 1 }))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Win Rate Target %</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={goals.winRateTarget}
                  onChange={(e) => setGoals((p) => ({ ...p, winRateTarget: Number(e.target.value) || 1 }))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Max Weekly Loss</label>
                <input
                  type="number"
                  min={0}
                  value={goals.maxLossLimit}
                  onChange={(e) => setGoals((p) => ({ ...p, maxLossLimit: Number(e.target.value) || 0 }))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Weekly trades</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">{weeklyTrades} / {goals.dailyTradeLimit * 7}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Weekly win rate</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">{weeklyWinRate}% / {goals.winRateTarget}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Weekly loss</span>
                <span className={`font-mono ${weeklyLoss <= goals.maxLossLimit ? "text-emerald-500" : "text-rose-500"}`}>{usd(weeklyLoss)} / {usd(goals.maxLossLimit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-300"><TrendingUp className="h-4 w-4" />Winning Streaks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-slate-500">Current streak</p>
            <p className="font-mono text-3xl font-bold text-emerald-500">{analytics.currentWinStreak}</p>
            <p className="text-xs text-slate-500">Best ever</p>
            <p className="font-mono text-lg font-bold text-emerald-400">{analytics.bestWinStreak} wins</p>
          </CardContent>
        </Card>

        <Card className="border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-rose-700 dark:text-rose-300"><AlertTriangle className="h-4 w-4" />Risk Warnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.warnings.map((warning) => (
              <div key={warning} className="rounded-lg border border-rose-500/20 bg-white/40 p-2 text-sm text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                {warning}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-rose-500" />Drawdown Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs text-slate-500">Max Drawdown</p>
              <p className="mt-1 font-mono text-2xl font-bold text-rose-500">-{usd(Math.abs(analytics.maxDrawdown))}</p>
              <p className="text-xs text-slate-500">Peak drop: {analytics.maxDrawdownPct.toFixed(2)}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs text-slate-500">Current Drawdown</p>
              <p className="mt-1 font-mono text-2xl font-bold text-rose-500">-{usd(Math.abs(analytics.currentDrawdown))}</p>
              <p className="text-xs text-slate-500">From peak: {analytics.currentDrawdownPct.toFixed(2)}%</p>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Drawdown depth</span>
              <span>{analytics.currentDrawdownPct.toFixed(1)}% of peak</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-2 rounded-full bg-rose-500"
                style={{ width: `${Math.min(100, Math.max(0, analytics.currentDrawdownPct))}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="pb-3"><CardTitle className="text-base">Average Win vs Average Loss</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Avg Win</span>
                <span className="font-mono text-emerald-500">{usd(analytics.avgWin)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${winWidth}%` }} /></div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Avg Loss</span>
                <span className="font-mono text-rose-500">-{usd(Math.abs(analytics.avgLoss))}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-2 rounded-full bg-rose-500" style={{ width: `${lossWidth}%` }} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="pb-3"><CardTitle className="text-base">Trade Distribution</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#10b981 0 ${analytics.winRate}%, #f43f5e ${analytics.winRate}% 100%)` }} />
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-white text-xs font-semibold dark:bg-slate-950">{analytics.winRate}%</div>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-slate-600 dark:text-slate-300"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />Wins: {analytics.wins}</p>
              <p className="text-slate-600 dark:text-slate-300"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-rose-500" />Losses: {analytics.losses}</p>
              <p className="text-slate-600 dark:text-slate-300"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-slate-400" />Total: {analytics.totalTrades}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="pb-3"><CardTitle className="text-base">P&L Trend</CardTitle></CardHeader>
        <CardContent>
          <PnlLineChart data={analytics.trend} />
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        {([
          { id: "weekly", label: "Weekly Recap", data: analytics.recapWeekly },
          { id: "monthly", label: "Monthly Recap", data: analytics.recapMonthly },
        ] as const).map((recap) => (
          <Card key={recap.id} className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{recap.label}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => copyRecap(recap.id)}>
                  <Copy className="h-4 w-4" />
                  {copiedRecap === recap.id ? "Copied" : "Copy"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs text-slate-500">Total P&L</p>
                <p className={`mt-1 font-mono text-xl font-bold ${recap.data.totalPnL >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {recap.data.totalPnL >= 0 ? "+" : "-"}{usd(Math.abs(recap.data.totalPnL))}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs text-slate-500">Win Rate</p>
                <p className="mt-1 font-mono text-xl font-bold text-emerald-500">{recap.data.winRate}%</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs text-slate-500">Trades</p>
                <p className="mt-1 font-mono text-xl font-bold text-slate-700 dark:text-slate-200">{recap.data.totalTrades}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs text-slate-500">Wins / Losses</p>
                <p className="mt-1 font-mono text-xl font-bold text-slate-700 dark:text-slate-200">{recap.data.wins}/{recap.data.losses}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  tone: "emerald" | "blue" | "amber" | "rose";
}) {
  const toneClass = {
    emerald: "border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-300",
    blue: "border-sky-500/25 bg-gradient-to-br from-sky-500/10 to-sky-500/5 text-sky-600 dark:text-sky-300",
    amber: "border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-300",
    rose: "border-rose-500/25 bg-gradient-to-br from-rose-500/10 to-rose-500/5 text-rose-600 dark:text-rose-300",
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
        {icon}
        {label}
      </div>
      <p className="font-mono text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}
