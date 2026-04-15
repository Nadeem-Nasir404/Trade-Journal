"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatUsd } from "@/components/risk-dashboard/utils";

export function RiskPnlChart({ data }: { data: Array<{ date: string; pnl: number }> }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: "currentColor", fontSize: 12 }} />
          <YAxis tickFormatter={(value) => formatUsd(Number(value))} tick={{ fill: "currentColor", fontSize: 12 }} width={92} />
          <Tooltip formatter={(value: number) => formatUsd(value)} />
          <Line type="monotone" dataKey="pnl" stroke="#0f766e" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
