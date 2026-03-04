"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, endOfMonth, format, getDay, parseISO, startOfMonth, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { BarChart3, ChevronLeft, ChevronRight, DollarSign, Filter, FilterX, Flame, Ratio, RefreshCw, Target, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarCell } from "@/components/dashboard/CalendarCell";
import { EdgeAnalytics } from "@/components/edge-analytics";
import { KPICard } from "@/components/dashboard/KPICard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KpiCardsSkeleton } from "@/components/ui/LoadingSkeleton";
import { ChartWrapper, PnlLineChart, WinsLossesBarChart } from "@/components/ui/ChartWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DayViewModal } from "@/components/DayViewModal";
import { buildCalendarMonthData, calculateKpis } from "@/lib/trades";
import { getColorByValue } from "@/utils/kpi-metrics";

type ApiTrade = {
  id: number;
  userId: string | null;
  tradeDate: string;
  symbol: string;
  side: "LONG" | "SHORT";
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskUsd: number;
  resultUsd: number;
  journalEntryId: number | null;
  notes: string | null;
  createdAt: string;
};

type UiTrade = Omit<ApiTrade, "tradeDate" | "createdAt"> & { tradeDate: Date; createdAt: Date };
type SummaryResponse = {
  trades: ApiTrade[];
  symbols: string[];
};

type Filters = {
  symbols: string[];
  from: string;
  to: string;
  maxTrades: string;
};

