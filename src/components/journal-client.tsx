"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { JournalEmptyState } from "@/components/BeautifulEmptyStates";
import { JournalEntryModal, type JournalFormValues } from "@/components/JournalEntryModal";
import { PolishedJournalCard } from "@/components/PolishedJournalCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Entry = {
  id: number;
  entryDate: string;
  title: string;
  content: string;
  imageUrl: string | null;
  mood: string | null;
  tags: string | null;
  score: number | null;
  trades?: Array<{
    id: number;
    symbol: string;
    resultUsd: number;
    riskUsd: number;
    status: "RUNNING" | "PROFIT" | "LOSS" | "BREAKEVEN";
  }>;
  executionSummary?: {
    linkedExecutions: number;
    netImpact: number;
    avgRiskReward: number;
    statusBreakdown: {
      running: number;
      profit: number;
      loss: number;
      breakeven?: number;
    };
  };
};

const blankForm: JournalFormValues = {
  entryDate: new Date().toISOString().slice(0, 10),
  title: "",
  imageUrl: "",
  mood: "",
  tags: "",
  score: "",
  linkedTradeIds: "",
  entryType: "TRADE",
  plan: "",
  execution: "",
  whatWentWell: "",
  whatToImprove: "",
  keyLesson: "",
  marketConditions: "",
  tomorrowFocus: "",
  content: "",
};

export function JournalClient() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(blankForm);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState<"ALL" | "TRADE" | "DAILY" | "WEEKLY">("ALL");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  async function loadEntries() {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    const res = await fetch(`/api/journal?${params.toString()}`);
    const json = await res.json();
    setEntries(json.entries ?? []);
  }

  useEffect(() => {
    void loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => {
    const tradeIdParam = searchParams.get("tradeId");
    if (!tradeIdParam) return;
    const tradeId = Number(tradeIdParam);
    if (!Number.isFinite(tradeId) || tradeId <= 0) return;

    const symbol = searchParams.get("symbol") ?? "";
    const tradeDate = searchParams.get("tradeDate") ?? new Date().toISOString().slice(0, 10);
    const resultUsd = Number(searchParams.get("resultUsd") ?? 0);

    setEditingId(null);
    setForm((prev) => ({
      ...prev,
      entryDate: tradeDate,
      title: symbol ? `${symbol} Trade Reflection` : prev.title,
      plan: symbol ? `Trade: ${symbol} | Result: ${resultUsd >= 0 ? "+" : ""}${resultUsd.toFixed(2)} USD` : prev.plan,
      entryType: "TRADE",
      linkedTradeIds: String(tradeId),
    }));
    setOpen(true);
  }, [searchParams]);

  const stats = useMemo(() => {
    const avgScore = entries.filter((e) => e.score !== null).reduce((sum, e) => sum + (e.score ?? 0), 0);
    const scoredCount = entries.filter((e) => e.score !== null).length;
    return {
      count: entries.length,
      avgScore: scoredCount ? Math.round((avgScore / scoredCount) * 100) / 100 : null,
    };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (entryTypeFilter === "ALL") return entries;
    return entries.filter((entry) => entry.tags?.toLowerCase().includes(entryTypeFilter.toLowerCase()));
  }, [entries, entryTypeFilter]);

  async function saveEntry() {
    const linkedTradeIds = form.linkedTradeIds
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isFinite(id) && id > 0);

    const content =
      form.entryType === "TRADE"
        ? [
            `Plan:\n${form.plan}`,
            `Execution:\n${form.execution}`,
            `What went well:\n${form.whatWentWell}`,
            `What to improve:\n${form.whatToImprove}`,
            `Key lesson:\n${form.keyLesson}`,
          ].join("\n\n")
        : [
            `Market conditions:\n${form.marketConditions}`,
            `Tomorrow focus:\n${form.tomorrowFocus}`,
            `Reflection:\n${form.content}`,
          ].join("\n\n");

    const payload = { ...form, content, linkedTradeIds, tags: [form.entryType.toLowerCase(), form.tags].filter(Boolean).join(", ") };
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/journal/${editingId}` : "/api/journal";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
      alert(json?.error || json?.message || "Failed to save journal entry.");
      return;
    }

    setOpen(false);
    setEditingId(null);
    setForm(blankForm);
    await loadEntries();
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Max image size is 2MB.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });
    setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
  }

  async function deleteEntry(id: number) {
    if (!window.confirm("Delete this journal entry?")) return;
    await fetch(`/api/journal/${id}`, { method: "DELETE" });
    await loadEntries();
  }

  function openEditor(entry: Entry) {
    setEditingId(entry.id);
    setForm({
      entryDate: entry.entryDate.slice(0, 10),
      title: entry.title,
      imageUrl: entry.imageUrl ?? "",
      mood: entry.mood ?? "",
      tags: entry.tags ?? "",
      score: entry.score !== null ? String(entry.score) : "",
      linkedTradeIds: entry.trades?.map((t) => String(t.id)).join(", ") ?? "",
      entryType: entry.tags?.toLowerCase().includes("weekly") ? "WEEKLY" : entry.tags?.toLowerCase().includes("daily") ? "DAILY" : "TRADE",
      plan: "",
      execution: "",
      whatWentWell: "",
      whatToImprove: "",
      keyLesson: "",
      marketConditions: "",
      tomorrowFocus: "",
      content: entry.content,
    });
    setOpen(true);
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Journal Timeline</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Capture thought process, emotions, and lessons with execution context</p>
          </div>
          <Button onClick={() => { setEditingId(null); setForm(blankForm); setOpen(true); }} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"><Plus className="h-4 w-4" /> New Entry</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-emerald-300/60 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"><CardHeader className="pb-2"><CardTitle>Total Entries</CardTitle></CardHeader><CardContent className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.count}</CardContent></Card>
        <Card className="border-blue-300/60 bg-gradient-to-br from-blue-500/10 to-blue-500/5"><CardHeader className="pb-2"><CardTitle>Average Score</CardTitle></CardHeader><CardContent className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.avgScore ?? "-"}</CardContent></Card>
      </div>

      <Card className="border-slate-200 bg-white backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Search by title, tag, or content..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["ALL", "TRADE", "DAILY", "WEEKLY"] as const).map((type) => (
                <Button key={type} size="sm" variant={entryTypeFilter === type ? "default" : "outline"} className={entryTypeFilter === type ? "bg-emerald-500 hover:bg-emerald-600" : ""} onClick={() => setEntryTypeFilter(type)}>
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredEntries.map((entry, idx) => (
              <PolishedJournalCard
                key={entry.id}
                entry={entry}
                delay={idx * 0.05}
                expanded={expandedIds.includes(entry.id)}
                onToggle={() => setExpandedIds((prev) => (prev.includes(entry.id) ? prev.filter((id) => id !== entry.id) : [...prev, entry.id]))}
                onEdit={() => openEditor(entry)}
                onDelete={() => void deleteEntry(entry.id)}
              />
            ))}
            {!filteredEntries.length ? <JournalEmptyState onNewEntry={() => { setEditingId(null); setForm(blankForm); setOpen(true); }} /> : null}
          </div>
        </CardContent>
      </Card>

      <JournalEntryModal
        open={open}
        editingId={editingId}
        form={form}
        onChange={(updater) => setForm((prev) => updater(prev))}
        onClose={() => setOpen(false)}
        onPickImage={onPickImage}
        onSave={saveEntry}
      />
    </div>
  );
}
