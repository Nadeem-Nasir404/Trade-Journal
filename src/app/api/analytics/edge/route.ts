import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { endOfDay, endOfMonth, parse, startOfDay, startOfMonth } from "date-fns";
import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth";
import { computeEdgeAnalytics, type EdgeBucket } from "@/lib/edge-analytics";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const searchParams = request.nextUrl.searchParams;

  const symbols = searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const accountId = searchParams.get("accountId");
  const month = searchParams.get("month");
  const bucketParam = searchParams.get("bucket");
  const bucket: EdgeBucket = bucketParam === "week" || bucketParam === "month" ? bucketParam : "day";
  const maxTradesRaw = Number(searchParams.get("maxTrades") ?? "200");
  const maxTrades = Number.isFinite(maxTradesRaw) ? Math.max(1, Math.min(500, Math.trunc(maxTradesRaw))) : 200;
  const selectedMonth = month ? parse(month, "yyyy-MM", new Date()) : null;
  const hasValidMonth = selectedMonth && !Number.isNaN(selectedMonth.getTime());

  const where: Prisma.TradeWhereInput = {
    OR: [{ userId }, { userId: null }],
    accountId: accountId ? Number(accountId) : undefined,
    symbol: symbols.length ? { in: symbols } : undefined,
    tradeDate:
      hasValidMonth
        ? {
            gte: startOfMonth(selectedMonth),
            lte: endOfMonth(selectedMonth),
          }
        : from || to
        ? {
            gte: from ? startOfDay(new Date(from)) : undefined,
            lte: to ? endOfDay(new Date(to)) : undefined,
          }
        : undefined,
  };

  const trades = await prisma.trade.findMany({
    where,
    orderBy: [{ tradeDate: "desc" }, { id: "desc" }],
    take: maxTrades,
    select: {
      symbol: true,
      tradeDate: true,
      resultUsd: true,
    },
  });

  const kpis = computeEdgeAnalytics(trades, bucket);

  return NextResponse.json({
    kpis,
    meta: {
      currency: "USD",
      generatedAt: new Date().toISOString(),
      bucket,
    },
  });
}
