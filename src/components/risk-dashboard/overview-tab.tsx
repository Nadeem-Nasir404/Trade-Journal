import { Shield, Target, TrendingUp, Wallet } from "lucide-react";

import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/risk-dashboard/metric-card";
import { ProgressBar } from "@/components/risk-dashboard/progress-bar";
import { RiskTargetsChart } from "@/components/risk-dashboard/risk-targets-chart";
import type { RiskDashboardResponse } from "@/components/risk-dashboard/types";
import { formatPct, formatUsd } from "@/components/risk-dashboard/utils";

export function OverviewTab({ data }: { data: RiskDashboardResponse }) {
  const overview = data.dashboard.overview;
  const cards = [
    { title: "Account Size", value: formatUsd(overview.accountSize), icon: <Wallet className="h-4 w-4" />, tone: "emerald" as const },
    { title: "Daily DD Limit", value: formatUsd(overview.dailyLimit), icon: <Shield className="h-4 w-4" />, tone: "amber" as const },
    { title: "Overall DD Limit", value: formatUsd(overview.overallLimit), icon: <Shield className="h-4 w-4" />, tone: "rose" as const },
    { title: "Daily Safe Stop", value: formatUsd(overview.safeStop), subtext: "60% of daily limit", icon: <TrendingUp className="h-4 w-4" />, tone: "sky" as const },
    { title: "Phase 1 Target", value: overview.phase1Target ? formatUsd(overview.phase1Target) : "-", subtext: data.account.accountType === "FUNDED" ? undefined : "Personal mode", icon: <Target className="h-4 w-4" />, tone: "emerald" as const },
    { title: "Phase 2 Target", value: overview.phase2Target ? formatUsd(overview.phase2Target) : "-", subtext: data.account.accountType === "FUNDED" ? undefined : "Personal mode", icon: <Target className="h-4 w-4" />, tone: "sky" as const },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => <MetricCard key={card.title} {...card} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="overflow-hidden rounded-[24px] border-slate-200/80 bg-white/90 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
          <CardHeader className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
            <CardTitle>Phase Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProgressBar label={`Phase 1 (${formatPct(overview.phase1Progress)})`} value={overview.phase1Progress} tone="emerald" />
            <ProgressBar label={`Phase 2 (${formatPct(overview.phase2Progress)})`} value={overview.phase2Progress} tone="sky" />
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
              Progress is derived from realized P&amp;L on trades saved in your journal for this account.
            </div>
          </CardContent>
        </Card>

        <ChartWrapper title="Target Comparison" description="Current net result against your funded milestones">
          <RiskTargetsChart data={data.dashboard.charts.targets} />
        </ChartWrapper>
      </div>
    </div>
  );
}
