"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, ChevronDown, ChevronUp, Edit, Eye, Lightbulb, NotebookPen, Star, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type JournalEntryCardData = {
  id: number;
  entryDate: string;
  title: string;
  content: string;
  imageUrl: string | null;
  mood: string | null;
  tags: string | null;
  score: number | null;
  executionSummary?: {
    linkedExecutions: number;
  };
};

function extractSection(content: string, section: string) {
  const rx = new RegExp(`${section}:\\s*([\\s\\S]*?)(\\n\\n[A-Za-z ]+:|$)`, "i");
  return content.match(rx)?.[1]?.trim() ?? "";
}

function moodEmoji(mood: string | null) {
  if (!mood) return "??";
  const value = mood.toUpperCase();
  if (value.includes("GREAT")) return "??";
  if (value.includes("GOOD")) return "??";
  if (value.includes("BAD")) return "??";
  return "??";
}

function moodLabel(mood: string | null) {
  if (!mood) return "Neutral";
  const value = mood.toUpperCase();
  if (value.includes("GREAT")) return "Great";
  if (value.includes("GOOD")) return "Good";
  if (value.includes("BAD")) return "Bad";
  return "Neutral";
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-emerald-500/15 px-1 py-0.5 text-inherit dark:bg-emerald-400/20">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function PolishedJournalCard({
  entry,
  searchQuery = "",
  delay = 0,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  entry: JournalEntryCardData;
  searchQuery?: string;
  delay?: number;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tags = (entry.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  const plan = extractSection(entry.content, "Plan");
  const worked = extractSection(entry.content, "What went well");
  const improve = extractSection(entry.content, "What to improve");
  const lesson = extractSection(entry.content, "Key lesson");
  const preview = worked || plan || entry.content;
  const matchedSnippet = searchQuery.trim()
    ? [entry.title, lesson, worked, improve, preview, entry.tags ?? ""].find((value) => value?.toLowerCase().includes(searchQuery.toLowerCase()))
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70"
    >
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 px-5 py-4 dark:border-slate-800 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-emerald-950/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-bold text-slate-900 dark:text-white">{highlightText(entry.title, searchQuery)}</h3>
              {entry.executionSummary?.linkedExecutions ? <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">Trade linked</Badge> : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(entry.entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <NotebookPen className="h-3.5 w-3.5" />
                {moodLabel(entry.mood)}
              </span>
              {tags.slice(0, 3).map((tag) => <Badge key={tag} className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{highlightText(tag, searchQuery)}</Badge>)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moodEmoji(entry.mood)}</span>
            {entry.score !== null ? <Badge className="gap-1 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-300"><Star className="h-3.5 w-3.5" />{entry.score}/10</Badge> : null}
            <Button size="sm" variant="outline" onClick={onEdit}><Edit className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>

      <div className="p-5">
        {matchedSnippet && searchQuery.trim() ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
            <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Matched</span>
            {highlightText(matchedSnippet, searchQuery)}
          </div>
        ) : null}

        {lesson ? (
          <div className="rounded-r-lg border-l-4 border-purple-400 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3">
            <p className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300"><Lightbulb className="h-3.5 w-3.5" />Key Takeaway</p>
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">{highlightText(lesson, searchQuery)}</p>
          </div>
        ) : null}

        {!expanded ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{highlightText(preview, searchQuery)}</p>
        ) : (
          <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
            {worked ? <div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">What Worked Well</p><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{highlightText(worked, searchQuery)}</p></div> : null}
            {improve ? <div><p className="text-xs font-semibold uppercase tracking-wide text-amber-600">What Could Improve</p><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{highlightText(improve, searchQuery)}</p></div> : null}
            {!worked && !improve ? <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{highlightText(entry.content, searchQuery)}</p> : null}
            {entry.imageUrl ? (
              <div className="relative h-56 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                <Image src={entry.imageUrl} alt={entry.title} fill className="object-cover" unoptimized />
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
          <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-500 transition hover:text-emerald-400" onClick={onToggle}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <><Eye className="h-4 w-4" /><ChevronDown className="h-4 w-4" /></>}
            {expanded ? "Show Less" : "View Full Entry"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
