"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-slate-200 dark:bg-slate-800", className)}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-slate-100/10"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <Shimmer className="mb-3 h-4 w-24" />
          <Shimmer className="h-8 w-32" />
        </div>
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Shimmer key={i} className="h-6" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
            <Shimmer className="mb-2 h-3 w-6" />
            <Shimmer className="mb-1 h-4 w-16" />
            <Shimmer className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TradeTableSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-2 rounded-md border border-slate-200 p-2 dark:border-slate-700">
          {Array.from({ length: 7 }).map((__, j) => (
            <Shimmer key={j} className="h-6" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmeraldSpinner({ size = 40 }: { size?: number }) {
  return (
    <motion.div
      className="rounded-full"
      style={{
        width: size,
        height: size,
        background: "conic-gradient(from 0deg, rgba(16,185,129,0.1), rgba(16,185,129,1), rgba(16,185,129,0.1))",
      }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
    >
      <div className="m-[4px] h-[calc(100%-8px)] w-[calc(100%-8px)] rounded-full bg-[var(--card)]" />
    </motion.div>
  );
}

export default function LoadingSkeleton() {
  return <KpiCardsSkeleton />;
}
