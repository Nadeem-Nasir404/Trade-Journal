"use client";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

type TooltipData = {
  dateLabel: string;
  pnl: number;
  wins: number;
  losses: number;
  trades: number;
  topSymbolsText: string;
  avgHoldTimeText: string;
};

export function CalendarDayTooltip({ show, position, data }: { show: boolean; position: "top" | "bottom"; data: TooltipData }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? 8 : -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === "top" ? 8 : -8, scale: 0.98 }}
          transition={{ duration: 0.16 }}
          className={cn(
            "pointer-events-none absolute z-20 w-64 rounded-lg border border-slate-300 bg-white/95 p-3 text-xs shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95",
            position === "top" ? "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2" : "top-[calc(100%+8px)] left-1/2 -translate-x-1/2",
          )}
        >
          <p className="font-semibold">{data.dateLabel}</p>
          <p className={cn("mt-1 font-bold", data.pnl >= 0 ? "text-emerald-600" : "text-rose-600")}>Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(data.pnl)}</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">{data.trades} trades ({data.wins} wins, {data.losses} losses)</p>
          <p className="text-slate-600 dark:text-slate-300">W/L ratio: {data.losses ? (data.wins / data.losses).toFixed(2) : data.wins ? "inf" : "0.00"}</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">{data.topSymbolsText || "No symbols"}</p>
          <p className="text-slate-600 dark:text-slate-300">Avg hold: {data.avgHoldTimeText}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default CalendarDayTooltip;
