import { TradeSide } from "@prisma/client";
import { addDays, subDays } from "date-fns";

import { prisma } from "../src/lib/prisma";

function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}

async function main() {
  await prisma.trade.deleteMany();

  const symbols = ["AAPL", "TSLA", "NVDA", "SPY", "BTCUSD", "ETHUSD", "EURUSD"];
  const now = new Date();

  const trades = Array.from({ length: 90 }).map((_, index) => {
    const symbol = symbols[index % symbols.length];
    const side = index % 3 === 0 ? TradeSide.SHORT : TradeSide.LONG;
    const tradeDate = addDays(subDays(now, 55), (index * 2) % 60);
    const riskUsd = 80 + (index % 7) * 20;

    const baseMove = ((index % 9) - 4) * 0.55;
    const bias = side === TradeSide.LONG ? 0.15 : -0.1;
    const resultUsd = roundTo2(riskUsd * (baseMove + bias));

    const entry = roundTo2(90 + (index % 25) * 4.3 + (side === TradeSide.SHORT ? 20 : 0));

    return {
      userId: "demo-user",
      tradeDate,
      symbol,
      side,
      entryPrice: entry,
      stopLoss: roundTo2(entry * (side === TradeSide.LONG ? 0.985 : 1.015)),
      takeProfit: roundTo2(entry * (side === TradeSide.LONG ? 1.03 : 0.97)),
      riskUsd,
      resultUsd,
      notes: index % 5 === 0 ? "Executed with pre-market plan" : null,
    };
  });

  await prisma.trade.createMany({ data: trades });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    throw error;
  });
