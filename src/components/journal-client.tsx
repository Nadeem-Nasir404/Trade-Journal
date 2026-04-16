"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Search, Sparkles, X } from "lucide-react";

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

type SortOption = "NEWEST" | "OLDEST" | "HIGHEST_SCORE" | "LOWEST_SCORE" | "TITLE";
type DateMode = "ALL" | "DAY" | "MONTH";

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
  const [chartSymbol, setChartSymbol] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dateMode, setDateMode] = useState<DateMode>("ALL");
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [entryTypeFilter, setEntryTypeFilter] = useState<"ALL" | "TRADE" | "DAILY" | "WEEKLY">("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  const activeDateRange = useMemo(() => {
    if (dateMode === "DAY") {
      return { from: selectedDay, to: selectedDay };
    }

    if (dateMode === "MONTH") {
      const [year, month] = selectedMonth.split("-").map(Number);
      if (!year || !month) return { from: "", to: "" };
      const first = new Date(year, month - 1, 1);
      const last = new Date(year, month, 0);
      return {
        from: first.toISOString().slice(0, 10),
        to: last.toISOString().slice(0, 10),
      };
    }

    return { from: "", to: "" };
  }, [dateMode, selectedDay, selectedMonth]);

  async function loadEntries() {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (activeDateRange.from) params.set("from", activeDateRange.from);
    if (activeDateRange.to) params.set("to", activeDateRange.to);
    const res = await fetch(`/api/journal?${params.toString()}`);
    const json = await res.json();
    setEntries(json.entries ?? []);
  }

  useEffect(() => {
    void loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, activeDateRange.from, activeDateRange.to]);

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
    setChartSymbol(symbol);
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
    const scopedEntries =
      entryTypeFilter === "ALL"
        ? entries
        : entries.filter((entry) => entry.tags?.toLowerCase().includes(entryTypeFilter.toLowerCase()));

    return [...scopedEntries].sort((a, b) => {
      switch (sortBy) {
        case "OLDEST":
          return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
        case "HIGHEST_SCORE":
          return (b.score ?? -1) - (a.score ?? -1);
        case "LOWEST_SCORE":
          return (a.score ?? 11) - (b.score ?? 11);
        case "TITLE":
          return a.title.localeCompare(b.title);
        case "NEWEST":
        default:
          return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
      }
    });
  }, [entries, entryTypeFilter, sortBy]);

  const hasActiveSearch = query.trim().length > 0;
  const hasActiveDateFilter = dateMode !== "ALL";

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
    setChartSymbol("");
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
    setChartSymbol(entry.trades?.[0]?.symbol ?? "");
    setOpen(true);
  }

  function clearFilters() {
    setQuery("");
    setDateMode("ALL");
    setSelectedDay(new Date().toISOString().slice(0, 10));
    setSelectedMonth(new Date().toISOString().slice(0, 7));
    setEntryTypeFilter("ALL");
    setSortBy("NEWEST");
  }

  function shiftDate(direction: "PREV" | "NEXT") {
    if (dateMode === "DAY") {
      const date = new Date(selectedDay);
      date.setDate(date.getDate() + (direction === "NEXT" ? 1 : -1));
      setSelectedDay(date.toISOString().slice(0, 10));
      return;
    }

    if (dateMode === "MONTH") {
      const [year, month] = selectedMonth.split("-").map(Number);
      const date = new Date(year, month - 1 + (direction === "NEXT" ? 1 : -1), 1);
      setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.10),_transparent_30%)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Journal Timeline</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Capture thought process, emotions, and lessons with execution context</p>
            </div>
            <Button
              onClick={() => {
                setEditingId(null);
                setForm(blankForm);
                setChartSymbol("");
                setOpen(true);
              }}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-teal-700 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              New Entry
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr_1.1fr]">
        <Card className="border-emerald-300/60 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"><CardHeader className="pb-2"><CardTitle>Total Entries</CardTitle></CardHeader><CardContent className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.count}</CardContent></Card>
        <Card className="border-blue-300/60 bg-gradient-to-br from-blue-500/10 to-blue-500/5"><CardHeader className="pb-2"><CardTitle>Average Score</CardTitle></CardHeader><CardContent className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.avgScore ?? "-"}</CardContent></Card>
        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/70">
          <CardHeader className="pb-2">
            <CardTitle className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Search Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
            <p>Search by title, lesson, reflection text, or tags.</p>
            <p>Try keywords like `discipline`, `breakout`, `revenge`, or a symbol name.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9 pr-10" placeholder="Search by title, tag, lesson, or content..." value={query} onChange={(e) => setQuery(e.target.value)} />
              {hasActiveSearch ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["ALL", "TRADE", "DAILY", "WEEKLY"] as const).map((type) => (
                <Button key={type} size="sm" variant={entryTypeFilter === type ? "default" : "outline"} className={entryTypeFilter === type ? "bg-emerald-500 hover:bg-emerald-600" : ""} onClick={() => setEntryTypeFilter(type)}>
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Range</label>
              <div className="flex flex-wrap gap-2">
                {(["ALL", "DAY", "MONTH"] as const).map((mode) => (
                  <Button key={mode} type="button" size="sm" variant={dateMode === mode ? "default" : "outline"} className={dateMode === mode ? "bg-emerald-500 hover:bg-emerald-600" : ""} onClick={() => setDateMode(mode)}>
                    {mode === "ALL" ? "All Time" : mode === "DAY" ? "Single Day" : "Month"}
                  </Button>
                ))}
              </div>
            </div>

            {dateMode !== "ALL" ? (
              <div className="flex flex-wrap items-end gap-2">
                <Button type="button" variant="outline" size="sm" className="h-10 w-10 p-0" onClick={() => shiftDate("PREV")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{dateMode === "DAY" ? "Date" : "Month"}</label>
                  <Input type={dateMode === "DAY" ? "date" : "month"} value={dateMode === "DAY" ? selectedDay : selectedMonth} onChange={(e) => dateMode === "DAY" ? setSelectedDay(e.target.value) : setSelectedMonth(e.target.value)} />
                </div>
                <Button type="button" variant="outline" size="sm" className="h-10 w-10 p-0" onClick={() => shiftDate("NEXT")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              >
                <option value="NEWEST">Newest</option>
                <option value="OLDEST">Oldest</option>
                <option value="HIGHEST_SCORE">Highest Score</option>
                <option value="LOWEST_SCORE">Lowest Score</option>
                <option value="TITLE">Title A-Z</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
                Reset
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="font-medium">{filteredEntries.length}</span>
              <span>{filteredEntries.length === 1 ? "entry" : "entries"} shown</span>
              {hasActiveSearch ? (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                  Search: {query.trim()}
                </span>
              ) : null}
              {hasActiveDateFilter ? (
                <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
                  {dateMode === "DAY" ? `Date: ${selectedDay}` : `Month: ${selectedMonth}`}
                </span>
              ) : null}
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                Sort: {sortBy.toLowerCase().replaceAll("_", " ")}
              </span>
            </div>
            <p className="text-xs capitalize text-slate-500 dark:text-slate-400">Showing {sortBy.toLowerCase().replaceAll("_", " ")}</p>
          </div>

          <div className="space-y-4">
            {filteredEntries.map((entry, idx) => (
              <PolishedJournalCard
                key={entry.id}
                entry={entry}
                searchQuery={debouncedQuery}
                delay={idx * 0.05}
                expanded={expandedIds.includes(entry.id)}
                onToggle={() => setExpandedIds((prev) => (prev.includes(entry.id) ? prev.filter((id) => id !== entry.id) : [...prev, entry.id]))}
                onEdit={() => openEditor(entry)}
                onDelete={() => void deleteEntry(entry.id)}
              />
            ))}
            {!filteredEntries.length ? <JournalEmptyState onNewEntry={() => { setEditingId(null); setForm(blankForm); setChartSymbol(""); setOpen(true); }} /> : null}
          </div>
        </CardContent>
      </Card>

      <JournalEntryModal
        open={open}
        editingId={editingId}
        chartSymbol={chartSymbol}
        form={form}
        onChange={(updater) => setForm((prev) => updater(prev))}
        onClose={() => {
          setOpen(false);
          setChartSymbol("");
        }}
        onPickImage={onPickImage}
        onSave={saveEntry}
      />
    </div>
  );
}
