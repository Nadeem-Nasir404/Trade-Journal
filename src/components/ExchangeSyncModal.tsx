"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, Eye, KeyRound, Link2, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExchangeSyncModalProps = {
  open: boolean;
  onClose: () => void;
  onSyncBybit: () => void;
  syncLoading: boolean;
  forceSync: boolean;
  setForceSync: (next: boolean) => void;
  lastSyncAt: string | null;
  selectedAccountId: number | null;
};

type ExchangeCard = {
  name: string;
  subtitle: string;
  kind: "cex" | "dex";
  status?: "active" | "soon";
};

const CEX: ExchangeCard[] = [
  { name: "Binance", subtitle: "USDT-M Futures", kind: "cex", status: "soon" },
  { name: "Bybit", subtitle: "Perpetuals", kind: "cex", status: "active" },
  { name: "Bybit Demo", subtitle: "Testnet / Props", kind: "cex", status: "soon" },
  { name: "Bitunix", subtitle: "Perpetuals", kind: "cex", status: "soon" },
  { name: "BloFin", subtitle: "Perpetuals", kind: "cex", status: "soon" },
  { name: "Kraken", subtitle: "Spot & Margin", kind: "cex", status: "soon" },
];

const DEX: ExchangeCard[] = [
  { name: "Hyperliquid", subtitle: "No API needed", kind: "dex", status: "soon" },
  { name: "Lighter", subtitle: "Token auth", kind: "dex", status: "soon" },
  { name: "Paradex", subtitle: "StarkNet", kind: "dex", status: "soon" },
  { name: "More DEX", subtitle: "Coming soon", kind: "dex", status: "soon" },
];

export function ExchangeSyncModal({
  open,
  onClose,
  onSyncBybit,
  syncLoading,
  forceSync,
  setForceSync,
  lastSyncAt,
  selectedAccountId,
}: ExchangeSyncModalProps) {
  const [selectedExchange, setSelectedExchange] = useState<ExchangeCard | null>(null);
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [accountLink, setAccountLink] = useState(selectedAccountId ? String(selectedAccountId) : "");

  const isBybit = selectedExchange?.name === "Bybit";
  const connectDisabled = !isBybit || syncLoading;
  const settingsLink = useMemo(() => {
    if (!selectedExchange) return "#";
    return selectedExchange.name === "Bybit" ? "https://www.bybit.com/app/user/api-management" : "#";
  }, [selectedExchange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[820px] overflow-hidden rounded-3xl border border-white/15 bg-[#0b0d16] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/20 p-2.5 text-violet-300">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Exchange Sync</h2>
              <p className="text-base text-slate-400">Auto-import trades from exchanges</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {!selectedExchange ? (
          <div className="space-y-5 px-6 py-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Connect Exchange</p>
              <p className="mb-3 text-lg text-slate-300">
                <span className="mr-2 text-sky-400">•</span>Centralized Exchanges (CEX)
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {CEX.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedExchange(item)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition",
                      item.status === "active" ? "border-violet-400/35 bg-white/5 hover:bg-white/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-semibold">{item.name}</div>
                        <div className="text-sm text-slate-400">{item.subtitle}</div>
                      </div>
                      {item.status === "soon" ? <span className="text-xs text-slate-500">Soon</span> : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-lg text-slate-300">
                <span className="mr-2 text-emerald-400">•</span>Decentralized Exchanges (DEX)
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {DEX.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedExchange(item)}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-semibold">{item.name}</div>
                        <div className="text-sm text-slate-400">{item.subtitle}</div>
                      </div>
                      <span className="text-xs text-slate-500">Soon</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-3 text-sm text-slate-300">
              <p className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>
                  <span className="font-semibold text-emerald-300">Read-only access only.</span> Alpha Journal can only read your trade history.
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-6 py-5">
            <button type="button" onClick={() => setSelectedExchange(null)} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to exchanges
            </button>

            <a href={settingsLink} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-violet-300 hover:bg-white/[0.06]">
              Open {selectedExchange.name} API Settings
            </a>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Label (optional)</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Main Account" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50" />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">API Key</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your API key" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">API Secret</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type={showSecret ? "text" : "password"} value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder="Enter your API secret" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50" />
                <button type="button" onClick={() => setShowSecret((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Link to Account</label>
              <select value={accountLink} onChange={(e) => setAccountLink(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm text-white outline-none focus:border-violet-400/50">
                <option value="" className="bg-slate-900">Select account...</option>
                {selectedAccountId ? <option value={String(selectedAccountId)} className="bg-slate-900">Current account (ID: {selectedAccountId})</option> : null}
              </select>
              <p className="mt-1 text-xs text-slate-500">Trades will be synced to this account</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 p-3">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={forceSync} onChange={(e) => setForceSync(e.target.checked)} className="h-4 w-4 rounded border-slate-500 bg-transparent" />
                Force re-import/update existing trades
              </label>
              <p className="text-xs text-slate-400">{lastSyncAt ? `Last sync: ${new Date(lastSyncAt).toLocaleString()}` : "Last sync: never"}</p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" className="h-10 border-white/15 bg-white/[0.02] text-slate-200 hover:bg-white/10">
                Test Connection
              </Button>
              <Button type="button" onClick={onSyncBybit} disabled={connectDisabled} className="h-10 bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50">
                <RefreshCw className={cn("h-4 w-4", syncLoading && "animate-spin")} />
                {syncLoading ? "Syncing..." : isBybit ? "Save & Connect" : "Coming soon"}
              </Button>
            </div>

            <div className="rounded-xl border border-rose-300/20 bg-rose-500/5 px-4 py-3 text-sm text-slate-300">
              <span className="font-semibold text-rose-300">Important:</span> Only use API keys with read-only permissions.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
