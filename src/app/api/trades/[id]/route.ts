import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

function normalizeAnalysis(value: unknown) {
  return value ? (value as Prisma.InputJsonValue) : Prisma.JsonNull;
}

function isMissingAnalysisColumn(error: unknown) {
  return error instanceof Error && error.message.includes("Trade.analysis");
}

function isMissingGradeColumn(error: unknown) {
  return error instanceof Error && error.message.includes("Trade.grade");
}

function isMissingSessionColumn(error: unknown) {
  return error instanceof Error && error.message.includes("Trade.session");
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
  let trade;
  try {
    trade = await prisma.trade.findFirst({
      where: { id: Number(id), userId: session.user.id },
    });
  } catch (error) {
    if (!isMissingAnalysisColumn(error) && !isMissingGradeColumn(error) && !isMissingSessionColumn(error)) throw error;
    trade = await prisma.trade.findFirst({
      where: { id: Number(id), userId: session.user.id },
      select: {
        id: true,
        userId: true,
        accountId: true,
        source: true,
        externalId: true,
        tradeDate: true,
        symbol: true,
        side: true,
        entryPrice: true,
        exitPrice: true,
        stopLoss: true,
        takeProfit: true,
        quantity: true,
        riskUsd: true,
        resultUsd: true,
        status: true,
        grade: true,
        session: true,
        setup: true,
        strategy: true,
        emotions: true,
        notes: true,
        screenshots: true,
        createdAt: true,
        journalEntryId: true,
      },
    });
    trade = trade ? { ...trade, analysis: null, grade: null, session: null } : trade;
  }

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

    let trade;
    try {
      trade = await prisma.trade.update({
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
          grade: parsed.grade || null,
          session: parsed.session || null,
          setup: parsed.setup || null,
          strategy: parsed.strategy || null,
          analysis: normalizeAnalysis(parsed.analysis),
          emotions: parsed.emotions || null,
          notes: parsed.notes || null,
          screenshots: parsed.screenshots ?? [],
        },
      });
    } catch (error) {
      if (!isMissingAnalysisColumn(error) && !isMissingGradeColumn(error) && !isMissingSessionColumn(error)) throw error;
      trade = await prisma.trade.update({
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
          emotions: parsed.emotions || null,
          notes: parsed.notes || null,
          screenshots: parsed.screenshots ?? [],
        },
      });
    }

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
