import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { ensureDefaultAccount } from "@/lib/accounts";
import { authOptions } from "@/lib/auth";
import { tradeFiltersSchema, tradeSchema } from "@/lib/validations/trade";

function normalizeNullableNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return value;
}

function parseFilters(searchParams: URLSearchParams) {
  const symbols = searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  const accountId = searchParams.get("accountId") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const maxTrades = searchParams.get("maxTrades") ?? undefined;

  return tradeFiltersSchema.parse({
    symbols,
    accountId,
    from,
    to,
    maxTrades,
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const filters = parseFilters(request.nextUrl.searchParams);

    const where: Prisma.TradeWhereInput = {
      OR: [{ userId: session.user.id }, { userId: null }],
      accountId: filters.accountId ?? undefined,
      symbol: filters.symbols.length ? { in: filters.symbols } : undefined,
      tradeDate:
        filters.from || filters.to
          ? {
              gte: filters.from ? startOfDay(filters.from) : undefined,
              lte: filters.to ? endOfDay(filters.to) : undefined,
            }
          : undefined,
    };

    const trades = await prisma.trade.findMany({
      where,
      orderBy: [{ tradeDate: "desc" }, { id: "desc" }],
      take: filters.maxTrades,
      select: {
        id: true,
        userId: true,
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
        setup: true,
        strategy: true,
        emotions: true,
        notes: true,
        screenshots: true,
        journalEntryId: true,
        accountId: true,
        account: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        createdAt: true,
      },
    });

    return NextResponse.json({ trades });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid filters", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const defaultAccount = await ensureDefaultAccount(session.user.id);
    const parsed = tradeSchema.parse({
      ...body,
      entryPrice: normalizeNullableNumber(body.entryPrice),
      exitPrice: normalizeNullableNumber(body.exitPrice),
      stopLoss: normalizeNullableNumber(body.stopLoss),
      takeProfit: normalizeNullableNumber(body.takeProfit),
    });

    const trade = await prisma.trade.create({
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

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid payload", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
