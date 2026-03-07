import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const accountId = Number(id);

  const existing = await prisma.tradingAccount.findFirst({
    where: { id: accountId, userId: session.user.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  const account = await prisma.tradingAccount.update({
    where: { id: accountId },
    data: {
      name: body.name?.trim() || undefined,
      broker: body.broker?.trim() || null,
      platform: body.platform?.trim() || null,
      currency: body.currency?.trim() || undefined,
      accountType: body.accountType || undefined,
      status: body.status || undefined,
      profitTarget: body.profitTarget ? Number(body.profitTarget) : null,
      maxDailyLoss: body.maxDailyLoss ? Number(body.maxDailyLoss) : null,
      maxOverallDrawdown: body.maxOverallDrawdown ? Number(body.maxOverallDrawdown) : null,
      maxDailyLossType: body.maxDailyLossType || null,
      maxDrawdownType: body.maxDrawdownType || null,
      icon: body.icon?.trim() || undefined,
      color: body.color?.trim() || null,
      notes: body.notes?.trim() || null,
      archivedAt: body.status === "ARCHIVED" ? new Date() : null,
    },
  });

  return NextResponse.json({ account });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const accountId = Number(id);

  const account = await prisma.tradingAccount.findFirst({
    where: { id: accountId, userId: session.user.id },
    include: { trades: { select: { id: true } } },
  });

  if (!account) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  if (account.trades.length > 0) {
    return NextResponse.json({ message: "Cannot delete account with trades. Archive it instead." }, { status: 400 });
  }

  await prisma.tradingAccount.delete({ where: { id: accountId } });
  return NextResponse.json({ ok: true });
}

