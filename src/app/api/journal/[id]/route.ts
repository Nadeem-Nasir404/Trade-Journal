import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { journalEntrySchema } from "@/lib/validations/journal";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const entry = await prisma.journalEntry.findFirst({
    where: { id: Number(id), userId: session.user.id },
    include: {
      trades: {
        where: { userId: session.user.id },
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = journalEntrySchema.parse({ ...body, score: body.score === "" ? null : body.score });
    const entryId = Number(id);
    const linkedTradeIds = [...new Set(parsed.linkedTradeIds ?? [])];

    const entry = await prisma.$transaction(async (tx) => {
      const existing = await tx.journalEntry.findFirst({
        where: { id: entryId, userId: session.user.id },
        select: { id: true },
      });

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      await tx.trade.updateMany({
        where: { journalEntryId: entryId, userId: session.user.id },
        data: { journalEntryId: null },
      });

      if (linkedTradeIds.length) {
        await tx.trade.updateMany({
          where: { id: { in: linkedTradeIds }, userId: session.user.id },
          data: { journalEntryId: entryId },
        });
      }

      await tx.journalEntry.update({
        where: { id: entryId },
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

      return tx.journalEntry.findUnique({
        where: { id: entryId },
        include: { trades: { where: { userId: session.user.id } } },
      });
    });

    return NextResponse.json({ entry });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Invalid payload", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const entryId = Number(id);
    await prisma.$transaction(async (tx) => {
      const existing = await tx.journalEntry.findFirst({
        where: { id: entryId, userId: session.user.id },
        select: { id: true },
      });

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      await tx.trade.updateMany({
        where: { journalEntryId: entryId, userId: session.user.id },
        data: { journalEntryId: null },
      });
      await tx.journalEntry.delete({ where: { id: entryId } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Entry not found" }, { status: 404 });
  }
}
