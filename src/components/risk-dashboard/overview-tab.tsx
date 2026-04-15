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
    { title: "Account Size", value: formatUsd(overview.accountSize) },
    { title: "Daily DD Limit", value: formatUsd(overview.dailyLimit) },
    { title: "Overall DD Limit", value: formatUsd(overview.overallLimit) },
    { title: "Daily Safe Stop", value: formatUsd(overview.safeStop), subtext: "60% of daily limit" },
    { title: "Phase 1 Target", value: overview.phase1Target ? formatUsd(overview.phase1Target) : "-", subtext: data.account.accountType === "FUNDED" ? undefined : "Personal mode" },
    { title: "Phase 2 Target", value: overview.phase2Target ? formatUsd(overview.phase2Target) : "-", subtext: data.account.accountType === "FUNDED" ? undefined : "Personal mode" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => <MetricCard key={card.title} {...card} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Phase Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProgressBar label={`Phase 1 (${formatPct(overview.phase1Progress)})`} value={overview.phase1Progress} tone="emerald" />
            <ProgressBar label={`Phase 2 (${formatPct(overview.phase2Progress)})`} value={overview.phase2Progress} tone="sky" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Progress is derived from realized P&amp;L on trades saved in your journal for this account.</p>
          </CardContent>
        </Card>

        <ChartWrapper title="Target Comparison" description="Current net result against your funded milestones">
          <RiskTargetsChart data={data.dashboard.charts.targets} />
        </ChartWrapper>
      </div>
    </div>
  );
}
