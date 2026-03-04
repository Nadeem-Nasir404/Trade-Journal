import { format, startOfMonth, startOfWeek } from "date-fns";

type TradePoint = {
  symbol: string;
  tradeDate: Date;
  resultUsd: number;
};

export type EdgeBucket = "day" | "week" | "month";

export type EdgeSummary = {
  mostProfitableSymbol: {
    symbol: string | null;
    totalPnl: number;
    tradeCount: number;
  };
  bestTradingDay: {
    dayNumber: number;
    dayName: string;
    totalPnl: number;
    tradeCount: number;
  };
  averageWinVsAverageLossRatio: number;
  expectancy: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  totals: {
    trades: number;
    wins: number;
    losses: number;
  };
  trend: Array<{
    label: string;
    pnl: number;
    trades: number;
    wins: number;
    losses: number;
  }>;
};

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function computeEdgeAnalytics(trades: TradePoint[], bucket: EdgeBucket): EdgeSummary {
  const weekdayMap = new Map<number, { pnl: number; count: number }>();
  for (let i = 1; i <= 5; i += 1) weekdayMap.set(i, { pnl: 0, count: 0 });

  const symbolMap = new Map<string, { totalPnl: number; tradeCount: number }>();
  const trendMap = new Map<string, { pnl: number; trades: number; wins: number; losses: number; sortAt: number }>();

  for (const trade of trades) {
    const day = trade.tradeDate.getDay();
    if (day >= 1 && day <= 5) {
      const cur = weekdayMap.get(day)!;
      cur.pnl += trade.resultUsd;
      cur.count += 1;
    }

    const sym = symbolMap.get(trade.symbol) ?? { totalPnl: 0, tradeCount: 0 };
    sym.totalPnl += trade.resultUsd;
    sym.tradeCount += 1;
    symbolMap.set(trade.symbol, sym);

    const bucketDate = bucket === "month" ? startOfMonth(trade.tradeDate) : bucket === "week" ? startOfWeek(trade.tradeDate, { weekStartsOn: 1 }) : trade.tradeDate;
    const key = bucket === "month" ? format(bucketDate, "yyyy-MM") : bucket === "week" ? `Wk ${format(bucketDate, "MM/dd")}` : format(bucketDate, "MM/dd");
    const row = trendMap.get(key) ?? { pnl: 0, trades: 0, wins: 0, losses: 0, sortAt: bucketDate.getTime() };
    row.pnl += trade.resultUsd;
    row.trades += 1;
    if (trade.resultUsd > 0) row.wins += 1;
    if (trade.resultUsd < 0) row.losses += 1;
    trendMap.set(key, row);
  }

  const bestTradingDay = [...weekdayMap.entries()]
    .map(([dayNumber, data]) => ({
      dayNumber,
      dayName: WEEKDAY_LABELS[dayNumber],
      totalPnl: round2(data.pnl),
      tradeCount: data.count,
    }))
    .sort((a, b) => b.totalPnl - a.totalPnl)[0] ?? {
    dayNumber: 1,
    dayName: "Monday",
    totalPnl: 0,
    tradeCount: 0,
  };

  const mostProfitable = [...symbolMap.entries()]
    .map(([symbol, data]) => ({ symbol, totalPnl: data.totalPnl, tradeCount: data.tradeCount }))
    .sort((a, b) => b.totalPnl - a.totalPnl)[0];

  const wins = trades.filter((t) => t.resultUsd > 0);
  const losses = trades.filter((t) => t.resultUsd < 0);
  const tradeCount = trades.length;
  const winCount = wins.length;
  const lossCount = losses.length;
  const avgWin = winCount ? wins.reduce((s, t) => s + t.resultUsd, 0) / winCount : 0;
  const avgLossAbs = lossCount ? Math.abs(losses.reduce((s, t) => s + t.resultUsd, 0) / lossCount) : 0;
  const winRate = tradeCount ? winCount / tradeCount : 0;
  const lossRate = tradeCount ? lossCount / tradeCount : 0;
  const expectancy = (winRate * avgWin) - (lossRate * avgLossAbs);
  const wlRatio = avgLossAbs > 0 ? avgWin / avgLossAbs : avgWin > 0 ? 999 : 0;

  const trend = [...trendMap.entries()]
    .map(([label, row]) => ({
      label,
      pnl: round2(row.pnl),
      trades: row.trades,
      wins: row.wins,
      losses: row.losses,
      sortAt: row.sortAt,
    }))
    .sort((a, b) => a.sortAt - b.sortAt)
    .map((row) => ({
      label: row.label,
      pnl: row.pnl,
      trades: row.trades,
      wins: row.wins,
      losses: row.losses,
    }));

  return {
    mostProfitableSymbol: mostProfitable
      ? { symbol: mostProfitable.symbol, totalPnl: round2(mostProfitable.totalPnl), tradeCount: mostProfitable.tradeCount }
      : { symbol: null, totalPnl: 0, tradeCount: 0 },
    bestTradingDay,
    averageWinVsAverageLossRatio: round2(wlRatio),
    expectancy: round2(expectancy),
    winRate: round2(winRate * 100),
    averageWin: round2(avgWin),
    averageLoss: round2(avgLossAbs),
    totals: { trades: tradeCount, wins: winCount, losses: lossCount },
    trend,
  };
}
