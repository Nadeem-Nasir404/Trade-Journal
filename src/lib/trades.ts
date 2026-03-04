import { eachDayOfInterval, endOfDay, endOfMonth, format, startOfDay, startOfMonth } from "date-fns";

export type TradeLike = {
  tradeDate: Date;
  side: "LONG" | "SHORT";
  resultUsd: number;
};

export type KPI = {
  totalPnl: number;
  tradeCount: number;
  winRate: number;
  avgDurationMinutes: number | null;
  longShortRatio: number;
  profitFactor: number;
  expectancy: number;
  bestWinStreak: number;
};

export type CalendarDayData<T extends TradeLike> = {
  date: string;
  pnl: number;
  tradeCount: number;
  trades: T[];
};

function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateKpis<T extends TradeLike>(trades: T[]): KPI {
  const tradeCount = trades.length;
  const totalPnl = roundTo2(trades.reduce((sum, t) => sum + t.resultUsd, 0));
  const wins = trades.filter((t) => t.resultUsd > 0);
  const losses = trades.filter((t) => t.resultUsd < 0);
  const longCount = trades.filter((t) => t.side === "LONG").length;
  const shortCount = trades.filter((t) => t.side === "SHORT").length;

  const grossProfit = wins.reduce((sum, t) => sum + t.resultUsd, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.resultUsd, 0));
  const profitFactor = grossLoss > 0 ? roundTo2(grossProfit / grossLoss) : grossProfit > 0 ? 999 : 0;

  const byDate = [...trades].sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime());
  let currentWinStreak = 0;
  let bestWinStreak = 0;
  for (const trade of byDate) {
    if (trade.resultUsd > 0) {
      currentWinStreak += 1;
      bestWinStreak = Math.max(bestWinStreak, currentWinStreak);
    } else {
      currentWinStreak = 0;
    }
  }

  return {
    totalPnl,
    tradeCount,
    winRate: tradeCount ? roundTo2((wins.length / tradeCount) * 100) : 0,
    avgDurationMinutes: null,
    longShortRatio: shortCount ? roundTo2(longCount / shortCount) : longCount,
    profitFactor,
    expectancy: tradeCount ? roundTo2(totalPnl / tradeCount) : 0,
    bestWinStreak,
  };
}

export function buildCalendarMonthData<T extends TradeLike>(trades: T[], month: Date): CalendarDayData<T>[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  const map = new Map<string, T[]>();
  for (const trade of trades) {
    const key = format(startOfDay(trade.tradeDate), "yyyy-MM-dd");
    const current = map.get(key) ?? [];
    current.push(trade);
    map.set(key, current);
  }

  return eachDayOfInterval({ start, end }).map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const dayTrades = map.get(key) ?? [];

    return {
      date: key,
      pnl: roundTo2(dayTrades.reduce((sum, t) => sum + t.resultUsd, 0)),
      tradeCount: dayTrades.length,
      trades: dayTrades,
    };
  });
}

export function inDateRange(date: Date, from?: Date, to?: Date) {
  if (from && date < startOfDay(from)) {
    return false;
  }
  if (to && date > endOfDay(to)) {
    return false;
  }
  return true;
}
