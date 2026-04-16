"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";

import type { TradeFormTrade } from "@/components/AddTradeModal";

type TradesPerformanceChartProps = {
  trades: TradeFormTrade[];
  date: string;
};

function toUtcTimestamp(value: string, fallbackIndex: number): UTCTimestamp {
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) {
    return (Math.floor(Date.now() / 1000) + fallbackIndex) as UTCTimestamp;
  }
  return Math.floor(parsed / 1000) as UTCTimestamp;
}

export function TradesPerformanceChart({ trades, date }: TradesPerformanceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area", Time> | null>(null);

  const sortedTrades = useMemo(
    () =>
      [...trades].sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()),
    [trades],
  );

  const chartData = useMemo(() => {
    return sortedTrades.reduce<Array<{ trade: TradeFormTrade; point: { time: UTCTimestamp; value: number } }>>((acc, trade, index) => {
      const previousValue = acc.at(-1)?.point.value ?? 0;
      const nextValue = Number((previousValue + (Number(trade.resultUsd) || 0)).toFixed(2));

      acc.push({
        trade,
        point: {
          time: toUtcTimestamp(trade.tradeDate, index),
          value: nextValue,
        },
      });

      return acc;
    }, []);
  }, [sortedTrades]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        fontFamily: "inherit",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
        horzLines: { color: "rgba(148, 163, 184, 0.08)" },
      },
      crosshair: {
        vertLine: { color: "rgba(45, 212, 191, 0.35)", style: LineStyle.Solid, labelBackgroundColor: "#0f766e" },
        horzLine: { color: "rgba(45, 212, 191, 0.2)", style: LineStyle.Dotted, labelBackgroundColor: "#0f766e" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.12)",
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.12)",
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: (price: number) =>
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
          }).format(price),
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#14b8a6",
      topColor: "rgba(20, 184, 166, 0.32)",
      bottomColor: "rgba(15, 23, 42, 0.02)",
      lineWidth: 3,
      priceLineColor: "#14b8a6",
      lastValueVisible: true,
      crosshairMarkerRadius: 6,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      chart.applyOptions({ width: entry.contentRect.width, height: 340 });
      chart.timeScale().fitContent();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    if (!chartData.length) {
      series.setData([]);
      createSeriesMarkers(series, []);
      return;
    }

    series.setData(chartData.map((item) => item.point));
    createSeriesMarkers(
      series,
      chartData.map(({ trade, point }) => ({
        time: point.time,
        position: trade.resultUsd >= 0 ? "aboveBar" : "belowBar",
        color: trade.resultUsd >= 0 ? "#10b981" : "#f43f5e",
        shape: trade.resultUsd >= 0 ? "arrowUp" : "arrowDown",
        text: `${trade.symbol} ${trade.resultUsd >= 0 ? "+" : ""}${trade.resultUsd.toFixed(0)}`,
      })),
    );
    chart.timeScale().fitContent();
  }, [chartData]);

  const stats = useMemo(() => {
    const totalPnl = sortedTrades.reduce((sum, trade) => sum + (Number(trade.resultUsd) || 0), 0);
    const winners = sortedTrades.filter((trade) => trade.resultUsd > 0).length;
    const losers = sortedTrades.filter((trade) => trade.resultUsd < 0).length;
    return { totalPnl, winners, losers };
  }, [sortedTrades]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.78))] px-5 py-4 text-white dark:border-slate-700">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">Lightweight Charts</p>
            <h2 className="mt-2 text-xl font-semibold">Trades Performance Chart</h2>
            <p className="mt-1 text-sm text-slate-300">
              Separate chart workspace for {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium">
              {sortedTrades.length} trades
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium">
              Cumulative P&L
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/60">
          {chartData.length ? (
            <div ref={containerRef} className="h-[340px] w-full" />
          ) : (
            <div className="flex h-[340px] flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <Activity className="h-8 w-8 text-teal-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">No trades for this day</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Once trades are logged, this panel will plot cumulative performance with trade markers.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-500/5 p-4 dark:border-emerald-900/40 dark:bg-emerald-500/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
              Winners
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-300">{stats.winners}</p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-500/5 p-4 dark:border-rose-900/40 dark:bg-rose-500/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-300">
              <TrendingDown className="h-4 w-4" />
              Losers
            </div>
            <p className="mt-3 text-3xl font-black text-rose-600 dark:text-rose-300">{stats.losers}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Net Day P&L</p>
            <p className={`mt-3 text-3xl font-black ${stats.totalPnl >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
              {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Green markers show profitable executions. Red markers show losing trades. The line tracks cumulative P&L through the day.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
