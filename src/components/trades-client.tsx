"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { addDays, format, parseISO } from "date-fns";

import AddTradeModal, { type TradeFormTrade } from "@/components/AddTradeModal";
import TradeListView from "@/components/TradeListView";
import { Button } from "@/components/ui/button";
import { useSelectedAccount } from "@/hooks/use-selected-account";

type SyncResponse = {
  imported: number;
  skipped: number;
  updated?: number;
  totalFetched?: number;
  message?: string;
  details?: {
    httpStatus?: number;
    bybitRetCode?: number | null;
    bybitRetMsg?: string | null;
    baseUrl?: string;
    category?: string;
    limit?: string;
  };
};

export function TradesClient() {
  const router = useRouter();
  const { selectedAccountId } = useSelectedAccount();
  const [trades, setTrades] = useState<TradeFormTrade[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TradeFormTrade | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [loadError, setLoadError] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);

  function normalizeDateKey(value: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [mm, dd, yyyy] = value.split("/");
      return `${yyyy}-${mm}-${dd}`;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toISOString().slice(0, 10);
  }

  const loadTrades = useCallback(async (accountId: number | null = selectedAccountId) => {
    const maxTrades = 500;
    const params = new URLSearchParams({ maxTrades: String(maxTrades) });
    if (accountId) params.set("accountId", String(accountId));
    const res = await fetch(`/api/trades?${params.toString()}`, { cache: "no-store" });
    const json = (await res.json()) as { trades?: TradeFormTrade[]; message?: string; error?: string };
    if (!res.ok) {
      setLoadError(json.error || json.message || "Failed to load trades.");
      setTrades([]);
      return;
    }
    setLoadError("");
    setTrades(json.trades ?? []);
  }, [selectedAccountId]);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades, selectedAccountId]);

  useEffect(() => {
    if (!open) return;
    void loadTrades();
  }, [loadTrades, open]);

  const dayTrades = useMemo(() => {
    const key = normalizeDateKey(selectedDate);
    return trades.filter((t) => normalizeDateKey(t.tradeDate) === key);
  }, [trades, selectedDate]);

  async function handleDeleteTrade(id: number) {
    if (!window.confirm("Delete this trade?")) return;
    await fetch(`/api/trades/${id}`, { method: "DELETE" });
    await loadTrades();
  }

  function shiftSelectedDate(days: number) {
    const base = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) ? parseISO(selectedDate) : new Date(selectedDate);
    setSelectedDate(format(addDays(base, days), "yyyy-MM-dd"));
  }

  async function runBybitSync() {
    setSyncLoading(true);
    setSyncError("");
    setSyncResult(null);
    try {
      const res = await fetch("/api/integrations/bybit/sync", { method: "POST" });
      const contentType = res.headers.get("content-type") || "";
      const json = (contentType.includes("application/json")
        ? await res.json()
        : { message: await res.text() }) as SyncResponse & { error?: string };
      if (!res.ok) {
        const parts = [
          json.message || json.error || "Bybit sync failed.",
          json.details?.bybitRetCode !== undefined ? `retCode: ${json.details.bybitRetCode}` : "",
          json.details?.bybitRetMsg ? `retMsg: ${json.details.bybitRetMsg}` : "",
          json.details?.httpStatus ? `http: ${json.details.httpStatus}` : "",
        ].filter(Boolean);
        setSyncError(parts.join(" | "));
        return;
      }
      setSyncResult(json);
      await loadTrades();
    } catch {
      setSyncError("Unable to reach sync endpoint.");
    } finally {
      setSyncLoading(false);
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      {loadError ? <p className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{loadError}</p> : null}
      <div className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="trade-day" className="text-sm font-medium text-slate-600 dark:text-slate-300">Selected Day</label>
            <Button
              type="button"
              className="h-8 rounded-lg bg-emerald-500 px-3 text-white hover:bg-emerald-600"
              onClick={() => void runBybitSync()}
              disabled={syncLoading}
              title="Sync trades"
              aria-label="Sync trades"
            >
              <RefreshCw className={`h-4 w-4 ${syncLoading ? "animate-spin" : ""}`} />
              <span className="ml-1 text-xs font-semibold">{syncLoading ? "Syncing" : "Sync"}</span>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-10" onClick={() => shiftSelectedDate(-1)}>
              Previous
            </Button>
            <input
              id="trade-day"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <Button type="button" variant="outline" className="h-10" onClick={() => shiftSelectedDate(1)}>
              Next
            </Button>
          </div>
        </div>
        {syncResult ? (
          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <p className="inline-flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" />Bybit sync completed</p>
            <p className="mt-1">Imported: {syncResult.imported} | Updated: {syncResult.updated ?? 0} | Skipped: {syncResult.skipped} | Fetched: {syncResult.totalFetched ?? 0}</p>
          </div>
        ) : null}
        {syncError ? (
          <p className="mt-3 rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{syncError}</p>
        ) : null}
      </div>

      <TradeListView
        date={selectedDate}
        trades={dayTrades}
        onAddTrade={() => {
          setEditing(null);
          setOpen(true);
        }}
        onEditTrade={(trade) => {
          setEditing(trade);
          setOpen(true);
        }}
        onDeleteTrade={(id) => {
          void handleDeleteTrade(id);
        }}
        onAddJournal={(trade) => {
          const params = new URLSearchParams({
            tradeId: String(trade.id),
            symbol: trade.symbol,
            tradeDate: trade.tradeDate.slice(0, 10),
            resultUsd: String(trade.resultUsd),
          });
          router.push(`/journal?${params.toString()}`);
        }}
        onViewJournal={(journalEntryId) => {
          router.push(`/journal?entryId=${journalEntryId}`);
        }}
      />

      <AddTradeModal
        isOpen={open}
        onClose={() => setOpen(false)}
        selectedDate={selectedDate}
        initialTrade={editing}
        onSaved={async () => {
          await loadTrades();
          setEditing(null);
        }}
      />
    </div>
  );
}
