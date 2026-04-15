import type { RiskDashboardResponse, RiskSettingsDraft, RiskStatus } from "@/components/risk-dashboard/types";

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(value) >= 1 ? 0 : 2,
  }).format(value);
}

export function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

export function statusMeta(status: RiskStatus) {
  if (status === "STOP") {
    return {
      label: "STOP - limit hit",
      className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300",
    };
  }

  if (status === "CAUTION") {
    return {
      label: "Caution - reduce size",
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
    };
  }

  return {
    label: "Safe",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
  };
}

export function createDraft(data: RiskDashboardResponse): RiskSettingsDraft {
  return {
    accountType: data.account.accountType,
    startingBalance: data.account.startingBalance,
    currentBalance: data.account.currentBalance,
    dailyDdPct:
      data.account.accountType === "FUNDED" && data.account.maxDailyLossType === "PERCENTAGE" ? data.account.maxDailyLoss ?? 5 : 5,
    overallDdPct:
      data.account.accountType === "FUNDED" && data.account.maxDrawdownType === "PERCENTAGE" ? data.account.maxOverallDrawdown ?? 10 : 10,
    phase1TargetPct: data.riskProfile.phase1TargetPct ?? 8,
    phase2TargetPct: data.riskProfile.phase2TargetPct ?? 5,
    personalDailyLossPct: data.riskProfile.personalDailyLossPct ?? "",
    customRules: data.riskProfile.customRules.length ? data.riskProfile.customRules : [],
  };
}
