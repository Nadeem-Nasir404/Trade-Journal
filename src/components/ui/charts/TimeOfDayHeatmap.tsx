"use client";

import { cn } from "@/lib/utils";

type Cell = { hour: string; score: number };

export default function TimeOfDayHeatmap({ data }: { data: Cell[] }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {data.map((cell) => {
        const intensity = Math.min(1, Math.max(0, cell.score));
        return (
          <div
            key={cell.hour}
            className={cn("rounded-md border border-slate-200 p-2 text-center text-xs dark:border-slate-700")}
            style={{
              backgroundColor: `rgba(16,185,129,${0.08 + intensity * 0.5})`,
            }}
          >
            <p className="font-semibold">{cell.hour}</p>
            <p className="text-[10px] text-slate-600 dark:text-slate-300">{Math.round(intensity * 100)}%</p>
          </div>
        );
      })}
    </div>
  );
}