function defaultFilters(): Filters {
  const from = subDays(new Date(), 30);
  return {
    symbols: [],
    from: format(from, "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
    maxTrades: "200",
  };
}

function fmtUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function toUiTrades(trades: ApiTrade[]): UiTrade[] {
  return trades.map((trade) => ({
    ...trade,
    tradeDate: parseISO(trade.tradeDate),
    createdAt: parseISO(trade.createdAt),
  }));
}

export function DashboardClient() {
  const router = useRouter();
  const [trades, setTrades] = useState<UiTrade[]>([]);
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<{ date: string; trades: UiTrade[] } | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(defaultFilters);

  async function loadSummary() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.symbols.length) params.set("symbols", filters.symbols.join(","));
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.maxTrades) params.set("maxTrades", filters.maxTrades);
    params.set("month", format(calendarMonth, "yyyy-MM"));
    params.set("bucket", "week");

    const response = await fetch(`/api/dashboard/summary?${params.toString()}`, { cache: "no-store" });
    const json = (await response.json()) as SummaryResponse;
    setTrades(toUiTrades(json.trades ?? []));
    setAllSymbols(json.symbols ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, calendarMonth]);

  const kpis = useMemo(() => calculateKpis(trades), [trades]);
  const monthDays = useMemo(() => buildCalendarMonthData(trades, calendarMonth), [trades, calendarMonth]);
  const firstWeekday = getDay(calendarMonth);
  const daysInMonth = endOfMonth(calendarMonth).getDate();
  const monthDaysLimited = monthDays.slice(0, daysInMonth);
  const maxPnl = useMemo(() => Math.max(0, ...monthDaysLimited.map((d) => d.pnl)), [monthDaysLimited]);
  const minPnl = useMemo(() => Math.min(0, ...monthDaysLimited.map((d) => d.pnl)), [monthDaysLimited]);
  const bestDay = useMemo(() => [...monthDaysLimited].sort((a, b) => b.pnl - a.pnl)[0]?.date, [monthDaysLimited]);
  const worstDay = useMemo(() => [...monthDaysLimited].sort((a, b) => a.pnl - b.pnl)[0]?.date, [monthDaysLimited]);
  const streakMap = useMemo(() => {
    const m = new Map<string, number>();
    let streak = 0;
    for (const d of monthDaysLimited) {
      const sign = d.pnl > 0 ? 1 : d.pnl < 0 ? -1 : 0;
      if (sign === 0) {
        streak = 0;
      } else if (Math.sign(streak) === sign) {
        streak += sign;
      } else {
        streak = sign;
      }
      m.set(d.date, streak);
    }
    return m;
  }, [monthDaysLimited]);
  const avgWin = useMemo(() => {
    const wins = trades.filter((t) => t.resultUsd > 0);
    return wins.length ? wins.reduce((s, t) => s + t.resultUsd, 0) / wins.length : 0;
  }, [trades]);
  const avgLoss = useMemo(() => {
    const losses = trades.filter((t) => t.resultUsd < 0);
    return losses.length ? Math.abs(losses.reduce((s, t) => s + t.resultUsd, 0) / losses.length) : 0;
  }, [trades]);
  const kpiData = useMemo(() => {
    const today = new Date();
    const start30 = subDays(today, 29);
    const prevStart = subDays(today, 59);
    const prevEnd = subDays(today, 30);

    const map = new Map<string, { pnl: number; wins: number; losses: number; count: number; long: number; short: number; gp: number; gl: number }>();
    for (let i = 0; i < 30; i += 1) {
      const d = format(subDays(today, 29 - i), "yyyy-MM-dd");
      map.set(d, { pnl: 0, wins: 0, losses: 0, count: 0, long: 0, short: 0, gp: 0, gl: 0 });
    }
    for (const t of trades) {
      const key = format(t.tradeDate, "yyyy-MM-dd");
      const row = map.get(key);
      if (!row) continue;
      row.pnl += t.resultUsd;
      row.count += 1;
      if (t.resultUsd > 0) {
        row.wins += 1;
        row.gp += t.resultUsd;
      } else if (t.resultUsd < 0) {
        row.losses += 1;
        row.gl += Math.abs(t.resultUsd);
      }
      if (t.side === "LONG") row.long += 1;
      if (t.side === "SHORT") row.short += 1;
    }

    const rows = [...map.values()];
    const pnlTrend: number[] = [];
    const tradesTrend: number[] = [];
    const winrateTrend: number[] = [];
    const lsTrend: number[] = [];
    const pfTrend: number[] = [];
    const expTrend: number[] = [];
    let cp = 0; let cc = 0; let cw = 0; let cLong = 0; let cShort = 0; let cgp = 0; let cgl = 0;
    for (const r of rows) {
      cp += r.pnl; cc += r.count; cw += r.wins; cLong += r.long; cShort += r.short; cgp += r.gp; cgl += r.gl;
      pnlTrend.push(cp);
      tradesTrend.push(cc);
      winrateTrend.push(cc ? (cw / cc) * 100 : 0);
      lsTrend.push(cShort ? cLong / cShort : cLong);
      pfTrend.push(cgl ? cgp / cgl : cgp > 0 ? 2 : 0);
      expTrend.push(cc ? cp / cc : 0);
    }

    const prevTotal = trades.filter((t) => t.tradeDate >= prevStart && t.tradeDate <= prevEnd).reduce((s, t) => s + t.resultUsd, 0);
    const currentTotal = trades.filter((t) => t.tradeDate >= start30).reduce((s, t) => s + t.resultUsd, 0);
    const vsAbs = currentTotal - prevTotal;
    const vsPct = prevTotal !== 0 ? (vsAbs / Math.abs(prevTotal)) * 100 : 0;

    return {
      totalPnl: { current: kpis.totalPnl, trend: pnlTrend, sub: `vs Last Month: ${fmtUsd(vsAbs)} (${vsPct.toFixed(1)}%)` },
      trades: { current: kpis.tradeCount, trend: tradesTrend, sub: `Avg per day: ${(kpiDataBaseCount(trades) / 30).toFixed(2)}` },
      winrate: { current: kpis.winRate, trend: winrateTrend, sub: `Avg Win: ${fmtUsd(avgWin)} | Avg Loss: ${fmtUsd(avgLoss)}` },
      longShort: { current: kpis.longShortRatio, trend: lsTrend, sub: `Long/Short balance` },
      profitFactor: { current: kpis.profitFactor === 999 ? 3 : kpis.profitFactor, trend: pfTrend, sub: `Best Day: ${fmtUsd(bestDayValue(monthDaysLimited))} | Worst Day: ${fmtUsd(worstDayValue(monthDaysLimited))}` },
      expectancy: { current: kpis.expectancy, trend: expTrend, sub: `Per trade expected value` },
    };
  }, [trades, kpis, avgWin, avgLoss, monthDaysLimited]);
  const performancePnlData = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const trade of trades) {
      const key = format(trade.tradeDate, "MM/dd");
      byDay.set(key, (byDay.get(key) ?? 0) + trade.resultUsd);
    }
    return [...byDay.entries()].map(([date, pnl]) => ({ date, pnl: Math.round(pnl * 100) / 100 }));
  }, [trades]);
  const performanceBySymbol = useMemo(() => {
    const map = new Map<string, { wins: number; losses: number }>();
    for (const trade of trades) {
      const row = map.get(trade.symbol) ?? { wins: 0, losses: 0 };
      if (trade.resultUsd > 0) row.wins += 1;
      if (trade.resultUsd < 0) row.losses += 1;
      map.set(trade.symbol, row);
    }
    return [...map.entries()]
      .map(([symbol, row]) => ({ symbol, wins: row.wins, losses: row.losses }))
      .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
      .slice(0, 8);
  }, [trades]);

  function kpiDataBaseCount(list: UiTrade[]) {
    return list.filter((t) => t.tradeDate >= subDays(new Date(), 29)).length;
  }
  function bestDayValue(days: { pnl: number }[]) {
    return days.length ? Math.max(...days.map((d) => d.pnl)) : 0;
  }
  function worstDayValue(days: { pnl: number }[]) {
    return days.length ? Math.min(...days.map((d) => d.pnl)) : 0;
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className={showFilters ? "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]" : "grid min-w-0 gap-4 xl:grid-cols-1"}>
        <div className="min-w-0 space-y-4">
          {loading ? (
            <KpiCardsSkeleton />
          ) : (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <KPICard metric="totalPnl" icon={<DollarSign className="h-4 w-4" />} label="Total PnL" value={fmtUsd(kpiData.totalPnl.current)} subText={kpiData.totalPnl.sub} trend={kpiData.totalPnl.trend} tone={getColorByValue("totalPnl", kpiData.totalPnl.current)} />
              <KPICard metric="trades" icon={<BarChart3 className="h-4 w-4" />} label="# Trades" value={`${kpiData.trades.current}`} subText={kpiData.trades.sub} trend={kpiData.trades.trend} tone={getColorByValue("trades", kpiData.trades.current)} />
              <KPICard metric="winrate" icon={<Target className="h-4 w-4" />} label="Win Rate" value={`${kpiData.winrate.current.toFixed(2)}%`} subText={kpiData.winrate.sub} trend={kpiData.winrate.trend} tone={getColorByValue("winrate", kpiData.winrate.current)} />
              <KPICard metric="longShort" icon={<Ratio className="h-4 w-4" />} label="Long / Short" value={kpiData.longShort.current.toFixed(2)} subText={kpiData.longShort.sub} trend={kpiData.longShort.trend} tone={getColorByValue("longShort", kpiData.longShort.current)} />
              <KPICard metric="profitFactor" icon={<TrendingUp className="h-4 w-4" />} label="Profit Factor" value={kpis.profitFactor === 999 ? "inf" : kpiData.profitFactor.current.toFixed(2)} subText={kpiData.profitFactor.sub} trend={kpiData.profitFactor.trend} tone={getColorByValue("profitFactor", kpiData.profitFactor.current)} />
              <KPICard metric="expectancy" icon={<Flame className="h-4 w-4" />} label="Expectancy / Trade" value={fmtUsd(kpiData.expectancy.current)} subText={kpiData.expectancy.sub} trend={kpiData.expectancy.trend} tone={getColorByValue("expectancy", kpiData.expectancy.current)} />
            </div>
          )}

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setShowFilters((v) => !v)}>
              {showFilters ? <FilterX className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          <Tabs defaultValue="calendar">
            <TabsList className="w-full max-w-full justify-start overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="psychology">Psychology</TabsTrigger>
              <TabsTrigger value="risk">Risk management</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle>{format(calendarMonth, "MMMM yyyy")}</CardTitle>
                      <CardDescription>Daily PnL and trade count overview</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCalendarMonth((m) => addMonths(m, -1))}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setCalendarMonth(startOfMonth(new Date()))}>Today</Button>
                      <Button variant="outline" size="sm" onClick={() => setCalendarMonth((m) => addMonths(m, 1))}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading calendar...</p> : null}
                  <div className="overflow-x-auto pb-1">
                    <div className="min-w-[640px]">
                      <div className="grid grid-cols-7 gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <p key={d} className="px-2 py-1">{d}</p>)}
                      </div>
                      <div className="mt-2 grid grid-cols-7 gap-2">
                        {Array.from({ length: firstWeekday }).map((_, idx) => <div key={`blank-${idx}`} className="min-h-24 rounded-lg border border-dashed border-slate-200 dark:border-slate-700" />)}
                        {monthDaysLimited.map((day) => (
                          <CalendarCell
                            key={day.date}
                            day={day}
                            maxPnl={maxPnl}
                            minPnl={minPnl}
                            isActive={selectedDay?.date === day.date}
                            isToday={format(new Date(), "yyyy-MM-dd") === day.date}
                            isBest={bestDay === day.date && day.tradeCount > 0}
                            isWorst={worstDay === day.date && day.tradeCount > 0}
                            streak={streakMap.get(day.date)}
                            onSelect={() => setSelectedDay({ date: day.date, trades: day.trades as UiTrade[] })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <EdgeAnalytics filters={filters} />
            </TabsContent>
            <TabsContent value="performance">
              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                <ChartWrapper title="PnL Trend (Filtered)" description="Daily result based on active filters and calendar range">
                  <PnlLineChart data={performancePnlData} />
                </ChartWrapper>
                <ChartWrapper title="Wins vs Losses by Symbol" description="Top symbols in current filtered dataset">
                  <WinsLossesBarChart data={performanceBySymbol} />
                </ChartWrapper>
              </div>
            </TabsContent>

            {["psychology", "risk", "strategy"].map((tab) => (
              <TabsContent key={tab} value={tab}><Card><CardHeader><CardTitle className="capitalize">{tab.replace("-", " ")}</CardTitle><CardDescription>Placeholder tab ready for future expansion.</CardDescription></CardHeader></Card></TabsContent>
            ))}
          </Tabs>
        </div>

        {showFilters ? <Card className="h-fit min-w-0">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Apply filters to KPIs and calendar</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowFilters(false)}><FilterX className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Symbols</Label>
              <div className="max-h-40 space-y-2 overflow-auto rounded-md border border-slate-200 p-2 dark:border-slate-700">
                {allSymbols.length ? allSymbols.map((symbol) => (
                  <div key={symbol} className="flex items-center gap-2">
                    <Checkbox
                      checked={draftFilters.symbols.includes(symbol)}
                      onCheckedChange={(checked) => setDraftFilters((prev) => ({ ...prev, symbols: checked ? [...prev.symbols, symbol] : prev.symbols.filter((s) => s !== symbol) }))}
                      id={`sym-${symbol}`}
                    />
                    <Label htmlFor={`sym-${symbol}`} className="text-sm font-normal dark:text-slate-200">{symbol}</Label>
                  </div>
                )) : <p className="text-xs text-slate-500 dark:text-slate-400">No symbols available yet.</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const next = { ...draftFilters, from: format(subDays(new Date(), 30), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") };
                  setDraftFilters(next);
                  setFilters(next);
                }}
              >
                Last 30 days
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDraftFilters((prev) => ({ ...prev, symbols: [] }))}>Clear Symbols</Button>
              <Button type="button" onClick={() => setFilters(draftFilters)}>Apply Filters</Button>
              <Button type="button" variant="ghost" onClick={() => void loadSummary()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1"><Label htmlFor="from">From</Label><Input id="from" type="date" value={draftFilters.from} onChange={(e) => setDraftFilters((p) => ({ ...p, from: e.target.value }))} /></div>
              <div className="space-y-1"><Label htmlFor="to">To</Label><Input id="to" type="date" value={draftFilters.to} onChange={(e) => setDraftFilters((p) => ({ ...p, to: e.target.value }))} /></div>
            </div>

            <div className="space-y-1"><Label htmlFor="maxTrades">Max trades</Label><Input id="maxTrades" type="number" min={1} max={500} value={draftFilters.maxTrades} onChange={(e) => setDraftFilters((p) => ({ ...p, maxTrades: e.target.value }))} /></div>

            <div className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800">
              <p className="text-slate-600 dark:text-slate-300">Best Win Streak</p>
              <p className="text-lg font-semibold dark:text-slate-100">{kpis.bestWinStreak} trades</p>
            </div>
          </CardContent>
        </Card> : null}
      </div>

      <DayViewModal
        isOpen={!!selectedDay}
        dateLabel={selectedDay ? format(parseISO(selectedDay.date), "MMMM d, yyyy") : "Day Trades"}
        trades={
          selectedDay?.trades.map((trade) => ({
            id: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            resultUsd: trade.resultUsd,
            riskUsd: trade.riskUsd,
            notes: trade.notes,
            tradeDate: trade.tradeDate.toISOString(),
            journalEntryId: trade.journalEntryId,
          })) ?? []
        }
        onClose={() => setSelectedDay(null)}
        onAddJournal={(trade) => {
          const params = new URLSearchParams({
            tradeId: String(trade.id),
            symbol: trade.symbol,
            tradeDate: trade.tradeDate.slice(0, 10),
            resultUsd: String(trade.resultUsd),
          });
          router.push(`/journal?${params.toString()}`);
        }}
        onViewJournal={(journalEntryId) => {
          router.push(`/journal?entryId=${journalEntryId}`);
        }}
      />
    </div>
  );
}
