"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, Award } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTrendDirection } from "@/utils/animation-helpers";

export function TrendArrow({ value }: { value: number }) {
  const dir = getTrendDirection(value);
  if (dir === "up") return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
  if (dir === "down") return <ArrowDownRight className="h-4 w-4 text-rose-500" />;
  return <ArrowRight className="h-4 w-4 text-slate-400" />;
}

export function WinRateProgress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      <div className="h-2 rounded bg-slate-200 dark:bg-slate-700">
        <div className="h-2 rounded bg-emerald-500 transition-all" style={{ width: `${clamped}%`, willChange: "width" }} />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{clamped.toFixed(1)}% win rate</p>
    </div>
  );
}

export function CircularGauge({ value, max = 3, label = "Gauge" }: { value: number; max?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="h-16 w-16 rounded-full" style={{ background: `conic-gradient(#10b981 0 ${pct}%, #e2e8f0 ${pct}% 100%)` }}>
        <div className="m-[5px] flex h-[54px] w-[54px] items-center justify-center rounded-full bg-white text-xs font-bold dark:bg-slate-900">{value.toFixed(2)}</div>
      </div>
      <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

export function AchievementBadge({ text, reached }: { text: string; reached: boolean }) {
  return (
    <Badge className={cn(reached ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-600" : "border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-300")}>
      <Award className="mr-1 h-3.5 w-3.5" />
      {text}
    </Badge>
  );
}

export function SymbolBadge({ symbol }: { symbol: string }) {
  const map: Record<string, string> = {
    BTC: "B",
    BTCUSD: "B",
    ETH: "E",
    ETHUSD: "E",
  };
  const letter = map[symbol] ?? symbol[0] ?? "?";
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs dark:border-slate-600">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[10px] text-white dark:bg-slate-200 dark:text-slate-900">{letter}</span>
      {symbol}
    </span>
  );
}

export function RiskLevelBadge({ riskPercent }: { riskPercent: number }) {
  const tone = riskPercent <= 1 ? "bg-emerald-500/10 text-emerald-600" : riskPercent <= 2 ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600";
  const label = riskPercent <= 1 ? "Low" : riskPercent <= 2 ? "Medium" : "High";
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tone)}>{label} Risk</span>;
}

export function StrategyTag({ strategy }: { strategy: "Scalp" | "Swing" | "Day Trade" }) {
  return <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-600">{strategy}</span>;
}
