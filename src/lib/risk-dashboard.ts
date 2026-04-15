import { endOfDay, startOfDay, subDays } from "date-fns";

type TradeSummary = {
  id: number;
  tradeDate: Date;
  symbol: string;
  resultUsd: number;
  riskUsd: number;
  entryPrice: number | null;
  exitPrice: number | null;
  quantity: number;
  side: "LONG" | "SHORT";
  status: "RUNNING" | "PROFIT" | "LOSS" | "BREAKEVEN";
};

type AccountRiskConfig = {
  accountType: "FUNDED" | "PERSONAL";
  startingBalance: number;
  currentBalance: number;
  maxDailyLoss: number | null;
  maxOverallDrawdown: number | null;
  maxDailyLossType: "PERCENTAGE" | "FIXED" | null;
  maxDrawdownType: "PERCENTAGE" | "FIXED" | null;
  phase1TargetPct: number | null;
  phase2TargetPct: number | null;
  personalDailyLossPct: number | null;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function asDollarLimit(value: number | null, type: "PERCENTAGE" | "FIXED" | null, base: number) {
  if (!value || value <= 0) return 0;
  return type === "FIXED" ? value : (base * value) / 100;
}

export function getBuiltInRules(accountType: "FUNDED" | "PERSONAL") {
  if (accountType === "FUNDED") {
    return [
      "Size down once you reach 60% of the daily drawdown limit.",
      "Do not add correlated crypto positions unless total risk is reduced first.",
      "Protect evaluation consistency by avoiding impulsive revenge trades after a loss.",
    ];
  }

  return [
    "Keep risk small enough that a losing day does not affect tomorrow's execution.",
    "Scale risk only after a meaningful sample of disciplined trades, not one strong session.",
    "Pause after emotional decision-making or repeated rule breaks before adding new exposure.",
  ];
}

export function buildRiskDashboard(config: AccountRiskConfig, trades: TradeSummary[]) {
  const accountSize = config.startingBalance;
  const dailyLimit =
    config.accountType === "FUNDED"
      ? asDollarLimit(config.maxDailyLoss, config.maxDailyLossType, accountSize)
      : asDollarLimit(config.personalDailyLossPct, "PERCENTAGE", accountSize);
  const overallLimit =
    config.accountType === "FUNDED" ? asDollarLimit(config.maxOverallDrawdown, config.maxDrawdownType, accountSize) : accountSize;
  const phase1Target = config.accountType === "FUNDED" ? accountSize * ((config.phase1TargetPct ?? 0) / 100) : 0;
  const phase2Target = config.accountType === "FUNDED" ? accountSize * ((config.phase2TargetPct ?? 0) / 100) : 0;
  const safeStop = dailyLimit * 0.6;

  const sortedTrades = [...trades].sort((a, b) => b.tradeDate.getTime() - a.tradeDate.getTime());
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const trailingStart = startOfDay(subDays(now, 29));

  const todaysTrades = sortedTrades.filter((trade) => trade.tradeDate >= todayStart && trade.tradeDate <= todayEnd);
  const todayPnl = round2(todaysTrades.reduce((sum, trade) => sum + trade.resultUsd, 0));

  const totalPnl = round2(sortedTrades.reduce((sum, trade) => sum + trade.resultUsd, 0));
  const cumulativeOverallLoss = round2(Math.max(accountSize - config.currentBalance, 0));
  const realizedLoss = round2(Math.max(-totalPnl, 0));
  const overallLossUsed = round2(Math.max(cumulativeOverallLoss, realizedLoss));

  const dailyLossUsed = round2(Math.max(-todayPnl, 0));
  const dailyProgress = dailyLimit > 0 ? Math.min((dailyLossUsed / dailyLimit) * 100, 100) : 0;
  const overallProgress = overallLimit > 0 ? Math.min((overallLossUsed / overallLimit) * 100, 100) : 0;
  const remainingDailyRisk = round2(Math.max(dailyLimit - dailyLossUsed, 0));
  const remainingOverallRisk = round2(Math.max(overallLimit - overallLossUsed, 0));

  let status: "SAFE" | "CAUTION" | "STOP" = "SAFE";
  if ((dailyLimit > 0 && dailyLossUsed >= dailyLimit) || (overallLimit > 0 && overallLossUsed >= overallLimit)) {
    status = "STOP";
  } else if ((dailyLimit > 0 && dailyLossUsed >= safeStop) || overallProgress >= 50) {
    status = "CAUTION";
  }

  const trailingTrades = sortedTrades.filter((trade) => trade.tradeDate >= trailingStart);
  const cumulativeSeries = [...trailingTrades]
    .sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime())
    .reduce<{ date: string; pnl: number }[]>((acc, trade) => {
      const previous = acc.at(-1)?.pnl ?? 0;
      acc.push({
        date: trade.tradeDate.toISOString().slice(0, 10),
        pnl: round2(previous + trade.resultUsd),
      });
      return acc;
    }, []);

  const positiveNet = Math.max(totalPnl, 0);
  const phase1Progress = phase1Target > 0 ? Math.min((positiveNet / phase1Target) * 100, 100) : 0;
  const phase2Progress = phase2Target > 0 ? Math.min((positiveNet / phase2Target) * 100, 100) : 0;

  return {
    overview: {
      accountSize,
      dailyLimit: round2(dailyLimit),
      overallLimit: round2(overallLimit),
      safeStop: round2(safeStop),
      phase1Target: round2(phase1Target),
      phase2Target: round2(phase2Target),
      phase1Progress: round2(phase1Progress),
      phase2Progress: round2(phase2Progress),
      totalPnl,
    },
    drawdown: {
      todayPnl,
      cumulativeOverallLoss: overallLossUsed,
      dailyProgress: round2(dailyProgress),
      overallProgress: round2(overallProgress),
      remainingDailyRisk,
      remainingOverallRisk,
      status,
    },
    tradeLog: sortedTrades.slice(0, 12).map((trade) => ({
      ...trade,
      tradeDate: trade.tradeDate.toISOString(),
    })),
    charts: {
      cumulativePnl: cumulativeSeries,
      targets: [
        { name: "Net P&L", value: totalPnl },
        { name: "Phase 1", value: round2(phase1Target) },
        { name: "Phase 2", value: round2(phase2Target) },
      ],
    },
  };
}
