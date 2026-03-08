"use client";

import { useRef, useState } from "react";
import { Check, Copy, Download, Share2, X } from "lucide-react";
import html2canvas from "html2canvas";

const THEMES = [
  { id: "emerald", name: "Emerald", gradient: "from-emerald-500 to-teal-600" },
  { id: "purple", name: "Purple", gradient: "from-purple-500 to-pink-600" },
  { id: "blue", name: "Blue", gradient: "from-blue-500 to-cyan-600" },
  { id: "dark", name: "Dark", gradient: "from-gray-800 to-gray-900" },
];

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
  const [theme, setTheme] = useState(THEMES[0]);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const profit = Number(trade.resultUsd || 0);
  const isProfitable = profit >= 0;
  const rMultiple = trade.riskUsd ? (profit / Math.abs(trade.riskUsd)).toFixed(2) : "N/A";

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
    const text = `${trade.symbol} ${trade.side}\nP&L: ${isProfitable ? "+" : ""}$${Math.abs(profit).toFixed(2)}\nR: ${rMultiple === "N/A" ? "N/A" : `${rMultiple}R`}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Trade Recap Card</h2>
            <p className="text-sm text-gray-600">Generate a beautiful share image</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5 text-gray-600" /></button>
        </div>

        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Theme:</span>
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => setTheme(t)} className={`rounded-lg px-4 py-2 font-medium ${theme.id === t.id ? `bg-gradient-to-r ${t.gradient} text-white` : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-6">
          <div ref={cardRef} className="overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className={`bg-gradient-to-r ${theme.gradient} p-6 text-white`}>
              <div className="mb-3 text-2xl font-bold">{trade.symbol}</div>
              <div className="text-sm opacity-80">{trade.side} • {trade.status}</div>
              <div className="mt-3 text-3xl font-bold">{isProfitable ? "+" : ""}${Math.abs(profit).toFixed(2)}</div>
              <div className="text-sm opacity-80">R-Multiple: {rMultiple === "N/A" ? "N/A" : `${rMultiple}R`}</div>
            </div>
            {screenshot ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={screenshot} alt="Trade chart" className="h-64 w-full object-cover" />
              </>
            ) : null}
            <div className="grid grid-cols-3 gap-4 p-6">
              <div><div className="text-xs text-gray-500">Entry</div><div className="font-mono font-bold">${trade.entryPrice ?? "-"}</div></div>
              <div><div className="text-xs text-gray-500">Stop Loss</div><div className="font-mono font-bold text-rose-600">${trade.stopLoss ?? "-"}</div></div>
              <div><div className="text-xs text-gray-500">Take Profit</div><div className="font-mono font-bold text-emerald-600">${trade.takeProfit ?? "-"}</div></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button onClick={copyStats} className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-200">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Stats"}
          </button>
          <div className="flex items-center gap-3">
            {canShare ? (
              <button onClick={() => void share()} className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2.5 font-semibold text-white hover:bg-blue-600"><Share2 className="h-4 w-4" />Share</button>
            ) : null}
            <button onClick={() => void download()} disabled={generating} className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />{generating ? "Generating..." : "Download"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
