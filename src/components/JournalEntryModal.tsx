"use client";

import Image from "next/image";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <DialogHeader><DialogTitle>{editingId ? "Edit Entry" : "New Journal Entry"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="space-y-1"><Label>Date</Label><Input type="date" value={form.entryDate} onChange={(e) => onChange((p) => ({ ...p, entryDate: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => onChange((p) => ({ ...p, title: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Entry Type</Label>
              <select value={form.entryType} onChange={(e) => onChange((p) => ({ ...p, entryType: e.target.value as EntryType }))} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <option value="TRADE">Trade Reflection</option>
                <option value="DAILY">Daily Reflection</option>
                <option value="WEEKLY">Weekly Review</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Image</Label>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300/80 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">
                <ImagePlus className="h-4 w-4" />
                Upload image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => void onPickImage(e.target.files?.[0] ?? null)} />
              </label>
              {form.imageUrl ? (
                <div className="relative mt-3 h-52 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <Image src={form.imageUrl} alt="Journal preview" fill className="object-cover" unoptimized />
                  <Button type="button" size="sm" variant="outline" className="absolute right-2 top-2 bg-black/40 text-white hover:bg-black/60" onClick={() => onChange((p) => ({ ...p, imageUrl: "" }))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">PNG/JPG/WEBP up to 2MB.</p>
              )}
            </div>
          </div>

          {form.entryType === "TRADE" ? (
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1"><Label>What was my plan?</Label><Textarea value={form.plan} onChange={(e) => onChange((p) => ({ ...p, plan: e.target.value }))} /></div>
              <div className="space-y-1"><Label>What actually happened?</Label><Textarea value={form.execution} onChange={(e) => onChange((p) => ({ ...p, execution: e.target.value }))} /></div>
              <div className="space-y-1"><Label>What went well?</Label><Textarea value={form.whatWentWell} onChange={(e) => onChange((p) => ({ ...p, whatWentWell: e.target.value }))} /></div>
              <div className="space-y-1"><Label>What could improve?</Label><Textarea value={form.whatToImprove} onChange={(e) => onChange((p) => ({ ...p, whatToImprove: e.target.value }))} /></div>
              <div className="space-y-1 md:col-span-2"><Label>Key Lesson</Label><Textarea value={form.keyLesson} onChange={(e) => onChange((p) => ({ ...p, keyLesson: e.target.value }))} /></div>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1"><Label>Market Conditions</Label><Textarea value={form.marketConditions} onChange={(e) => onChange((p) => ({ ...p, marketConditions: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Tomorrow Focus</Label><Textarea value={form.tomorrowFocus} onChange={(e) => onChange((p) => ({ ...p, tomorrowFocus: e.target.value }))} /></div>
              <div className="space-y-1 md:col-span-2"><Label>Reflection</Label><Textarea value={form.content} onChange={(e) => onChange((p) => ({ ...p, content: e.target.value }))} /></div>
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1"><Label>Mood</Label><Input value={form.mood} onChange={(e) => onChange((p) => ({ ...p, mood: e.target.value }))} placeholder="Calm, FOMO, Confident" /></div>
            <div className="space-y-1"><Label>Tags</Label><Input value={form.tags} onChange={(e) => onChange((p) => ({ ...p, tags: e.target.value }))} placeholder="breakout, revenge-trade" /></div>
            <div className="space-y-1"><Label>Score (1-10)</Label><Input type="number" min={1} max={10} value={form.score} onChange={(e) => onChange((p) => ({ ...p, score: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Linked Trade IDs</Label><Input value={form.linkedTradeIds} onChange={(e) => onChange((p) => ({ ...p, linkedTradeIds: e.target.value }))} placeholder="123, 124" /></div>
          </div>

          <Button onClick={() => void onSave()}>{editingId ? "Update Entry" : "Create Entry"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

