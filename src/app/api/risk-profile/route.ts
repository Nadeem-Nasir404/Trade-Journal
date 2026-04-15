import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildRiskDashboard, getBuiltInRules } from "@/lib/risk-dashboard";
import { riskProfileSchema } from "@/lib/validations/risk-profile";

async function getOwnedAccount(userId: string, accountId: number) {
  return prisma.tradingAccount.findFirst({
    where: { id: accountId, userId },
    include: {
      riskProfile: true,
      trades: {
        orderBy: [{ tradeDate: "desc" }, { id: "desc" }],
        select: {
          id: true,
          tradeDate: true,
          symbol: true,
          resultUsd: true,
          riskUsd: true,
          entryPrice: true,
          exitPrice: true,
          quantity: true,
          side: true,
          status: true,
        },
      },
    },
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const accountId = Number(request.nextUrl.searchParams.get("accountId"));
  if (!Number.isFinite(accountId) || accountId <= 0) {
    return NextResponse.json({ message: "Valid accountId is required" }, { status: 400 });
  }

  const account = await getOwnedAccount(session.user.id, accountId);
  if (!account) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  const dashboard = buildRiskDashboard(
    {
      accountType: account.accountType === "FUNDED" ? "FUNDED" : "PERSONAL",
      startingBalance: account.startingBalance,
      currentBalance: account.currentBalance,
      maxDailyLoss: account.maxDailyLoss,
      maxOverallDrawdown: account.maxOverallDrawdown,
      maxDailyLossType: account.maxDailyLossType,
      maxDrawdownType: account.maxDrawdownType,
      phase1TargetPct: account.riskProfile?.phase1TargetPct ?? null,
      phase2TargetPct: account.riskProfile?.phase2TargetPct ?? null,
      personalDailyLossPct: account.riskProfile?.personalDailyLossPct ?? null,
    },
    account.trades,
  );

  return NextResponse.json({
    account: {
      id: account.id,
      name: account.name,
      broker: account.broker,
      platform: account.platform,
      startingBalance: account.startingBalance,
      currentBalance: account.currentBalance,
      accountType: account.accountType === "FUNDED" ? "FUNDED" : "PERSONAL",
      maxDailyLoss: account.maxDailyLoss,
      maxOverallDrawdown: account.maxOverallDrawdown,
      maxDailyLossType: account.maxDailyLossType,
      maxDrawdownType: account.maxDrawdownType,
    },
    riskProfile: {
      phase1TargetPct: account.riskProfile?.phase1TargetPct ?? null,
      phase2TargetPct: account.riskProfile?.phase2TargetPct ?? null,
      personalDailyLossPct: account.riskProfile?.personalDailyLossPct ?? null,
      customRules: account.riskProfile?.customRules ?? [],
    },
    builtInRules: getBuiltInRules(account.accountType === "FUNDED" ? "FUNDED" : "PERSONAL"),
    dashboard,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = riskProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const existing = await prisma.tradingAccount.findFirst({
    where: { id: input.accountId, userId: session.user.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  await prisma.tradingAccount.update({
    where: { id: input.accountId },
    data: {
      accountType: input.accountType,
      startingBalance: input.startingBalance,
      currentBalance: input.currentBalance,
      maxDailyLoss:
        input.accountType === "FUNDED"
          ? input.maxDailyLoss ?? null
          : input.personalDailyLossPct
            ? (input.startingBalance * input.personalDailyLossPct) / 100
            : null,
      maxOverallDrawdown: input.accountType === "FUNDED" ? input.maxOverallDrawdown ?? null : null,
      maxDailyLossType:
        input.accountType === "FUNDED"
          ? input.maxDailyLossType ?? "PERCENTAGE"
          : input.personalDailyLossPct
            ? "FIXED"
            : null,
      maxDrawdownType: input.accountType === "FUNDED" ? input.maxDrawdownType ?? "PERCENTAGE" : null,
      riskProfile: {
        upsert: {
          create: {
            userId: session.user.id,
            phase1TargetPct: input.accountType === "FUNDED" ? input.phase1TargetPct ?? null : null,
            phase2TargetPct: input.accountType === "FUNDED" ? input.phase2TargetPct ?? null : null,
            personalDailyLossPct: input.accountType === "PERSONAL" ? input.personalDailyLossPct ?? null : null,
            customRules: input.customRules,
          },
          update: {
            phase1TargetPct: input.accountType === "FUNDED" ? input.phase1TargetPct ?? null : null,
            phase2TargetPct: input.accountType === "FUNDED" ? input.phase2TargetPct ?? null : null,
            personalDailyLossPct: input.accountType === "PERSONAL" ? input.personalDailyLossPct ?? null : null,
            customRules: input.customRules,
          },
        },
      },
    },
  });

  return GET(new NextRequest(`${request.nextUrl.origin}/api/risk-profile?accountId=${input.accountId}`));
}
