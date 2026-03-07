import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { buildAccountSummaries } from "@/lib/accounts";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const summaries = await buildAccountSummaries(session.user.id, { id: Number(id) });
  const account = summaries[0];

  if (!account) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  const wins = account.trades.filter((trade) => trade.resultUsd > 0).length;
  const losses = account.trades.filter((trade) => trade.resultUsd < 0).length;
  const totalTrades = account.tradeCount;

  return NextResponse.json({
    account,
    stats: {
      totalTrades,
      wins,
      losses,
      winRate: totalTrades ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0,
      totalPnL: account.totalPnL,
      currentBalance: account.currentBalance,
      profit: account.totalPnL,
    },
  });
}

