"use client";

import { Save } from "lucide-react";

import type { RiskSettingsDraft } from "@/components/risk-dashboard/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  accountName: string;
  draft: RiskSettingsDraft;
  saving: boolean;
  onChange: <K extends keyof RiskSettingsDraft>(key: K, value: RiskSettingsDraft[K]) => void;
  onSave: () => void;
};

export function AccountSetupCard({ accountName, draft, saving, onChange, onSave }: Props) {
  return (
    <Card className="overflow-hidden rounded-[24px] border-slate-200/80 bg-white/90 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
      <CardHeader className="border-b border-slate-200/80 bg-slate-50/80 pb-5 dark:border-slate-800 dark:bg-slate-950/40">
        <CardTitle>Account Setup</CardTitle>
        <CardDescription>Risk settings for {accountName}. This saves to the selected trading account and stays tied to your real journal data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {[
            { value: "FUNDED", label: "Funded Account" },
            { value: "PERSONAL", label: "Personal Account" },
          ].map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={draft.accountType === option.value ? "default" : "outline"}
              className="w-full rounded-2xl sm:w-auto"
              onClick={() => onChange("accountType", option.value as RiskSettingsDraft["accountType"])}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Account Size">
            <Input type="number" min={1} value={draft.startingBalance} onChange={(e) => onChange("startingBalance", Number(e.target.value))} />
          </Field>
          <Field label="Current Balance">
            <Input type="number" min={1} value={draft.currentBalance} onChange={(e) => onChange("currentBalance", Number(e.target.value))} />
          </Field>

          {draft.accountType === "FUNDED" ? (
            <>
              <Field label="Daily Drawdown % Limit">
                <Input type="number" min={0} step="0.1" value={draft.dailyDdPct} onChange={(e) => onChange("dailyDdPct", Number(e.target.value))} />
              </Field>
              <Field label="Overall Drawdown % Limit">
                <Input type="number" min={0} step="0.1" value={draft.overallDdPct} onChange={(e) => onChange("overallDdPct", Number(e.target.value))} />
              </Field>
              <Field label="Phase 1 Target %">
                <Input type="number" min={0} step="0.1" value={draft.phase1TargetPct} onChange={(e) => onChange("phase1TargetPct", Number(e.target.value))} />
              </Field>
              <Field label="Phase 2 Target %">
                <Input type="number" min={0} step="0.1" value={draft.phase2TargetPct} onChange={(e) => onChange("phase2TargetPct", Number(e.target.value))} />
              </Field>
            </>
          ) : (
            <Field label="Optional Daily Loss Limit %">
              <Input
                type="number"
                min={0}
                step="0.1"
                value={draft.personalDailyLossPct}
                onChange={(e) => onChange("personalDailyLossPct", e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Field>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={onSave} disabled={saving} className="w-full rounded-2xl sm:w-auto">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
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
