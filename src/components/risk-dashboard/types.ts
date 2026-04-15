export type RiskStatus = "SAFE" | "CAUTION" | "STOP";

export type RiskDashboardResponse = {
  account: {
    id: number;
    name: string;
    broker: string | null;
    platform: string | null;
    startingBalance: number;
    currentBalance: number;
    accountType: "FUNDED" | "PERSONAL";
    maxDailyLoss: number | null;
    maxOverallDrawdown: number | null;
    maxDailyLossType: "PERCENTAGE" | "FIXED" | null;
    maxDrawdownType: "PERCENTAGE" | "FIXED" | null;
  };
  riskProfile: {
    phase1TargetPct: number | null;
    phase2TargetPct: number | null;
    personalDailyLossPct: number | null;
    customRules: string[];
  };
  builtInRules: string[];
  dashboard: {
    overview: {
      accountSize: number;
      dailyLimit: number;
      overallLimit: number;
      safeStop: number;
      phase1Target: number;
      phase2Target: number;
      phase1Progress: number;
      phase2Progress: number;
      totalPnl: number;
    };
    drawdown: {
      todayPnl: number;
      cumulativeOverallLoss: number;
      dailyProgress: number;
      overallProgress: number;
      remainingDailyRisk: number;
      remainingOverallRisk: number;
      status: RiskStatus;
    };
    tradeLog: Array<{
      id: number;
      tradeDate: string;
      symbol: string;
      resultUsd: number;
      riskUsd: number;
      entryPrice: number | null;
      exitPrice: number | null;
      quantity: number;
      side: "LONG" | "SHORT";
      status: "RUNNING" | "PROFIT" | "LOSS" | "BREAKEVEN";
    }>;
    charts: {
      cumulativePnl: Array<{ date: string; pnl: number }>;
      targets: Array<{ name: string; value: number }>;
    };
  };
};

export type RiskSettingsDraft = {
  accountType: "FUNDED" | "PERSONAL";
  startingBalance: number;
  currentBalance: number;
  dailyDdPct: number;
  overallDdPct: number;
  phase1TargetPct: number;
  phase2TargetPct: number;
  personalDailyLossPct: number | "";
  customRules: string[];
};
