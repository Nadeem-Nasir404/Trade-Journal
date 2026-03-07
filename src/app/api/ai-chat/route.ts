import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiChatSchema } from "@/lib/validations/ai-chat";

function fmtUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function buildCoachReply(message: string, context: { totalPnl: number; winRate: number; totalTrades: number; topSymbol: string | null; latestJournal: string | null }) {
  const lower = message.toLowerCase();

  const overview = [
    `Current snapshot: ${context.totalTrades} trades, ${context.winRate.toFixed(1)}% winrate, total PnL ${fmtUsd(context.totalPnl)}.`,
    context.topSymbol ? `Top symbol by frequency: ${context.topSymbol}.` : "No top symbol detected yet.",
    context.latestJournal ? `Latest journal focus: "${context.latestJournal}".` : "No journal entry found yet.",
  ];

  if (lower.includes("risk")) {
    return `${overview.join(" ")} Risk focus: set max daily loss and stop trading after two consecutive emotional trades.`;
  }
  if (lower.includes("strategy") || lower.includes("improve")) {
    return `${overview.join(" ")} Improvement plan: keep one setup, log setup tag on each trade, and review only that setup weekly.`;
  }
  if (lower.includes("psychology") || lower.includes("emotion")) {
    return `${overview.join(" ")} Psychology focus: write a 2-line pre-trade intention and one post-trade self-rating before placing the next trade.`;
  }

  return `${overview.join(" ")} Next action: choose one measurable goal for the next 10 trades (example: follow stop-loss 100% of the time).`;
}

async function getGroqReply(input: {
  message: string;
  userId: string;
  trades: Array<{ symbol: string; resultUsd: number; status: string; setup: string | null; strategy: string | null; notes: string | null }>;
  journal: Array<{ title: string; mood: string | null; tags: string | null; content: string }>;
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const tradesContext = input.trades
    .slice(0, 25)
    .map((trade) => `${trade.symbol} | PnL ${trade.resultUsd.toFixed(2)} | ${trade.status} | setup: ${trade.setup ?? "-"} | strategy: ${trade.strategy ?? "-"}`)
    .join("\n");

  const journalContext = input.journal
    .slice(0, 10)
    .map((entry) => `${entry.title} | mood: ${entry.mood ?? "-"} | tags: ${entry.tags ?? "-"} | ${entry.content.slice(0, 180)}`)
    .join("\n");

  const systemPrompt = [
    "You are a professional trading coach.",
    "Give concise, actionable advice with bullet points.",
    "Use direct language. Avoid fluff. Mention risks where relevant.",
    "If data is limited, say that clearly and provide a short plan.",
    "Use ONLY the data provided below. Do not invent trades, symbols, or results.",
    "If the user has 0-3 trades, avoid broad conclusions and explicitly mention the small sample size.",
    `Current user id: ${input.userId}`,
    "",
    "RECENT TRADES:",
    tradesContext || "No trades found.",
    "",
    "RECENT JOURNAL:",
    journalContext || "No journal entries found.",
  ].join("\n");

  const modelCandidates = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "mixtral-8x7b-32768",
  ];

  for (const model of modelCandidates) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.message },
        ],
        temperature: 0.4,
        max_tokens: 450,
      }),
    });

    if (!response.ok) {
      continue;
    }

    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (content) return content;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = aiChatSchema.parse(body);
    const userId = session.user.id;

    const [trades, journal] = await Promise.all([
      prisma.trade.findMany({
        where: { userId, accountId: parsed.accountId ?? undefined },
        orderBy: { tradeDate: "desc" },
        take: 120,
        select: { symbol: true, resultUsd: true, status: true, setup: true, strategy: true, notes: true },
      }),
      prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { entryDate: "desc" },
        take: 12,
        select: { title: true, mood: true, tags: true, content: true },
      }),
    ]);

    const totalTrades = trades.length;
    const totalPnl = trades.reduce((sum, t) => sum + t.resultUsd, 0);
    const wins = trades.filter((t) => t.resultUsd > 0).length;
    const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;

    const symbolCounts = new Map<string, number>();
    for (const t of trades) {
      symbolCounts.set(t.symbol, (symbolCounts.get(t.symbol) ?? 0) + 1);
    }
    const topSymbol = [...symbolCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const latestJournal = journal[0]?.title ?? null;

    const llmReply = await getGroqReply({ message: parsed.message, userId, trades, journal });
    const reply =
      llmReply ??
      buildCoachReply(parsed.message, {
        totalPnl,
        winRate,
        totalTrades,
        topSymbol,
        latestJournal,
      });

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ message: "Invalid payload", error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
