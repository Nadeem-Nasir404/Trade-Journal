"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, ShieldAlert, TrendingUp } from "lucide-react";

import { useSelectedAccount } from "@/hooks/use-selected-account";
import { AccountSetupCard } from "@/components/risk-dashboard/account-setup-card";
import { DrawdownTab } from "@/components/risk-dashboard/drawdown-tab";
import { OverviewTab } from "@/components/risk-dashboard/overview-tab";
import { PositionSizerTab } from "@/components/risk-dashboard/position-sizer-tab";
import { RulesTab } from "@/components/risk-dashboard/rules-tab";
import type { RiskDashboardResponse, RiskSettingsDraft } from "@/components/risk-dashboard/types";
import { createDraft } from "@/components/risk-dashboard/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RiskProfileApiResponse = RiskDashboardResponse | { message?: string; migrationPending?: boolean };

export function RiskDashboardClient() {
  const { selectedAccountId } = useSelectedAccount();
  const [data, setData] = useState<RiskDashboardResponse | null>(null);
  const [draft, setDraft] = useState<RiskSettingsDraft | null>(null);
  const [ruleDraft, setRuleDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!selectedAccountId) {
        setLoading(false);
        setData(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/risk-profile?accountId=${selectedAccountId}`, { cache: "no-store" });
        const json = (await res.json()) as RiskProfileApiResponse;
        if (!res.ok) {
          setError("message" in json ? (json.message ?? "Failed to load risk dashboard.") : "Failed to load risk dashboard.");
          return;
        }

        if ("account" in json && "dashboard" in json) {
          setData(json);
          setDraft(createDraft(json));
        } else {
          setError(json.message ?? "Failed to load risk dashboard.");
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load risk dashboard.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [selectedAccountId]);

  async function handleSave() {
    if (!selectedAccountId || !draft) return;
    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/risk-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          accountType: draft.accountType,
          startingBalance: draft.startingBalance,
          currentBalance: draft.currentBalance,
          maxDailyLoss: draft.accountType === "FUNDED" ? draft.dailyDdPct : null,
          maxOverallDrawdown: draft.accountType === "FUNDED" ? draft.overallDdPct : null,
          maxDailyLossType: draft.accountType === "FUNDED" ? "PERCENTAGE" : null,
          maxDrawdownType: draft.accountType === "FUNDED" ? "PERCENTAGE" : null,
          phase1TargetPct: draft.accountType === "FUNDED" ? draft.phase1TargetPct : null,
          phase2TargetPct: draft.accountType === "FUNDED" ? draft.phase2TargetPct : null,
          personalDailyLossPct: draft.accountType === "PERSONAL" && draft.personalDailyLossPct !== "" ? Number(draft.personalDailyLossPct) : null,
          customRules: draft.customRules.filter((rule) => rule.trim().length > 0),
        }),
      });

      const json = (await res.json()) as RiskProfileApiResponse;
      if (!res.ok) {
        setError("message" in json ? (json.message ?? "Failed to save settings.") : "Failed to save settings.");
        return;
      }

      if ("account" in json && "dashboard" in json) {
        setData(json);
        setDraft(createDraft(json));
      } else {
        setError("message" in json ? (json.message ?? "Settings were saved partially.") : "Settings were saved partially.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  function updateDraft<K extends keyof RiskSettingsDraft>(key: K, value: RiskSettingsDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  if (!selectedAccountId) {
    return (
      <EmptyState
        title="Pick an account first"
        description="This dashboard uses your currently selected trading account so drawdown, rules, and progress all stay account-specific."
      />
    );
  }

  if (loading) {
    return <EmptyState title="Loading risk dashboard" description="Pulling account settings and journal trades for the selected account..." />;
  }

  if (error || !data || !draft) {
    return <EmptyState title="Risk dashboard unavailable" description={error ?? "We couldn't load this feature right now."} />;
  }

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.04),transparent)] dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.92),transparent)]" />

      <section className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(240,249,255,0.94)_44%,rgba(236,253,245,0.95)_100%)] p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.6)] dark:border-slate-700/70 dark:bg-[linear-gradient(135deg,rgba(2,6,23,0.98)_0%,rgba(10,18,32,0.98)_38%,rgba(5,46,22,0.42)_100%)] sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:38px_38px] opacity-30 dark:opacity-20" />
        <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-emerald-500/18 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-12 h-40 w-40 rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-36 w-36 rounded-full bg-emerald-400/12 blur-3xl" />

        <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 shadow-[0_10px_25px_-16px_rgba(16,185,129,0.8)] dark:bg-slate-950">
              <ShieldAlert className="h-3.5 w-3.5" />
              Risk Control
            </div>

            <div>
              <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-[2.8rem] lg:leading-[1.05]">Crypto Risk Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                A high-clarity risk cockpit for funded challenges and personal capital, built around live account limits, position sizing discipline, and drawdown protection.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat label="Selected Account" value={data.account.name} tone="emerald" />
              <HeroStat label="Mode" value={draft.accountType === "FUNDED" ? "Funded Profile" : "Personal Profile"} tone="sky" />
              <HeroStat label="Current Balance" value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(draft.currentBalance)} tone="slate" />
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <Button type="button" onClick={handleSave} disabled={saving} className="w-full rounded-2xl bg-slate-950 px-5 py-6 text-sm text-white shadow-[0_20px_32px_-18px_rgba(15,23,42,0.9)] hover:bg-slate-800 sm:w-auto dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
              {saving ? "Saving..." : "Save All Changes"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-medium text-slate-500 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Crypto-focused, mobile-ready, and journal-connected
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <AccountSetupCard accountName={data.account.name} draft={draft} saving={saving} onChange={updateDraft} onSave={handleSave} />
        </div>
        <div className="space-y-4">
          <SidePanel
            title="Risk Sequence"
            lines={[
              "1. Lock in account rules and drawdown limits.",
              "2. Size trades from safe stop, not emotion.",
              "3. Track P&L against hard daily and overall caps.",
            ]}
          />
          <SidePanel
            title="Execution Bias"
            lines={[
              draft.accountType === "FUNDED" ? "Preserve evaluation consistency first." : "Protect capital longevity first.",
              "Use the dashboard before, during, and after trade execution.",
            ]}
          />
        </div>
      </section>

      {data.warningMessage ? (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertCircle className="h-4 w-4" />
          {data.warningMessage}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,250,252,0.88)_100%)] p-2 whitespace-nowrap shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-700 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.94)_0%,rgba(15,23,42,0.94)_100%)]">
          <TabsTrigger value="overview" className="rounded-2xl px-4 py-3">Overview</TabsTrigger>
          <TabsTrigger value="sizer" className="rounded-2xl px-4 py-3">Position Sizer</TabsTrigger>
          <TabsTrigger value="drawdown" className="rounded-2xl px-4 py-3">Drawdown Tracker</TabsTrigger>
          <TabsTrigger value="rules" className="rounded-2xl px-4 py-3">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab data={data} />
        </TabsContent>
        <TabsContent value="sizer">
          <PositionSizerTab data={data} />
        </TabsContent>
        <TabsContent value="drawdown">
          <DrawdownTab data={data} />
        </TabsContent>
        <TabsContent value="rules">
          <RulesTab
            customRules={draft.customRules}
            builtInRules={data.builtInRules}
            draftRule={ruleDraft}
            onDraftRuleChange={setRuleDraft}
            onAddRule={() => {
              const value = ruleDraft.trim();
              if (!value) return;
              updateDraft("customRules", [...draft.customRules, value]);
              setRuleDraft("");
            }}
            onUpdateRule={(index, value) => {
              const next = [...draft.customRules];
              next[index] = value;
              updateDraft("customRules", next);
            }}
            onDeleteRule={(index) => {
              updateDraft("customRules", draft.customRules.filter((_, currentIndex) => currentIndex !== index));
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="rounded-[28px] border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.96)_100%)] dark:border-slate-700/70 dark:bg-[linear-gradient(135deg,rgba(2,6,23,0.96)_0%,rgba(9,14,32,0.96)_100%)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}

function HeroStat({ label, value, tone }: { label: string; value: string; tone: "emerald" | "sky" | "slate" }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200/70 bg-[linear-gradient(135deg,rgba(16,185,129,0.15),rgba(255,255,255,0.78))] text-emerald-700 dark:border-emerald-900/60 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(2,6,23,0.62))] dark:text-emerald-300"
      : tone === "sky"
        ? "border-sky-200/70 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(255,255,255,0.78))] text-sky-700 dark:border-sky-900/60 dark:bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(2,6,23,0.62))] dark:text-sky-300"
        : "border-slate-200/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.06),rgba(255,255,255,0.82))] text-slate-700 dark:border-slate-700 dark:bg-[linear-gradient(135deg,rgba(148,163,184,0.08),rgba(2,6,23,0.62))] dark:text-slate-300";

  return (
    <div className={`rounded-[22px] border px-4 py-4 shadow-sm backdrop-blur ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold sm:text-base">{value}</p>
    </div>
  );
}

function SidePanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.9)_100%)] p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.96)_0%,rgba(15,23,42,0.96)_100%)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
      <div className="mt-3 space-y-2">
        {lines.map((line) => (
          <div key={line} className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
