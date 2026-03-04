"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AddTradeModal, { type TradeFormTrade } from "@/components/AddTradeModal";
import TradeListView from "@/components/TradeListView";

export function TradesClient() {
  const router = useRouter();
  const [trades, setTrades] = useState<TradeFormTrade[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TradeFormTrade | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [loadError, setLoadError] = useState("");

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

  async function loadTrades() {
    const maxTrades = 500;
    const res = await fetch(`/api/trades?maxTrades=${maxTrades}`, { cache: "no-store" });
    const json = (await res.json()) as { trades?: TradeFormTrade[]; message?: string; error?: string };
    if (!res.ok) {
      setLoadError(json.error || json.message || "Failed to load trades.");
      setTrades([]);
      return;
    }
    setLoadError("");
    setTrades(json.trades ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTrades();
  }, []);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTrades();
  }, [open]);

  const dayTrades = useMemo(() => {
    const key = normalizeDateKey(selectedDate);
    return trades.filter((t) => normalizeDateKey(t.tradeDate) === key);
  }, [trades, selectedDate]);

  async function handleDeleteTrade(id: number) {
    if (!window.confirm("Delete this trade?")) return;
    await fetch(`/api/trades/${id}`, { method: "DELETE" });
    await loadTrades();
  }

  return (
    <div className="min-w-0 space-y-5">
      {loadError ? <p className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{loadError}</p> : null}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="trade-day" className="text-sm font-medium text-slate-600 dark:text-slate-300">Selected Day</label>
          <input
            id="trade-day"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
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
