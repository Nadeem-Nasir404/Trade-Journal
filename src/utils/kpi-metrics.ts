export type KpiMetricKey = "totalPnl" | "winrate" | "profitFactor" | "expectancy" | "trades" | "longShort";

export function getColorByValue(metric: KpiMetricKey, value: number) {
  switch (metric) {
    case "totalPnl":
      if (value >= 0) return { text: "text-emerald-600", spark: "#10B981", glow: "shadow-emerald-500/20" };
      return { text: "text-rose-600", spark: "#F43F5E", glow: "shadow-rose-500/20" };
    case "winrate":
      if (value > 50) return { text: "text-emerald-600", spark: "#10B981", glow: "shadow-emerald-500/20" };
      if (value >= 40) return { text: "text-amber-500", spark: "#F59E0B", glow: "shadow-amber-500/20" };
      return { text: "text-rose-600", spark: "#F43F5E", glow: "shadow-rose-500/20" };
    case "profitFactor":
      if (value > 1.2) return { text: "text-emerald-600", spark: "#10B981", glow: "shadow-emerald-500/20" };
      if (value >= 0.8) return { text: "text-amber-500", spark: "#F59E0B", glow: "shadow-amber-500/20" };
      return { text: "text-rose-600", spark: "#F43F5E", glow: "shadow-rose-500/20" };
    case "expectancy":
      if (value >= 0) return { text: "text-emerald-600", spark: "#10B981", glow: "shadow-emerald-500/20" };
      return { text: "text-rose-600", spark: "#F43F5E", glow: "shadow-rose-500/20" };
    case "trades":
      return { text: "text-sky-600", spark: "#0EA5E9", glow: "shadow-sky-500/20" };
    case "longShort":
      return { text: "text-sky-600", spark: "#0EA5E9", glow: "shadow-sky-500/20" };
    default:
      return { text: "text-slate-200", spark: "#64748B", glow: "shadow-slate-500/20" };
  }
}

export const sampleKpiData = {
  totalPnL: { current: -424, trend: [20, 32, 28, 40, 38, 45, 41, 60], vsLastMonth: -120 },
  trades: { current: 46, trend: [2, 3, 3, 4, 5, 6, 6, 7], avgPerDay: 1.5 },
  winrate: { current: 56.52, trend: [44, 46, 50, 52, 53, 54, 56, 57], avgWin: 180, avgLoss: 120 },
  longShort: { current: 2.07, trend: [1.1, 1.2, 1.5, 1.7, 1.8, 2.0, 2.1, 2.07] },
  profitFactor: { current: 0.9, trend: [1.3, 1.2, 1.1, 1.0, 0.95, 0.92, 0.9, 0.9], bestDay: 480, worstDay: -335 },
  expectancy: { current: -9.22, trend: [8, 5, 3, 1, -1, -4, -7, -9], vsLastMonth: -12 },
};
