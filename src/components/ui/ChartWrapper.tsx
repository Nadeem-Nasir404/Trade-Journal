"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmeraldSpinner } from "@/components/ui/LoadingSkeleton";

export function ChartWrapper({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export const PnlLineChart = dynamic(() => import("@/components/ui/charts/PnlLineChart"), {
  ssr: false,
  loading: () => <div className="flex h-[220px] items-center justify-center"><EmeraldSpinner size={30} /></div>,
});

export const WinsLossesBarChart = dynamic(() => import("@/components/ui/charts/WinsLossesBarChart"), {
  ssr: false,
  loading: () => <div className="flex h-[220px] items-center justify-center"><EmeraldSpinner size={30} /></div>,
});

export const TradeDistributionPieChart = dynamic(() => import("@/components/ui/charts/TradeDistributionPieChart"), {
  ssr: false,
  loading: () => <div className="flex h-[220px] items-center justify-center"><EmeraldSpinner size={30} /></div>,
});

export const TimeOfDayHeatmap = dynamic(() => import("@/components/ui/charts/TimeOfDayHeatmap"), {
  ssr: false,
  loading: () => <div className="flex h-[220px] items-center justify-center"><EmeraldSpinner size={30} /></div>,
});
