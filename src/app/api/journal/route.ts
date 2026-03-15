import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { journalEntrySchema, journalFiltersSchema } from "@/lib/validations/journal";

function parseFilters(searchParams: URLSearchParams) {
  return journalFiltersSchema.parse({
    q: searchParams.get("q") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    maxEntries: searchParams.get("maxEntries") ?? undefined,
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const filters = parseFilters(request.nextUrl.searchParams);

    const where: Prisma.JournalEntryWhereInput = {
      userId: session.user.id,
      OR: filters.q
        ? [
            { title: { contains: filters.q, mode: "insensitive" } },
            { content: { contains: filters.q, mode: "insensitive" } },
            { tags: { contains: filters.q, mode: "insensitive" } },
          ]
        : undefined,
      entryDate:
        filters.from || filters.to
          ? {
              gte: filters.from ? startOfDay(filters.from) : undefined,
              lte: filters.to ? endOfDay(filters.to) : undefined,
            }
          : undefined,
    };

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: [{ entryDate: "desc" }, { id: "desc" }],
      take: filters.maxEntries ?? 100,
      include: {
        trades: {
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
          },
          orderBy: [{ tradeDate: "desc" }, { id: "desc" }],
        },
      },
    });

    return NextResponse.json({
      entries: entries.map((entry) => ({
        ...entry,
        executionSummary: {
          linkedExecutions: entry.trades.length,
          netImpact: Math.round(entry.trades.reduce((sum, trade) => sum + trade.resultUsd, 0) * 100) / 100,
          avgRiskReward:
            entry.trades.length > 0
              ? Math.round(
                  (entry.trades.reduce((sum, trade) => sum + (trade.riskUsd > 0 ? trade.resultUsd / trade.riskUsd : 0), 0) / entry.trades.length) * 100,
                ) / 100
              : 0,
          statusBreakdown: {
            running: entry.trades.filter((trade) => trade.status === "RUNNING").length,
            profit: entry.trades.filter((trade) => trade.status === "PROFIT").length,
            loss: entry.trades.filter((trade) => trade.status === "LOSS").length,
            breakeven: entry.trades.filter((trade) => trade.status === "BREAKEVEN").length,
          },
        },
      })),
    });
  } catch (error) {
    return NextResponse.json({ message: "Invalid filters", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = journalEntrySchema.parse({ ...body, score: body.score === "" ? null : body.score });

    const linkedTradeIds = [...new Set(parsed.linkedTradeIds ?? [])];

    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.journalEntry.create({
        data: {
          userId: session.user.id,
          entryDate: parsed.entryDate,
          title: parsed.title,
          content: parsed.content,
          imageUrl: parsed.imageUrl || null,
          mood: parsed.mood || null,
          tags: parsed.tags || null,
          strategyTags: parsed.strategyTags || null,
          preTradeMood: parsed.preTradeMood || null,
          executionQuality: parsed.executionQuality || null,
          score: parsed.score ?? null,
        },
      });

      if (linkedTradeIds.length) {
        await tx.trade.updateMany({
          where: { id: { in: linkedTradeIds }, userId: session.user.id },
          data: { journalEntryId: created.id },
        });
      }

      return tx.journalEntry.findUnique({
        where: { id: created.id },
        include: { trades: true },
      });
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Invalid payload", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
