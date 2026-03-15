import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { ensureDefaultAccount } from "@/lib/accounts";
import { prisma } from "@/lib/prisma";
import { tradeSchema } from "@/lib/validations/trade";

function normalizeNullableNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return value;
}

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const trade = await prisma.trade.findFirst({
    where: { id: Number(id), userId: session.user.id },
  });

  if (!trade) {
    return NextResponse.json({ message: "Trade not found" }, { status: 404 });
  }

  return NextResponse.json({ trade });
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const tradeId = Number(id);
    const defaultAccount = await ensureDefaultAccount(session.user.id);

    const existing = await prisma.trade.findFirst({
      where: { id: tradeId, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    const parsed = tradeSchema.parse({
      ...body,
      entryPrice: normalizeNullableNumber(body.entryPrice),
      exitPrice: normalizeNullableNumber(body.exitPrice),
      stopLoss: normalizeNullableNumber(body.stopLoss),
      takeProfit: normalizeNullableNumber(body.takeProfit),
    });

    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        userId: session.user.id,
        accountId: parsed.accountId ?? defaultAccount.id,
        tradeDate: parsed.tradeDate,
        symbol: parsed.symbol.toUpperCase(),
        side: parsed.side,
        entryPrice: parsed.entryPrice ?? null,
        exitPrice: parsed.exitPrice ?? null,
        stopLoss: parsed.stopLoss ?? null,
        takeProfit: parsed.takeProfit ?? null,
        quantity: parsed.quantity ?? 1,
        riskUsd: parsed.riskUsd,
        resultUsd: parsed.resultUsd,
        status: parsed.status,
        setup: parsed.setup || null,
        strategy: parsed.strategy || null,
        analysis: parsed.analysis ?? null,
        emotions: parsed.emotions || null,
        notes: parsed.notes || null,
        screenshots: parsed.screenshots ?? [],
      },
    });

    return NextResponse.json({ trade });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid payload", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const tradeId = Number(id);
    const existing = await prisma.trade.findFirst({
      where: { id: tradeId, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    await prisma.trade.delete({ where: { id: tradeId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Trade not found" }, { status: 404 });
  }
}
