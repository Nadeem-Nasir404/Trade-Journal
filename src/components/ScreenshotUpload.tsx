"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Upload, X, Link as LinkIcon, Image as ImageIcon, Plus, Edit2 } from "lucide-react";

export type TradeScreenshot = {
  id: string;
  file?: File;
  preview: string;
  name: string;
  type: "upload" | "link";
  url?: string;
};

export function ScreenshotUpload({
  screenshots = [],
  onChange,
  maxFiles = 10,
  onAnnotate,
}: {
  screenshots: TradeScreenshot[];
  onChange: (next: TradeScreenshot[]) => void;
  maxFiles?: number;
  onAnnotate?: (shot: TradeScreenshot) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [tvLink, setTvLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback((input: FileList | File[] | null) => {
    if (!input) return;
    const files = Array.from(input).slice(0, maxFiles - screenshots.length);
    const valid = files.filter((f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
    const filePromises = valid.map(
      (file) =>
        new Promise<TradeScreenshot>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) =>
            resolve({
              id: Math.random().toString(36).slice(2),
              file,
              preview: String(e.target?.result ?? ""),
              name: file.name,
              type: "upload",
            });
          reader.readAsDataURL(file);
        }),
    );

    void Promise.all(filePromises).then((next) => onChange([...screenshots, ...next]));
  }, [maxFiles, onChange, screenshots]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items ?? [];
      const files: File[] = [];
      for (const item of items) {
        if (item.type.includes("image")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) handleFiles(files);
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleFiles]);

  function removeScreenshot(id: string) {
    onChange(screenshots.filter((s) => s.id !== id));
  }

  function addTradingViewLink() {
    if (!tvLink.trim()) return;
    onChange([
      ...screenshots,
      {
        id: Math.random().toString(36).slice(2),
        preview: tvLink,
        name: "TradingView Chart",
        type: "link",
        url: tvLink,
      },
    ]);
    setTvLink("");
    setShowLinkInput(false);
  }

  const canAddMore = screenshots.length < maxFiles;

  return (
    <div className="space-y-4">
      {canAddMore ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`rounded-xl border-2 border-dashed p-8 transition-all ${
            isDragging
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-slate-700 dark:bg-slate-800/50"
          }`}
        >
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
          <div className="text-center">
            <div className="mb-4 inline-flex rounded-full bg-white p-4 dark:bg-slate-900">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-100">Upload Screenshots</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">Drag & drop, paste, or click to upload</p>
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-600">
                <Upload className="h-4 w-4" />
                Choose Files
              </button>
              <button type="button" onClick={() => setShowLinkInput((v) => !v)} className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600">
                <LinkIcon className="h-4 w-4" />
                TradingView Link
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">{screenshots.length} / {maxFiles} screenshots • PNG/JPG up to 10MB</p>
          </div>

          {showLinkInput ? (
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-slate-700">
              <div className="flex gap-2">
                <input value={tvLink} onChange={(e) => setTvLink(e.target.value)} placeholder="Paste TradingView share link..." className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <button type="button" onClick={addTradingViewLink} className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600">Add</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {screenshots.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {screenshots.map((shot, index) => (
            <Thumb key={shot.id} shot={shot} index={index} onRemove={removeScreenshot} onAnnotate={onAnnotate} />
          ))}
          {canAddMore ? (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-video rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-700 dark:hover:bg-emerald-900/20">
              <Plus className="mx-auto mb-2 h-8 w-8" />
              <span className="text-sm font-medium">Add More</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Thumb({
  shot,
  index,
  onRemove,
  onAnnotate,
}: {
  shot: TradeScreenshot;
  index: number;
  onRemove: (id: string) => void;
  onAnnotate?: (s: TradeScreenshot) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="group relative aspect-video overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-100 transition-all hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-800"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.preview} alt={shot.name} className="h-full w-full object-cover" />
      {index === 0 ? <div className="absolute left-2 top-2 rounded-md bg-emerald-500 px-2 py-1 text-xs font-bold text-white">PRIMARY</div> : null}
      <AnimatePresence>
        {showActions ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60">
            {onAnnotate ? (
              <button type="button" onClick={() => onAnnotate(shot)} className="rounded-lg bg-white p-2 text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-600">
                <Edit2 className="h-4 w-4" />
              </button>
            ) : null}
            <button type="button" onClick={() => onRemove(shot.id)} className="rounded-lg bg-white p-2 text-gray-700 transition-colors hover:bg-rose-50 hover:text-rose-600">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
        <p className="truncate text-xs text-white">{shot.name}</p>
      </div>
    </motion.div>
  );
}
