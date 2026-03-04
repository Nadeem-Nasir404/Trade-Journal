import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { journalEntrySchema } from "@/lib/validations/journal";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const entry = await prisma.journalEntry.findUnique({
    where: { id: Number(id) },
    include: {
      trades: {
        orderBy: [{ tradeDate: "desc" }, { id: "desc" }],
      },
    },
  });

  if (!entry) {
    return NextResponse.json({ message: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = journalEntrySchema.parse({ ...body, score: body.score === "" ? null : body.score });
    const entryId = Number(id);
    const linkedTradeIds = [...new Set(parsed.linkedTradeIds ?? [])];

    const entry = await prisma.$transaction(async (tx) => {
      await tx.trade.updateMany({
        where: { journalEntryId: entryId },
        data: { journalEntryId: null },
      });

      if (linkedTradeIds.length) {
        await tx.trade.updateMany({
          where: { id: { in: linkedTradeIds } },
          data: { journalEntryId: entryId },
        });
      }

      await tx.journalEntry.update({
        where: { id: entryId },
        data: {
          userId: parsed.userId || null,
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

      return tx.journalEntry.findUnique({
        where: { id: entryId },
        include: { trades: true },
      });
    });

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ message: "Invalid payload", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const entryId = Number(id);
    await prisma.$transaction(async (tx) => {
      await tx.trade.updateMany({
        where: { journalEntryId: entryId },
        data: { journalEntryId: null },
      });
      await tx.journalEntry.delete({ where: { id: entryId } });
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Entry not found" }, { status: 404 });
  }
}
