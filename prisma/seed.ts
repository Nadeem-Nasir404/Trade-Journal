import { TradeSide, TradeStatus } from "@prisma/client";
import { addDays, subDays } from "date-fns";

import { prisma } from "../src/lib/prisma";

function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}

async function main() {
  await prisma.journalEntry.deleteMany();
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
    const status = resultUsd > 0 ? TradeStatus.PROFIT : resultUsd < 0 ? TradeStatus.LOSS : TradeStatus.BREAKEVEN;

    const entry = roundTo2(90 + (index % 25) * 4.3 + (side === TradeSide.SHORT ? 20 : 0));
    const exitPrice = roundTo2(entry + resultUsd / Math.max(1, 50 + (index % 5) * 10));
    const emotion = index % 6 === 0 ? "FOMO, Excited" : index % 4 === 0 ? "Calm, Focused" : "Disciplined";
    const setup = index % 3 === 0 ? "Breakout" : index % 3 === 1 ? "Pullback" : "Reversal";
    const strategy = index % 2 === 0 ? "Scalping" : "Intraday";

    return {
      userId: "demo-user",
      tradeDate,
      symbol,
      side,
      entryPrice: entry,
      exitPrice,
      stopLoss: roundTo2(entry * (side === TradeSide.LONG ? 0.985 : 1.015)),
      takeProfit: roundTo2(entry * (side === TradeSide.LONG ? 1.03 : 0.97)),
      riskUsd,
      resultUsd,
      status,
      setup,
      strategy,
      emotions: emotion,
      notes: index % 5 === 0 ? "Executed with pre-market plan and respected stop." : null,
    };
  });

  await prisma.trade.createMany({ data: trades });

  const recentTrades = await prisma.trade.findMany({
    where: { userId: "demo-user" },
    orderBy: { tradeDate: "desc" },
    take: 15,
  });

  const grouped: Array<Array<(typeof recentTrades)[number]>> = [recentTrades.slice(0, 5), recentTrades.slice(5, 10), recentTrades.slice(10, 15)];
  const journalTemplates = [
    { title: "Weekly Reflection: Discipline and Patience", mood: "GOOD", score: 8, tags: "weekly, discipline, execution" },
    { title: "Daily Reflection: Volatility Session", mood: "NEUTRAL", score: 7, tags: "daily, volatility, risk-control" },
    { title: "Trade Review: Breakout Entries", mood: "GREAT", score: 9, tags: "trade, breakout, consistency" },
  ];

  for (let i = 0; i < grouped.length; i += 1) {
    const linked = grouped[i];
    if (!linked.length) continue;
    const net = roundTo2(linked.reduce((sum, t) => sum + t.resultUsd, 0));
    const winCount = linked.filter((t) => t.resultUsd > 0).length;
    const lossCount = linked.filter((t) => t.resultUsd < 0).length;
    const template = journalTemplates[i];

    const created = await prisma.journalEntry.create({
      data: {
        userId: "demo-user",
        entryDate: linked[0].tradeDate,
        title: template.title,
        mood: template.mood,
        score: template.score,
        tags: template.tags,
        content: [
          `Plan:\nFocused on high-quality setups with strict risk limits.`,
          `Execution:\nReviewed ${linked.length} linked trades with net impact ${net >= 0 ? "+" : ""}${net.toFixed(2)} USD.`,
          `What went well:\nStrong discipline on entries and better trade selection.`,
          `What to improve:\nAvoid reactive entries after two consecutive losses.`,
          `Key lesson:\nConsistency beats intensity when market conditions are mixed.`,
          `Stats:\nWins ${winCount}, Losses ${lossCount}.`,
        ].join("\n\n"),
      },
    });

    await prisma.trade.updateMany({
      where: { id: { in: linked.map((t) => t.id) } },
      data: { journalEntryId: created.id },
    });
  }
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
