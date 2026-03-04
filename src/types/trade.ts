import { Trade, TradeSide } from "@prisma/client";

export type TradeFormValues = {
  id?: number;
  userId?: string;
  tradeDate: string;
  symbol: string;
  side: TradeSide;
  entryPrice?: string;
  stopLoss?: string;
  takeProfit?: string;
  riskUsd: string;
  resultUsd: string;
  notes?: string;
};

export type TradesApiResponse = {
  trades: Trade[];
};
