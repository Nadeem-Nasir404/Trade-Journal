"use client";

import { useRef, useState } from "react";
import { Check, Copy, Download, Share2, X } from "lucide-react";
import html2canvas from "html2canvas";

export function TradeRecapCard({
  trade,
  screenshot,
  onClose,
}: {
  trade: {
    symbol: string;
    side: string;
    status: string;
    entryPrice?: number | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    resultUsd: number;
    riskUsd?: number;
    setup?: string | null;
    strategy?: string | null;
    tradeDate?: string;
  };
  screenshot?: string;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const profit = Number(trade.resultUsd || 0);
  const isProfitable = profit >= 0;
  const rMultiple = trade.riskUsd ? (profit / Math.abs(trade.riskUsd)).toFixed(2) : "N/A";
  const roi = trade.entryPrice ? ((profit / trade.entryPrice) * 100).toFixed(2) : "0.00";
  const dateText = trade.tradeDate ? new Date(trade.tradeDate).toLocaleDateString() : new Date().toLocaleDateString();

  async function download() {
    setGenerating(true);
    try {
      const el = cardRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2, logging: false });
      const link = document.createElement("a");
      link.download = `${trade.symbol}-${trade.status}-recap.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setGenerating(false);
    }
  }

  async function share() {
    if (!navigator.share) return;
    const el = cardRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `${trade.symbol}-recap.png`, { type: "image/png" });
      await navigator.share({ files: [file], title: `${trade.symbol} Trade Recap` });
    });
  }

  function copyStats() {
    const text = `${trade.symbol} ${trade.side}\nP&L: ${isProfitable ? "+" : ""}$${Math.abs(profit).toFixed(2)}\nROI: ${isProfitable ? "+" : ""}${roi}%\nR: ${rMultiple === "N/A" ? "N/A" : `${rMultiple}R`}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-3xl border border-white/15 bg-[#090b14] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-emerald-500 p-3">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Share Trade</h2>
              <p className="text-base text-slate-400">Generate a shareable image of your trade</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10">
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>

        <div className="border-b border-white/10 px-8 py-4">
          <p className="text-center text-sm font-medium text-emerald-300">Glass Style</p>
        </div>

        <div className="p-8">
          <div ref={cardRef} className="relative mx-auto max-w-[860px] overflow-hidden rounded-[28px] border border-white/10 bg-[#070b14] text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.16),transparent_45%),radial-gradient(circle_at_90%_20%,rgba(14,165,233,0.12),transparent_30%)]" />
            <div className="relative p-8 sm:p-12">
              <div className="mb-8 flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-6xl font-semibold tracking-tight">{trade.symbol}</h3>
                  <div className="text-2xl text-slate-300">{trade.side}</div>
                  {trade.setup ? <div className="text-xl text-slate-400">{trade.setup}</div> : null}
                </div>
                <div className="text-right text-xl text-emerald-400">ALPHA JOURNAL</div>
              </div>

              <div className={`text-8xl font-bold tracking-tight ${isProfitable ? "text-emerald-400" : "text-rose-500"}`}>
                {isProfitable ? "+" : ""}
                {roi}%
              </div>
              <div className={`mt-2 text-5xl ${isProfitable ? "text-emerald-300" : "text-rose-400"}`}>
                {isProfitable ? "+" : ""}${Math.abs(profit).toFixed(2)}
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/25 p-5 text-xl sm:grid-cols-5">
                <div>
                  <div className="text-sm uppercase tracking-wide text-slate-400">Entry</div>
                  <div className="mt-1 font-semibold">{trade.entryPrice ?? "-"}</div>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-wide text-slate-400">Exit</div>
                  <div className="mt-1 font-semibold">{trade.takeProfit ?? "-"}</div>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-wide text-slate-400">R:R</div>
                  <div className="mt-1 font-semibold">{rMultiple === "N/A" ? "N/A" : `${rMultiple}R`}</div>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-wide text-slate-400">Status</div>
                  <div className="mt-1 font-semibold">{trade.status}</div>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-wide text-slate-400">Date</div>
                  <div className="mt-1 font-semibold">{dateText}</div>
                </div>
              </div>

              {screenshot ? (
                <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshot} alt="Trade chart" className="h-40 w-full object-cover opacity-70" />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-white/[0.02] px-8 py-5">
          <button onClick={copyStats} className="flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-slate-200 hover:bg-white/10">
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          {canShare ? (
            <button onClick={() => void share()} className="flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-slate-200 hover:bg-white/10">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          ) : null}
          <button onClick={() => void download()} disabled={generating} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600">
            <Download className="h-4 w-4" />
            {generating ? "Generating..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
