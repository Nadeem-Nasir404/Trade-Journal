import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCard({
  title,
  value,
  subtext,
  icon,
  tone = "slate",
}: {
  title: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  tone?: "emerald" | "amber" | "rose" | "sky" | "slate";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300"
      : tone === "amber"
        ? "border-amber-200/70 bg-amber-500/10 text-amber-700 dark:border-amber-900/60 dark:text-amber-300"
        : tone === "rose"
          ? "border-rose-200/70 bg-rose-500/10 text-rose-700 dark:border-rose-900/60 dark:text-rose-300"
          : tone === "sky"
            ? "border-sky-200/70 bg-sky-500/10 text-sky-700 dark:border-sky-900/60 dark:text-sky-300"
            : "border-slate-200/80 bg-slate-50/80 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300";

  return (
    <Card className="overflow-hidden rounded-[24px] border-slate-200/80 bg-white/90 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</CardTitle>
          {icon ? <div className={`rounded-2xl border px-2.5 py-2 ${toneClass}`}>{icon}</div> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
        {subtext ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtext}</p> : null}
      </CardContent>
    </Card>
  );
}
