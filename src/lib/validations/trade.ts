import { TradeSide, TradeStatus } from "@prisma/client";
import { z } from "zod";

export const tradeAnalysisSchema = z.object({
  entryRetests: z.coerce.number().int().min(0).max(20).optional().default(0),
  entryTimeframe: z.string().trim().max(20).optional().default(""),
  marketCondition: z.string().trim().max(80).optional().default(""),
  htfConfluence: z.string().trim().max(200).optional().default(""),
  confluences: z.array(z.string().trim().min(1).max(80)).max(30).optional().default([]),
});

export const tradeSchema = z.object({
  userId: z.string().trim().optional().or(z.literal("")),
  accountId: z.coerce.number().int().positive().optional().nullable(),
  tradeDate: z.coerce.date(),
  symbol: z.string().trim().min(1).max(20),
  side: z.nativeEnum(TradeSide),
  entryPrice: z.coerce.number().positive().optional().nullable(),
  exitPrice: z.coerce.number().positive().optional().nullable(),
  stopLoss: z.coerce.number().positive().optional().nullable(),
  takeProfit: z.coerce.number().positive().optional().nullable(),
  quantity: z.coerce.number().positive().optional().default(1),
  riskUsd: z.coerce.number().nonnegative(),
  resultUsd: z.coerce.number(),
  status: z.nativeEnum(TradeStatus).optional().default(TradeStatus.RUNNING),
  setup: z.string().trim().max(80).optional().or(z.literal("")),
  strategy: z.string().trim().max(80).optional().or(z.literal("")),
  analysis: tradeAnalysisSchema.optional().nullable(),
  emotions: z.string().trim().max(240).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  screenshots: z.array(z.string().trim().min(1)).optional().default([]),
});

export const tradeFiltersSchema = z.object({
  symbols: z.array(z.string()).optional().default([]),
  accountId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  maxTrades: z.coerce.number().int().positive().max(500).optional(),
});

export type TradeInput = z.infer<typeof tradeSchema>;
export type TradeFiltersInput = z.infer<typeof tradeFiltersSchema>;
