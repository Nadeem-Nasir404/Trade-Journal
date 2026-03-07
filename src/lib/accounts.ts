import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function ensureDefaultAccount(userId: string) {
  let account = await prisma.tradingAccount.findFirst({
    where: { userId, status: { not: "ARCHIVED" } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  if (!account) {
    account = await prisma.tradingAccount.create({
      data: {
        userId,
        name: "Main Account",
        broker: "Manual",
        platform: "Journal",
        startingBalance: 10000,
        currentBalance: 10000,
        currency: "USD",
        accountType: "PERSONAL",
        status: "ACTIVE",
        icon: "💼",
      },
    });
  }

  await prisma.trade.updateMany({
    where: { userId, accountId: null },
    data: { accountId: account.id },
  });

  return account;
}

export async function buildAccountSummaries(userId: string, where?: Prisma.TradingAccountWhereInput) {
  await ensureDefaultAccount(userId);

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId, ...(where ?? {}) },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      trades: {
        select: {
          id: true,
          resultUsd: true,
          tradeDate: true,
        },
      },
    },
  });

  return accounts.map((account) => {
    const totalPnL = account.trades.reduce((sum, trade) => sum + trade.resultUsd, 0);
    const currentBalance = Number((account.startingBalance + totalPnL).toFixed(2));
    const roi = account.startingBalance > 0 ? Number(((totalPnL / account.startingBalance) * 100).toFixed(2)) : 0;
    const progressPct =
      account.profitTarget && account.profitTarget > 0 ? Math.max(0, Math.min(100, (totalPnL / account.profitTarget) * 100)) : null;

    return {
      ...account,
      currentBalance,
      totalPnL: Number(totalPnL.toFixed(2)),
      roi,
      tradeCount: account.trades.length,
      progressPct: progressPct !== null ? Number(progressPct.toFixed(1)) : null,
    };
  });
}

