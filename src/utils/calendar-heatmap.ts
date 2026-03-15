export const getCellColor = (pnl: number) => {
  if (pnl >= 0) {
    return "bg-emerald-500/25 border-emerald-400 text-emerald-950 dark:bg-emerald-500/35 dark:border-emerald-300 dark:text-emerald-100";
  }

  return "bg-rose-500/25 border-rose-400 text-rose-950 dark:bg-rose-500/35 dark:border-rose-300 dark:text-rose-100";
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
