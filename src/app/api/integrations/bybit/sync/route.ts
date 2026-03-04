import crypto from "crypto";
import { NextResponse } from "next/server";
import { TradeSide, TradeStatus } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type BybitExecution = {
  execId?: string;
  orderId?: string;
  symbol?: string;
  side?: string;
  execPrice?: string;
  execQty?: string;
  execTime?: string;
  closedPnl?: string;
  execFee?: string;
};

function signBybitPayload(secret: string, timestamp: string, apiKey: string, recvWindow: string, queryString: string) {
  const payload = `${timestamp}${apiKey}${recvWindow}${queryString}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { message: "Missing BYBIT_API_KEY or BYBIT_API_SECRET in environment variables." },
      { status: 400 },
    );
  }

  const baseUrl = process.env.BYBIT_BASE_URL || "https://api.bybit.com";
  const recvWindow = process.env.BYBIT_RECV_WINDOW || "5000";
  const category = process.env.BYBIT_CATEGORY || "linear";
  const limit = process.env.BYBIT_LIMIT || "200";
  const timestamp = Date.now().toString();

  const queryParams = new URLSearchParams({
    category,
    limit,
  });
  const queryString = queryParams.toString();
  const signature = signBybitPayload(apiSecret, timestamp, apiKey, recvWindow, queryString);

  const response = await fetch(`${baseUrl}/v5/execution/list?${queryString}`, {
    method: "GET",
    headers: {
      "X-BAPI-API-KEY": apiKey,
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-RECV-WINDOW": recvWindow,
      "X-BAPI-SIGN": signature,
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as {
    retCode?: number;
    retMsg?: string;
    result?: { list?: BybitExecution[] };
  } | null;

  if (!response.ok || !data || data.retCode !== 0) {
    return NextResponse.json(
      { message: data?.retMsg || "Failed to fetch Bybit executions." },
      { status: 400 },
    );
  }

  const executions = (data.result?.list ?? []).filter((item) => item.execId && item.symbol);
  if (!executions.length) {
    return NextResponse.json({ imported: 0, skipped: 0, message: "No executions returned by Bybit." });
  }

  const externalIds = executions.map((item) => item.execId as string);
  const existing = await prisma.trade.findMany({
    where: {
      userId: session.user.id,
      source: "BYBIT",
      externalId: { in: externalIds },
    },
    select: { externalId: true },
  });
  const existingSet = new Set(existing.map((row) => row.externalId).filter(Boolean));

  const toCreate = executions
    .filter((item) => !existingSet.has(item.execId as string))
    .map((item) => {
      const side = String(item.side || "").toUpperCase() === "SELL" ? TradeSide.SHORT : TradeSide.LONG;
      const price = toNumber(item.execPrice);
      const quantity = Math.max(toNumber(item.execQty), 0);
      const pnl = toNumber(item.closedPnl);
      const fee = Math.abs(toNumber(item.execFee));
      const resultUsd = Number((pnl - fee).toFixed(2));
      const status =
        resultUsd > 0 ? TradeStatus.PROFIT : resultUsd < 0 ? TradeStatus.LOSS : TradeStatus.BREAKEVEN;

      return {
        userId: session.user.id,
        source: "BYBIT",
        externalId: item.execId as string,
        tradeDate: item.execTime ? new Date(Number(item.execTime)) : new Date(),
        symbol: String(item.symbol || "").toUpperCase(),
        side,
        entryPrice: price || null,
        exitPrice: null,
        stopLoss: null,
        takeProfit: null,
        quantity: quantity || 1,
        riskUsd: 0,
        resultUsd,
        status,
        setup: "Bybit Import",
        strategy: "API Sync",
        emotions: null,
        notes: `Bybit sync (${category}) | orderId: ${item.orderId ?? "n/a"} | fee: ${fee.toFixed(2)}`,
      };
    });

  if (toCreate.length) {
    await prisma.trade.createMany({ data: toCreate });
  }

  return NextResponse.json({
    imported: toCreate.length,
    skipped: executions.length - toCreate.length,
    totalFetched: executions.length,
  });
}

