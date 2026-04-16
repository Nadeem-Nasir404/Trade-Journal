import { AlertTriangle, ShieldAlert, Wallet } from "lucide-react";

import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/risk-dashboard/progress-bar";
import { RiskPnlChart } from "@/components/risk-dashboard/risk-pnl-chart";
import type { RiskDashboardResponse } from "@/components/risk-dashboard/types";
import { formatUsd, statusMeta } from "@/components/risk-dashboard/utils";

export function DrawdownTab({ data }: { data: RiskDashboardResponse }) {
  const drawdown = data.dashboard.drawdown;
  const status = statusMeta(drawdown.status);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <Card className="overflow-hidden rounded-[24px] border-slate-200/80 bg-white/90 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
          <CardHeader className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
            <CardTitle>Drawdown Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <Stat title="Today's P&L" value={formatUsd(drawdown.todayPnl)} icon={<Wallet className="h-4 w-4" />} />
              <Stat title="Cumulative Overall Loss" value={formatUsd(drawdown.cumulativeOverallLoss)} icon={<AlertTriangle className="h-4 w-4" />} />
              <Stat title="Remaining Daily Risk" value={formatUsd(drawdown.remainingDailyRisk)} icon={<ShieldAlert className="h-4 w-4" />} />
              <Stat title="Remaining Overall Risk" value={formatUsd(drawdown.remainingOverallRisk)} icon={<ShieldAlert className="h-4 w-4" />} />
            </div>

            <ProgressBar label="Daily DD used" value={drawdown.dailyProgress} tone={drawdown.dailyProgress >= 80 ? "rose" : drawdown.dailyProgress >= 60 ? "amber" : "emerald"} />
            <ProgressBar label="Overall DD used" value={drawdown.overallProgress} tone={drawdown.overallProgress >= 75 ? "rose" : drawdown.overallProgress >= 50 ? "amber" : "sky"} />

            <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${status.className}`}>{status.label}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[24px] border-slate-200/80 bg-white/90 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
          <CardHeader className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
            <CardTitle>Trade Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Asset</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Risk</th>
                    <th className="py-2 pr-0 text-right">P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dashboard.tradeLog.map((trade) => (
                    <tr key={trade.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="py-3 pr-4">{trade.tradeDate.slice(0, 10)}</td>
                      <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">{trade.symbol}</td>
                      <td className="py-3 pr-4"><Badge>{trade.status}</Badge></td>
                      <td className="py-3 pr-4">{formatUsd(trade.riskUsd)}</td>
                      <td className={`py-3 pl-4 text-right font-semibold ${trade.resultUsd >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{formatUsd(trade.resultUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.dashboard.tradeLog.length === 0 ? <p className="py-6 text-sm text-slate-500 dark:text-slate-400">No trades yet for this account. Add trades to your journal and the tracker will start deriving risk usage automatically.</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <ChartWrapper title="30-Day P&L Curve" description="Realized cumulative P&L from this account's saved trades">
        <RiskPnlChart data={data.dashboard.charts.cumulativePnl} />
      </ChartWrapper>
    </div>
  );
}

function Stat({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon}
        <p className="text-sm">{title}</p>
      </div>
      <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
