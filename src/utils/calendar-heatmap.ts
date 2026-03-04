export const getCellColor = (pnl: number, maxPnL: number, minPnL: number) => {
  if (pnl === 0) {
    return "bg-slate-700/15 border-slate-400/40 text-slate-900 dark:bg-slate-700/40 dark:border-slate-500/50 dark:text-slate-100";
  }

  if (pnl > 0) {
    const ratio = maxPnL > 0 ? pnl / maxPnL : 0;
    if (ratio >= 0.8) return "bg-emerald-900/35 border-emerald-500 text-emerald-950 dark:bg-emerald-900/60 dark:border-emerald-400 dark:text-emerald-100";
    if (ratio >= 0.6) return "bg-emerald-700/35 border-emerald-500/80 text-emerald-900 dark:bg-emerald-700/50 dark:border-emerald-400 dark:text-emerald-100";
    if (ratio >= 0.4) return "bg-emerald-500/35 border-emerald-500/70 text-emerald-900 dark:bg-emerald-500/40 dark:border-emerald-300 dark:text-emerald-100";
    if (ratio >= 0.2) return "bg-emerald-300/45 border-emerald-400/70 text-emerald-900 dark:bg-emerald-400/35 dark:border-emerald-300 dark:text-emerald-100";
    return "bg-emerald-100/70 border-emerald-300/90 text-emerald-900 dark:bg-emerald-300/25 dark:border-emerald-300 dark:text-emerald-100";
  }

  const lossAbs = Math.abs(pnl);
  const minAbs = Math.abs(minPnL);
  const ratio = minAbs > 0 ? lossAbs / minAbs : 0;
  if (ratio >= 0.8) return "bg-rose-900/35 border-rose-500 text-rose-950 dark:bg-rose-900/60 dark:border-rose-400 dark:text-rose-100";
  if (ratio >= 0.6) return "bg-rose-700/35 border-rose-500/80 text-rose-900 dark:bg-rose-700/50 dark:border-rose-400 dark:text-rose-100";
  if (ratio >= 0.4) return "bg-rose-500/35 border-rose-500/70 text-rose-900 dark:bg-rose-500/40 dark:border-rose-300 dark:text-rose-100";
  if (ratio >= 0.2) return "bg-rose-300/45 border-rose-400/70 text-rose-900 dark:bg-rose-400/35 dark:border-rose-300 dark:text-rose-100";
  return "bg-rose-100/70 border-rose-300/90 text-rose-900 dark:bg-rose-300/25 dark:border-rose-300 dark:text-rose-100";
};

export type CalendarSampleData = {
  date: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  topSymbols: Array<{ symbol: string; pnl: number }>;
};

export const sampleCalendarData: CalendarSampleData[] = [
  { date: "2026-03-01", pnl: -335, trades: 4, wins: 1, losses: 3, topSymbols: [{ symbol: "BTC", pnl: -220 }, { symbol: "ETH", pnl: -95 }, { symbol: "AAPL", pnl: -20 }] },
  { date: "2026-03-02", pnl: 980, trades: 6, wins: 4, losses: 2, topSymbols: [{ symbol: "BTC", pnl: 450 }, { symbol: "ETH", pnl: 320 }, { symbol: "AAPL", pnl: 210 }] },
];
