import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCard({ title, value, subtext }: { title: string; value: string; subtext?: string }) {
  return (
    <Card className="border-slate-200/80 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
        {subtext ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtext}</p> : null}
      </CardContent>
    </Card>
  );
}
