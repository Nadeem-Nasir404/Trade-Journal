"use client";

import { Landmark, Save, Shield, Wallet } from "lucide-react";

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
    <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.95)_46%,rgba(239,246,255,0.94)_100%)] shadow-[0_24px_50px_-32px_rgba(15,23,42,0.55)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(7,13,28,0.98)_46%,rgba(3,12,20,0.99)_100%)]">
      <CardHeader className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50/80 pb-5 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-xl tracking-tight">Account Setup</CardTitle>
            <CardDescription className="mt-2 max-w-2xl">Risk settings for {accountName}. This saves to the selected trading account and stays tied to your real journal data.</CardDescription>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <HeaderBadge icon={<Wallet className="h-4 w-4" />} label="Account" value={accountName} />
            <HeaderBadge icon={<Landmark className="h-4 w-4" />} label="Mode" value={draft.accountType === "FUNDED" ? "Funded" : "Personal"} />
            <HeaderBadge icon={<Shield className="h-4 w-4" />} label="Profile" value="Live Risk" />
          </div>
        </div>
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
          <Field label="Account Size" helper="Base capital used for limits and sizing.">
            <Input type="number" min={1} value={draft.startingBalance} onChange={(e) => onChange("startingBalance", Number(e.target.value))} />
          </Field>
          <Field label="Current Balance" helper="Use the latest account equity or balance.">
            <Input type="number" min={1} value={draft.currentBalance} onChange={(e) => onChange("currentBalance", Number(e.target.value))} />
          </Field>

          {draft.accountType === "FUNDED" ? (
            <>
              <Field label="Daily Drawdown % Limit" helper="Your hard daily loss cap.">
                <Input type="number" min={0} step="0.1" value={draft.dailyDdPct} onChange={(e) => onChange("dailyDdPct", Number(e.target.value))} />
              </Field>
              <Field label="Overall Drawdown % Limit" helper="Max total drawdown allowed.">
                <Input type="number" min={0} step="0.1" value={draft.overallDdPct} onChange={(e) => onChange("overallDdPct", Number(e.target.value))} />
              </Field>
              <Field label="Phase 1 Target %" helper="Evaluation milestone one.">
                <Input type="number" min={0} step="0.1" value={draft.phase1TargetPct} onChange={(e) => onChange("phase1TargetPct", Number(e.target.value))} />
              </Field>
              <Field label="Phase 2 Target %" helper="Evaluation milestone two.">
                <Input type="number" min={0} step="0.1" value={draft.phase2TargetPct} onChange={(e) => onChange("phase2TargetPct", Number(e.target.value))} />
              </Field>
            </>
          ) : (
            <Field label="Optional Daily Loss Limit %" helper="Self-imposed daily cap for discipline.">
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

        <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
          <div className="grid gap-3 sm:grid-cols-3">
            <Insight title="Sizing Base" value={`$${draft.startingBalance.toLocaleString()}`} tone="emerald" />
            <Insight title="Risk Mode" value={draft.accountType === "FUNDED" ? "Rule-bound" : "Self-directed"} tone="sky" />
            <Insight title="Current Equity" value={`$${draft.currentBalance.toLocaleString()}`} tone="amber" />
          </div>
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

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
      <div className="mb-3 space-y-1">
        <Label>{label}</Label>
        {helper ? <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p> : null}
      </div>
      {children}
    </div>
  );
}

function HeaderBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/45 dark:text-slate-300">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </div>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function Insight({ title, value, tone }: { title: string; value: string; tone: "emerald" | "sky" | "amber" }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300"
      : tone === "sky"
        ? "border-sky-200/70 bg-sky-500/10 text-sky-700 dark:border-sky-900/60 dark:text-sky-300"
        : "border-amber-200/70 bg-amber-500/10 text-amber-700 dark:border-amber-900/60 dark:text-amber-300";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">{title}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
