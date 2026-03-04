import { NextRequest, NextResponse } from "next/server";

type CachedSymbols = {
  expiresAt: number;
  symbols: string[];
};

let cache: CachedSymbols | null = null;

const FALLBACK = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "AAPL",
  "TSLA",
  "NVDA",
  "SPY",
  "EURUSD",
  "GBPUSD",
  "XAUUSD",
];

async function fetchBinanceSymbols() {
  const res = await fetch("https://api.binance.com/api/v3/exchangeInfo", { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { symbols?: Array<{ symbol: string; status: string }> };
  return (json.symbols ?? [])
    .filter((s) => s.status === "TRADING")
    .map((s) => s.symbol)
    .slice(0, 3000);
}

async function fetchCoinGeckoSymbols() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/list", { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as Array<{ symbol: string }>;
  return json
    .map((c) => c.symbol?.toUpperCase())
    .filter((s): s is string => Boolean(s && s.length >= 2 && s.length <= 12))
    .slice(0, 3000);
}

async function getAllSymbols() {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.symbols;

  const [binance, coingecko] = await Promise.allSettled([fetchBinanceSymbols(), fetchCoinGeckoSymbols()]);
  const merged = new Set<string>(FALLBACK);
  if (binance.status === "fulfilled") for (const s of binance.value) merged.add(s);
  if (coingecko.status === "fulfilled") for (const s of coingecko.value) merged.add(s);

  const symbols = [...merged];
  cache = { symbols, expiresAt: now + 1000 * 60 * 60 };
  return symbols;
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toUpperCase();
  if (!q) return NextResponse.json({ symbols: FALLBACK.slice(0, 20) });

  const all = await getAllSymbols();
  const starts = all.filter((s) => s.startsWith(q)).slice(0, 20);
  const includes = starts.length < 20 ? all.filter((s) => !starts.includes(s) && s.includes(q)).slice(0, 20 - starts.length) : [];

  return NextResponse.json({ symbols: [...starts, ...includes] });
}

