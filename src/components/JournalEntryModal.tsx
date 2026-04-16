"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Heart, Lightbulb, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type EntryType = "TRADE" | "DAILY" | "WEEKLY";

export type JournalFormValues = {
  entryDate: string;
  title: string;
  imageUrl: string;
  mood: string;
  tags: string;
  score: string;
  linkedTradeIds: string;
  entryType: EntryType;
  plan: string;
  execution: string;
  whatWentWell: string;
  whatToImprove: string;
  keyLesson: string;
  marketConditions: string;
  tomorrowFocus: string;
  content: string;
};

type Props = {
  open: boolean;
  editingId: number | null;
  form: JournalFormValues;
  onChange: (updater: (prev: JournalFormValues) => JournalFormValues) => void;
  onClose: () => void;
  onPickImage: (file: File | null) => Promise<void>;
  onSave: () => Promise<void>;
};

export function JournalEntryModal({ open, editingId, form, onChange, onClose, onPickImage, onSave }: Props) {
  const moodOptions: Array<{ value: string; label: string; active: string; idle: string }> = [
    { value: "GREAT", label: "Great", active: "bg-emerald-500 text-white border-emerald-500", idle: "border-slate-300 hover:border-emerald-400" },
    { value: "GOOD", label: "Good", active: "bg-teal-500 text-white border-teal-500", idle: "border-slate-300 hover:border-teal-400" },
    { value: "NEUTRAL", label: "Okay", active: "bg-slate-500 text-white border-slate-500", idle: "border-slate-300 hover:border-slate-400" },
    { value: "BAD", label: "Bad", active: "bg-rose-500 text-white border-rose-500", idle: "border-slate-300 hover:border-rose-400" },
  ];

  const linkedTradeCount = form.linkedTradeIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean).length;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="pointer-events-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:max-h-[90vh]"
            >
              <div className="border-b border-emerald-200 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-5 py-4 dark:border-emerald-900/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-emerald-500 p-2 text-white">
                      <Heart className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{editingId ? "Edit Reflection" : "Trade Reflection"}</h2>
                      {linkedTradeCount > 0 ? (
                        <p className="text-xs text-slate-600 dark:text-slate-300">Linked trades: {linkedTradeCount}</p>
                      ) : null}
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Date</Label>
                      <Input type="date" value={form.entryDate} onChange={(e) => onChange((p) => ({ ...p, entryDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Title</Label>
                      <Input value={form.title} onChange={(e) => onChange((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>How do you feel about this trade?</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {moodOptions.map((mood) => {
                        const active = form.mood === mood.value;
                        return (
                          <button
                            key={mood.value}
                            type="button"
                            onClick={() => onChange((p) => ({ ...p, mood: mood.value }))}
                            className={`rounded-xl border-2 p-3 text-center transition-all ${active ? mood.active : mood.idle}`}
                          >
                            <p className="text-sm font-semibold">{mood.label}</p>
                            <p className="mt-1 text-xs font-semibold opacity-80">{mood.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Execution Quality (1-10)</Label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-500">Low</span>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={form.score || "7"}
                        onChange={(e) => onChange((p) => ({ ...p, score: e.target.value }))}
                        className="h-2 w-full cursor-pointer accent-emerald-500"
                      />
                      <span className="text-sm font-medium text-slate-500">High</span>
                      <p className="w-8 text-right font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">{form.score || "7"}</p>
                    </div>
                  </div>

                  {form.entryType === "TRADE" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>What was my plan?</Label>
                        <Textarea value={form.plan} onChange={(e) => onChange((p) => ({ ...p, plan: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label>What actually happened?</Label>
                        <Textarea value={form.execution} onChange={(e) => onChange((p) => ({ ...p, execution: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          What worked well?
                        </Label>
                        <Textarea
                          value={form.whatWentWell}
                          onChange={(e) => onChange((p) => ({ ...p, whatWentWell: e.target.value }))}
                          className="focus-visible:border-emerald-500 focus-visible:ring-emerald-500/25"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          What could be better?
                        </Label>
                        <Textarea
                          value={form.whatToImprove}
                          onChange={(e) => onChange((p) => ({ ...p, whatToImprove: e.target.value }))}
                          className="focus-visible:border-amber-500 focus-visible:ring-amber-500/25"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label className="flex items-center gap-1.5">
                          <Lightbulb className="h-4 w-4 text-purple-500" />
                          Key Takeaway
                        </Label>
                        <Input
                          value={form.keyLesson}
                          onChange={(e) => onChange((p) => ({ ...p, keyLesson: e.target.value }))}
                          className="focus-visible:border-purple-500 focus-visible:ring-purple-500/25"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Market Conditions</Label>
                        <Textarea value={form.marketConditions} onChange={(e) => onChange((p) => ({ ...p, marketConditions: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label>Tomorrow Focus</Label>
                        <Textarea value={form.tomorrowFocus} onChange={(e) => onChange((p) => ({ ...p, tomorrowFocus: e.target.value }))} />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label>Reflection</Label>
                        <Textarea value={form.content} onChange={(e) => onChange((p) => ({ ...p, content: e.target.value }))} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Chart Screenshot (optional)</Label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 px-3 py-3 text-sm text-slate-600 transition hover:border-emerald-400 hover:bg-emerald-500/5 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-emerald-500/50">
                      <Upload className="h-4 w-4" />
                      Upload image (PNG/JPG/WEBP, max 2MB)
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => void onPickImage(e.target.files?.[0] ?? null)} />
                    </label>
                    {form.imageUrl ? (
                      <div className="relative h-44 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                        <Image src={form.imageUrl} alt="Journal preview" fill className="object-cover" unoptimized />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="absolute right-2 top-2 bg-black/40 text-white hover:bg-black/60"
                          onClick={() => onChange((p) => ({ ...p, imageUrl: "" }))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <Label>Tags (optional)</Label>
                    <Input value={form.tags} onChange={(e) => onChange((p) => ({ ...p, tags: e.target.value }))} placeholder="breakout, discipline, fomo" />
                  </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={() => void onSave()} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                  {editingId ? "Update Reflection" : "Save Reflection"}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
