import { cn } from "@/lib/utils";

export function ProgressBar({ label, value, tone = "emerald" }: { label: string; value: number; tone?: "emerald" | "amber" | "rose" | "sky" }) {
  const safeValue = Math.max(0, Math.min(100, value));
  const toneClass =
    tone === "rose"
      ? "bg-rose-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "sky"
          ? "bg-sky-500"
          : "bg-emerald-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">{safeValue.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={cn("h-full rounded-full transition-all", toneClass)} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
