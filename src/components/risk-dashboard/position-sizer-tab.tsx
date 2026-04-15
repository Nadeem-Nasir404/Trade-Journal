"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { RiskDashboardResponse } from "@/components/risk-dashboard/types";
import { formatPct, formatUsd } from "@/components/risk-dashboard/utils";

export function PositionSizerTab({ data }: { data: RiskDashboardResponse }) {
  const [assetMode, setAssetMode] = useState<"BTC" | "ALTS">("BTC");
  const [riskPercent, setRiskPercent] = useState(1);
  const [btcStop, setBtcStop] = useState(500);
  const [btcPrice, setBtcPrice] = useState(83000);
  const [altPrice, setAltPrice] = useState(1);
  const [altStopPct, setAltStopPct] = useState(5);

  const overview = data.dashboard.overview;

  const computed = useMemo(() => {
    const riskDollars = (overview.accountSize * riskPercent) / 100;
    if (assetMode === "BTC") {
      const stopPct = btcPrice > 0 ? btcStop / btcPrice : 0;
      const positionUsd = stopPct > 0 ? riskDollars / stopPct : 0;
      const positionSize = btcPrice > 0 ? positionUsd / btcPrice : 0;
      return {
        riskDollars,
        entries: [
          ["Position Size", `${positionSize.toFixed(5)} BTC`],
          ["% Of Account Used", formatPct((positionUsd / overview.accountSize) * 100)],
          ["TP at 1:2", formatUsd(btcPrice + btcStop * 2)],
          ["TP at 1:3", formatUsd(btcPrice + btcStop * 3)],
          ["Max Trades Allowed Today", `${Math.max(Math.floor(overview.safeStop / Math.max(riskDollars, 1)), 0)} trades`],
        ],
      };
    }

    const stopPct = altStopPct / 100;
    const positionUsd = stopPct > 0 ? riskDollars / stopPct : 0;
    const units = altPrice > 0 ? positionUsd / altPrice : 0;
    return {
      riskDollars,
      entries: [
        ["Position Size", formatUsd(positionUsd)],
        ["% Of Account Used", formatPct((positionUsd / overview.accountSize) * 100)],
        ["Units", units.toFixed(4)],
        ["TP at 1:2", formatUsd(altPrice * (1 + stopPct * 2))],
        ["TP at 1:3", formatUsd(altPrice * (1 + stopPct * 3))],
        ["Max Trades Allowed Today", `${Math.max(Math.floor(overview.safeStop / Math.max(riskDollars, 1)), 0)} trades`],
      ],
    };
  }, [altPrice, altStopPct, assetMode, btcPrice, btcStop, overview.accountSize, overview.safeStop, riskPercent]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader>
          <CardTitle>Position Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {(["BTC", "ALTS"] as const).map((mode) => (
              <Button key={mode} type="button" variant={assetMode === mode ? "default" : "outline"} onClick={() => setAssetMode(mode)}>
                {mode === "BTC" ? "BTC" : "Alts"}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Risk per trade %">
              <Input type="number" min={0.1} max={5} step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(Number(e.target.value))} />
            </Field>
            <Field label="Risk per trade $">
              <Input value={Math.round(computed.riskDollars)} readOnly />
            </Field>
          </div>

          {assetMode === "BTC" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="BTC stop loss ($)">
                <Input type="number" min={1} step="1" value={btcStop} onChange={(e) => setBtcStop(Number(e.target.value))} />
              </Field>
              <Field label="BTC current price">
                <Input type="number" min={1} step="1" value={btcPrice} onChange={(e) => setBtcPrice(Number(e.target.value))} />
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Alt entry price">
                <Input type="number" min={0.0001} step="0.0001" value={altPrice} onChange={(e) => setAltPrice(Number(e.target.value))} />
              </Field>
              <Field label="Alt stop loss %">
                <Input type="number" min={0.1} step="0.1" value={altStopPct} onChange={(e) => setAltStopPct(Number(e.target.value))} />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sizer Output</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Risk per trade</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatUsd(computed.riskDollars)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Risk % per trade</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPct(riskPercent)}</span>
          </div>
          {computed.entries.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{label}</span>
              <span className="text-right font-semibold text-slate-900 dark:text-slate-100">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
