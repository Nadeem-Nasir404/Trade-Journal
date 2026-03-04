import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { endOfDay, endOfMonth, format, parse, startOfDay, startOfMonth, subDays } from "date-fns";
import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth";
import { computeEdgeAnalytics, type EdgeBucket } from "@/lib/edge-analytics";
import { prisma } from "@/lib/prisma";
import { buildCalendarMonthData, calculateKpis } from "@/lib/trades";

function fmtMonth(value?: string | null) {
  if (!value) return startOfMonth(new Date());
  const parsed = parse(value, "yyyy-MM", new Date());
  return Number.isNaN(parsed.getTime()) ? startOfMonth(new Date()) : startOfMonth(parsed);
}

function fmtDay(value: number) {
  return Math.round(value * 100) / 100;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const symbols = searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const month = fmtMonth(searchParams.get("month"));
  const bucketParam = searchParams.get("bucket");
  const bucket: EdgeBucket = bucketParam === "week" || bucketParam === "month" ? bucketParam : "day";
  const maxTradesRaw = Number(searchParams.get("maxTrades") ?? "200");
  const maxTrades = Number.isFinite(maxTradesRaw) ? Math.max(1, Math.min(500, Math.trunc(maxTradesRaw))) : 200;

  const where: Prisma.TradeWhereInput = {
    OR: [{ userId: session.user.id }, { userId: null }],
    symbol: symbols.length ? { in: symbols } : undefined,
    tradeDate:
      from || to
        ? {
            gte: from ? startOfDay(new Date(from)) : undefined,
            lte: to ? endOfDay(new Date(to)) : undefined,
          }
        : undefined,
  };

  const [tradesRaw, symbolRows] = await Promise.all([
    prisma.trade.findMany({
      where,
      orderBy: [{ tradeDate: "desc" }, { id: "desc" }],
      take: maxTrades,
      select: {
        id: true,
        userId: true,
        tradeDate: true,
        symbol: true,
        side: true,
        entryPrice: true,
        stopLoss: true,
        takeProfit: true,
        riskUsd: true,
        resultUsd: true,
        journalEntryId: true,
        notes: true,
        createdAt: true,
      },
    }),
    prisma.trade.findMany({
      where: { OR: [{ userId: session.user.id }, { userId: null }] },
      distinct: ["symbol"],
      select: { symbol: true },
      orderBy: { symbol: "asc" },
    }),
  ]);

  const trades = tradesRaw.map((t) => ({ ...t, tradeDate: t.tradeDate, createdAt: t.createdAt }));
  const kpis = calculateKpis(trades);
  const edge = computeEdgeAnalytics(
    trades.map((t) => ({ symbol: t.symbol, tradeDate: t.tradeDate, resultUsd: t.resultUsd })),
    bucket,
  );

  const monthDays = buildCalendarMonthData(trades, month).map((day) => ({
    ...day,
    pnl: fmtDay(day.pnl),
    trades: day.trades.map((t) => ({
      ...t,
      tradeDate: t.tradeDate.toISOString(),
      createdAt: t.createdAt.toISOString(),
    })),
  }));

  const start30 = subDays(new Date(), 29);
  const byDay = new Map<string, number>();
  for (const trade of trades) {
    const key = format(trade.tradeDate, "MM/dd");
    byDay.set(key, (byDay.get(key) ?? 0) + trade.resultUsd);
  }
  const pnlTrend = [...byDay.entries()].map(([date, pnl]) => ({ date, pnl: fmtDay(pnl) }));

  const bySymbol = new Map<string, { wins: number; losses: number }>();
  for (const trade of trades) {
    const row = bySymbol.get(trade.symbol) ?? { wins: 0, losses: 0 };
    if (trade.resultUsd > 0) row.wins += 1;
    if (trade.resultUsd < 0) row.losses += 1;
    bySymbol.set(trade.symbol, row);
  }
  const symbolWinsLosses = [...bySymbol.entries()]
    .map(([symbol, row]) => ({ symbol, wins: row.wins, losses: row.losses }))
    .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
    .slice(0, 8);

  return NextResponse.json({
    trades: trades.map((t) => ({ ...t, tradeDate: t.tradeDate.toISOString(), createdAt: t.createdAt.toISOString() })),
    symbols: symbolRows.map((s) => s.symbol),
    kpis,
    calendar: {
      month: format(month, "yyyy-MM"),
      days: monthDays,
      maxPnl: Math.max(0, ...monthDays.map((d) => d.pnl)),
      minPnl: Math.min(0, ...monthDays.map((d) => d.pnl)),
      bestDay: [...monthDays].sort((a, b) => b.pnl - a.pnl)[0]?.date ?? null,
      worstDay: [...monthDays].sort((a, b) => a.pnl - b.pnl)[0]?.date ?? null,
    },
    performance: {
      pnlTrend,
      symbolWinsLosses,
      monthStart: startOfMonth(month).toISOString(),
      monthEnd: endOfMonth(month).toISOString(),
      recentStart: start30.toISOString(),
    },
    edge,
    meta: {
      generatedAt: new Date().toISOString(),
      bucket,
    },
  });
}
