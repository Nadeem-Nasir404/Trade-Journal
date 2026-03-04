import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const symbols = await prisma.trade.findMany({
    where: { OR: [{ userId: session.user.id }, { userId: null }] },
    distinct: ["symbol"],
    select: { symbol: true },
    orderBy: { symbol: "asc" },
  });

  return NextResponse.json({ symbols: symbols.map((s) => s.symbol) });
}
