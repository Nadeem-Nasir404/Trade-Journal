"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KpiMetricKey } from "@/utils/kpi-metrics";

type KPICardProps = {
  metric: KpiMetricKey;
  icon: React.ReactNode;
  label: string;
  value: string;
  subText?: string;
  trend: number[];
  tone: { text: string; spark: string; glow: string };
};

export function KPICard({ icon, label, value, subText, trend, tone }: KPICardProps) {
  const reduceMotion = useReducedMotion();
  const data = trend.map((v, i) => ({ i, v }));

  return (
    <motion.div whileHover={reduceMotion ? undefined : { y: -2 }} transition={{ duration: 0.15 }} className="min-w-0 will-change-transform">
      <Card className={cn("relative overflow-hidden border-slate-300 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-900", tone.glow)}>
        <div className="absolute inset-x-0 bottom-0 h-10 opacity-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <Area type="monotone" dataKey="v" stroke={tone.spark} fill={tone.spark} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <CardHeader className="pb-1">
          <CardDescription className="flex items-center gap-1 text-sm font-semibold">{icon}{label}</CardDescription>
          <CardTitle className={cn("break-words text-2xl font-black leading-none tracking-tight sm:text-[2rem]", tone.text)}>{value}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="break-words text-xs font-medium text-slate-500/80 dark:text-slate-400/80">{subText ?? "-"}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default KPICard;
