"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatUsd } from "@/components/risk-dashboard/utils";

export function RiskTargetsChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.25)" />
          <XAxis dataKey="name" tick={{ fill: "currentColor", fontSize: 12 }} />
          <YAxis tickFormatter={(value) => formatUsd(Number(value))} tick={{ fill: "currentColor", fontSize: 12 }} width={92} />
          <Tooltip formatter={(value: number) => formatUsd(value)} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
