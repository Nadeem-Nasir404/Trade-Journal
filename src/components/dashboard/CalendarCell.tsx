"use client";

import { useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { getCellColor } from "@/utils/calendar-heatmap";
import { CalendarDayTooltip } from "@/components/dashboard/CalendarDayTooltip";
import { TradeIndicatorDots } from "@/components/dashboard/TradeIndicatorDots";

type TradeLite = {
  id: number;
  symbol: string;
  resultUsd: number;
  tradeDate: Date;
  createdAt: Date;
};

type DayData = {
  date: string;
  pnl: number;
  tradeCount: number;
  trades: TradeLite[];
};

export function CalendarCell({
  day,
  isActive,
  isToday,
  isBest,
  isWorst,
  streak,
  onSelect,
}: {
  day: DayData;
  isActive?: boolean;
  isToday?: boolean;
  isBest?: boolean;
  isWorst?: boolean;
  streak?: number;
  onSelect: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<"top" | "bottom">("top");
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLButtonElement | null>(null);

  const summary = useMemo(() => {
    const wins = day.trades.filter((t) => t.resultUsd > 0).length;
    const losses = day.trades.filter((t) => t.resultUsd < 0).length;
    const topSymbols = [...day.trades.reduce((map, t) => {
      map.set(t.symbol, (map.get(t.symbol) ?? 0) + t.resultUsd);
      return map;
    }, new Map<string, number>()).entries()]
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 3)
      .map(([symbol, pnl]) => `${symbol} (${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)})`)
      .join(" • ");

    const avgMinutes = day.trades.length
      ? day.trades.reduce((sum, t) => sum + Math.max(0, (t.createdAt.getTime() - t.tradeDate.getTime()) / 60000), 0) / day.trades.length
      : 0;

    return {
      wins,
      losses,
      topSymbols,
      avgHoldTimeText: avgMinutes ? `${Math.round(avgMinutes)}m` : "N/A",
      dateLabel: format(parseISO(day.date), "MMM d, yyyy"),
    };
  }, [day]);

  const cellColor = useMemo(() => getCellColor(day.pnl), [day.pnl]);

  function openTooltip() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos(rect.top < 170 ? "bottom" : "top");
      }
      setShowTooltip(true);
    }, 100);
  }

  function closeTooltip() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowTooltip(false);
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      onMouseEnter={openTooltip}
      onMouseLeave={closeTooltip}
      onFocus={openTooltip}
      onBlur={closeTooltip}
      onClick={onSelect}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "relative min-h-16 rounded-lg border p-1.5 text-left transition will-change-transform sm:min-h-24 sm:p-2",
        cellColor,
        isActive && "ring-2 ring-emerald-400",
        isToday && "animate-pulse ring-2 ring-sky-400",
      )}
      style={{ contentVisibility: "auto" }}
    >
      {isBest ? <span className="absolute right-1 top-1 rounded-full bg-emerald-500 px-1 text-[10px] text-white">★</span> : null}
      {isWorst ? <span className="absolute right-1 top-1 rounded-full bg-rose-500 px-1 text-[10px] text-white">✕</span> : null}
      {streak && Math.abs(streak) >= 2 ? (
        <span className={cn("absolute left-0 top-0 h-0 w-0 border-l-[12px] border-t-[12px] border-r-[12px] border-t-transparent border-r-transparent", streak > 0 ? "border-l-emerald-500" : "border-l-rose-500")} />
      ) : null}

      <p className="text-[11px] font-semibold sm:text-xs">{format(parseISO(day.date), "d")}</p>
      <p
        className={cn(
          "mt-1 text-[11px] font-extrabold leading-tight sm:mt-2 sm:text-sm",
          day.pnl >= 0 ? "text-emerald-700 dark:text-emerald-200" : "text-rose-700 dark:text-rose-200",
        )}
      >
        <span className="sm:hidden">
          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(day.pnl)}
        </span>
        <span className="hidden sm:inline">
          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(day.pnl)}
        </span>
      </p>
      <TradeIndicatorDots tradeCount={day.tradeCount} />

      <CalendarDayTooltip
        show={showTooltip}
        position={tooltipPos}
        data={{
          dateLabel: summary.dateLabel,
          pnl: day.pnl,
          wins: summary.wins,
          losses: summary.losses,
          trades: day.tradeCount,
          topSymbolsText: summary.topSymbols,
          avgHoldTimeText: summary.avgHoldTimeText,
        }}
      />
    </motion.button>
  );
}

export default CalendarCell;
