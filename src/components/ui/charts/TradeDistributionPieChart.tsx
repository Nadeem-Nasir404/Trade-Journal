"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Slice = { name: string; value: number };

const colors = ["#10B981", "#F43F5E", "#64748B", "#38BDF8"];

export default function TradeDistributionPieChart({ data }: { data: Slice[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={44} outerRadius={72} paddingAngle={2}>
            {data.map((entry, idx) => (
              <Cell key={`${entry.name}-${idx}`} fill={colors[idx % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
