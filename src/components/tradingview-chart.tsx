"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, CandlestickChart, ExternalLink, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TradingViewChartProps = {
  symbol?: string | null;
  title?: string;
};

function normalizeCryptoSymbol(rawSymbol: string) {
  const trimmed = rawSymbol.trim().toUpperCase();
  if (!trimmed) return "";
  if (trimmed.includes(":")) return trimmed;

  const sanitized = trimmed.replace(/[^A-Z0-9]/g, "");
  if (!sanitized) return "";

  if (sanitized.endsWith("PERP")) {
    return `BINANCE:${sanitized.slice(0, -4)}USDT`;
  }

  if (sanitized.endsWith("USDT") || sanitized.endsWith("USD")) {
    return `BINANCE:${sanitized}`;
  }

  if (["BTC", "ETH", "SOL", "XRP", "ADA", "BNB", "DOGE", "AVAX", "LINK", "SUI"].includes(sanitized)) {
    return `BINANCE:${sanitized}USDT`;
  }

  return `BINANCE:${sanitized}`;
}

function getDisplaySymbol(symbol: string) {
  return symbol.includes(":") ? symbol.split(":")[1] : symbol;
}

export function TradingViewChart({ symbol, title = "Chart Context" }: TradingViewChartProps) {
  const widgetHostRef = useRef<HTMLDivElement | null>(null);
  const [manualSymbol, setManualSymbol] = useState<string | null>(null);

  const inputValue = manualSymbol ?? symbol ?? "";
  const resolvedSymbol = useMemo(() => normalizeCryptoSymbol(inputValue), [inputValue]);

  useEffect(() => {
    const host = widgetHostRef.current;
    if (!host || !resolvedSymbol) return;

    host.innerHTML = "";

    const widgetRoot = document.createElement("div");
    widgetRoot.className = "tradingview-widget-container__widget h-full w-full";

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright hidden";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: resolvedSymbol,
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      withdateranges: true,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    host.appendChild(widgetRoot);
    host.appendChild(copyright);
    host.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, [resolvedSymbol]);

  const canRender = Boolean(resolvedSymbol);

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.94)_55%,rgba(6,95,70,0.22)_100%)] text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)]">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300/80">{title}</p>
            <h3 className="mt-2 flex items-center gap-2 text-xl font-semibold">
              <CandlestickChart className="h-5 w-5 text-emerald-300" />
              {canRender ? getDisplaySymbol(resolvedSymbol) : "Set a symbol"}
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              Review structure, liquidity, and execution context without leaving the journal flow.
            </p>
          </div>
          <Badge className="border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/10">
            TradingView
          </Badge>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Symbol</label>
            <Input
              value={inputValue}
              onChange={(event) => setManualSymbol(event.target.value)}
              placeholder="BTC, ETH, BTCUSDT or BINANCE:BTCUSDT"
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-400 focus-visible:border-emerald-400/70 focus-visible:ring-emerald-400/20"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setManualSymbol(null)}
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <a
              href={canRender ? `https://www.tradingview.com/symbols/${getDisplaySymbol(resolvedSymbol)}/` : "https://www.tradingview.com"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">1H default</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Dark terminal mode</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Auto-filled from linked trades</span>
        </div>

        <div className="relative min-h-[340px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
          {canRender ? (
            <div ref={widgetHostRef} className="h-[340px] w-full md:h-[560px]" />
          ) : (
            <div className="flex h-[340px] flex-col items-center justify-center gap-3 px-6 text-center md:h-[560px]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Activity className="h-8 w-8 text-cyan-300" />
              </div>
              <div>
                <p className="text-lg font-semibold">No trade symbol yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  Link a trade or type a crypto symbol above and this panel becomes your live review chart.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
