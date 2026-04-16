import { cn } from "@/lib/utils";

export function ProgressBar({ label, value, tone = "emerald" }: { label: string; value: number; tone?: "emerald" | "amber" | "rose" | "sky" }) {
  const safeValue = Math.max(0, Math.min(100, value));
  const toneClass =
    tone === "rose"
      ? "bg-[linear-gradient(90deg,#fb7185_0%,#e11d48_100%)] shadow-[0_0_22px_rgba(244,63,94,0.35)]"
      : tone === "amber"
        ? "bg-[linear-gradient(90deg,#fbbf24_0%,#f59e0b_100%)] shadow-[0_0_22px_rgba(245,158,11,0.3)]"
        : tone === "sky"
          ? "bg-[linear-gradient(90deg,#38bdf8_0%,#2563eb_100%)] shadow-[0_0_22px_rgba(56,189,248,0.3)]"
          : "bg-[linear-gradient(90deg,#34d399_0%,#10b981_100%)] shadow-[0_0_22px_rgba(16,185,129,0.3)]";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">{safeValue.toFixed(1)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-slate-200/80 bg-slate-100/90 dark:border-slate-800 dark:bg-slate-950/70">
        <div className={cn("h-full rounded-full transition-all", toneClass)} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
