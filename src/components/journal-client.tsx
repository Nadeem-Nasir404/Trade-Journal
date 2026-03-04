"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { JournalEntryModal, type JournalFormValues } from "@/components/JournalEntryModal";

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
  const focusedEntryId = Number(searchParams.get("entryId") ?? 0) || null;

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

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5 backdrop-blur-xl dark:border-slate-700 dark:from-slate-900/90 dark:to-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Journal Timeline</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Capture thought process, emotions, and lessons with execution context</p>
          </div>
          <Button onClick={() => { setEditingId(null); setForm(blankForm); setOpen(true); }}><Plus className="h-4 w-4" /> New Entry</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-slate-200 bg-white backdrop-blur dark:border-slate-700 dark:bg-slate-900/60"><CardHeader className="pb-2"><CardTitle className="text-slate-900 dark:text-slate-100">Total Entries</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{stats.count}</CardContent></Card>
        <Card className="border-slate-200 bg-white backdrop-blur dark:border-slate-700 dark:bg-slate-900/60"><CardHeader className="pb-2"><CardTitle className="text-slate-900 dark:text-slate-100">Average Score</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-500 dark:text-blue-400">{stats.avgScore ?? "-"}</CardContent></Card>
      </div>

      <Card className="border-slate-200 bg-white backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
        <CardContent className="space-y-3 pt-6">
          <Input placeholder="Search by title, tag, or content..." value={query} onChange={(e) => setQuery(e.target.value)} />

          <div className="space-y-4">
            {entries.map((entry) => {
              const expanded = expandedIds.includes(entry.id);
              return (
                <div
                  key={entry.id}
                  className={`rounded-xl border bg-white p-5 dark:bg-slate-900/60 ${
                    focusedEntryId === entry.id
                      ? "border-blue-500/60 ring-1 ring-blue-500/40 dark:border-blue-400/60"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{entry.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{format(parseISO(entry.entryDate), "MMM d, yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.mood ? <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{entry.mood}</Badge> : null}
                      {entry.score !== null ? <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Score {entry.score}/10</Badge> : null}
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(entry.id); setForm({ entryDate: entry.entryDate.slice(0, 10), title: entry.title, imageUrl: entry.imageUrl ?? "", mood: entry.mood ?? "", tags: entry.tags ?? "", score: entry.score !== null ? String(entry.score) : "", linkedTradeIds: entry.trades?.map((t) => String(t.id)).join(", ") ?? "", entryType: entry.tags?.toLowerCase().includes("weekly") ? "WEEKLY" : entry.tags?.toLowerCase().includes("daily") ? "DAILY" : "TRADE", plan: "", execution: "", whatWentWell: "", whatToImprove: "", keyLesson: "", marketConditions: "", tomorrowFocus: "", content: entry.content }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => void deleteEntry(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  {entry.tags ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Tags: {entry.tags}</p> : null}
                  {entry.executionSummary && entry.executionSummary.linkedExecutions > 0 ? (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/50">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        Linked Executions: {entry.executionSummary.linkedExecutions} | Net Impact: {entry.executionSummary.netImpact >= 0 ? "+" : ""}{entry.executionSummary.netImpact.toFixed(2)} USD
                      </p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        Avg R/R: {entry.executionSummary.avgRiskReward.toFixed(2)} | Running: {entry.executionSummary.statusBreakdown.running} | Profit: {entry.executionSummary.statusBreakdown.profit} | Loss: {entry.executionSummary.statusBreakdown.loss} | Breakeven: {entry.executionSummary.statusBreakdown.breakeven ?? 0}
                      </p>
                    </div>
                  ) : null}
                  <p className={`mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 ${expanded ? "" : "line-clamp-4"}`}>{entry.content}</p>
                  {entry.content.length > 220 ? (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                      onClick={() => setExpandedIds((prev) => (prev.includes(entry.id) ? prev.filter((id) => id !== entry.id) : [...prev, entry.id]))}
                    >
                      {expanded ? "Read less" : "Read more"}
                    </button>
                  ) : null}
                  {entry.imageUrl ? (
                    <div className="relative mt-3 h-56 w-full overflow-hidden rounded-lg border border-slate-700">
                      <Image src={entry.imageUrl} alt={entry.title} fill className="object-cover" unoptimized />
                    </div>
                  ) : null}
                </div>
              );
            })}
            {!entries.length ? <p className="text-sm text-slate-400">No entries found.</p> : null}
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
