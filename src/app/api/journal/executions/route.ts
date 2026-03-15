import { NextRequest, NextResponse } from "next/server";
import { endOfDay, startOfDay } from "date-fns";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const dateParam = request.nextUrl.searchParams.get("date");
  if (!dateParam) {
    return NextResponse.json({ message: "date query is required (yyyy-mm-dd)" }, { status: 400 });
  }

  const date = new Date(dateParam);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ message: "Invalid date query" }, { status: 400 });
  }

  const trades = await prisma.trade.findMany({
    where: {
      userId: session.user.id,
      tradeDate: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
    orderBy: [{ tradeDate: "desc" }, { id: "desc" }],
    select: {
      id: true,
      tradeDate: true,
      symbol: true,
      side: true,
      entryPrice: true,
      stopLoss: true,
      takeProfit: true,
      riskUsd: true,
      resultUsd: true,
      status: true,
      notes: true,
      journalEntryId: true,
    },
  });

  return NextResponse.json({ trades });
}
