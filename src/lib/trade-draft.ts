export const TRADE_DRAFT_STORAGE_KEY = "alpha-journal-trade-draft";

export type ImportedTradeDraft = {
  source: "risk-position-sizer";
  symbol: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  riskUsd: number;
  setup?: string;
  notes?: string;
  createdAt: string;
};

export function saveImportedTradeDraft(draft: ImportedTradeDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRADE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function readImportedTradeDraft() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(TRADE_DRAFT_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ImportedTradeDraft;
  } catch {
    return null;
  }
}

export function clearImportedTradeDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TRADE_DRAFT_STORAGE_KEY);
}
