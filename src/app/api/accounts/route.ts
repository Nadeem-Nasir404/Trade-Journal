import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { buildAccountSummaries } from "@/lib/accounts";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const where = status ? { status: status as "ACTIVE" | "PAUSED" | "COMPLETED" | "FAILED" | "ARCHIVED" } : undefined;
  const accounts = await buildAccountSummaries(session.user.id, where);
  return NextResponse.json({ accounts });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const startingBalance = Number(body.startingBalance ?? 0);
  if (!body.name || !Number.isFinite(startingBalance) || startingBalance <= 0) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const account = await prisma.tradingAccount.create({
    data: {
      userId: session.user.id,
      name: String(body.name).trim(),
      broker: body.broker?.trim() || null,
      platform: body.platform?.trim() || null,
      startingBalance,
      currentBalance: startingBalance,
      currency: body.currency?.trim() || "USD",
      accountType: body.accountType || "PERSONAL",
      status: body.status || "ACTIVE",
      profitTarget: body.profitTarget ? Number(body.profitTarget) : null,
      maxDailyLoss: body.maxDailyLoss ? Number(body.maxDailyLoss) : null,
      maxOverallDrawdown: body.maxOverallDrawdown ? Number(body.maxOverallDrawdown) : null,
      maxDailyLossType: body.maxDailyLossType || null,
      maxDrawdownType: body.maxDrawdownType || null,
      icon: body.icon?.trim() || "💼",
      color: body.color?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  });

  return NextResponse.json({ account }, { status: 201 });
}

