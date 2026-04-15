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

      setLoading(true);
      setError(null);
      const res = await fetch(`/api/risk-profile?accountId=${selectedAccountId}`, { cache: "no-store" });
      const json = (await res.json()) as RiskDashboardResponse & { message?: string };
      if (!res.ok) {
        setError(json.message ?? "Failed to load risk dashboard.");
        setLoading(false);
        return;
      }

      setData(json);
      setDraft(createDraft(json));
      setLoading(false);
    }

    void load();
  }, [selectedAccountId]);

  async function handleSave() {
    if (!selectedAccountId || !draft) return;
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

    const json = (await res.json()) as RiskDashboardResponse & { message?: string };
    if (!res.ok) {
      setError(json.message ?? "Failed to save settings.");
      setSaving(false);
      return;
    }

    setData(json);
    setDraft(createDraft(json));
    setSaving(false);
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
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.96)_48%,rgba(236,253,245,0.95)_100%)] p-5 shadow-[0_18px_50px_-26px_rgba(15,23,42,0.55)] dark:border-slate-700/70 dark:bg-[linear-gradient(135deg,rgba(2,6,23,0.96)_0%,rgba(9,14,32,0.96)_48%,rgba(6,78,59,0.35)_100%)] sm:p-6">
        <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              Risk Control
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Crypto Risk Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Account-aware risk planning, position sizing, drawdown control, and rules management, all tied directly to your saved trade journal data.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat label="Selected Account" value={data.account.name} tone="emerald" />
              <HeroStat label="Mode" value={draft.accountType === "FUNDED" ? "Funded Profile" : "Personal Profile"} tone="sky" />
              <HeroStat label="Current Balance" value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(draft.currentBalance)} tone="slate" />
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <Button type="button" variant="outline" onClick={handleSave} disabled={saving} className="w-full rounded-2xl border-slate-300 bg-white/80 px-5 py-6 text-sm shadow-sm backdrop-blur sm:w-auto dark:border-slate-700 dark:bg-slate-900/80">
              {saving ? "Saving..." : "Save All Changes"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-medium text-slate-500 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Mobile-friendly layout and shared Alpha Journal styling
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Settings and Risk Controls</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Update the active account profile, then review live metrics below.</p>
          </div>
        </div>
      </div>

      <AccountSetupCard accountName={data.account.name} draft={draft} saving={saving} onChange={updateDraft} onSave={handleSave} />

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 whitespace-nowrap shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
          <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5">Overview</TabsTrigger>
          <TabsTrigger value="sizer" className="rounded-xl px-4 py-2.5">Position Sizer</TabsTrigger>
          <TabsTrigger value="drawdown" className="rounded-xl px-4 py-2.5">Drawdown Tracker</TabsTrigger>
          <TabsTrigger value="rules" className="rounded-xl px-4 py-2.5">Rules</TabsTrigger>
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
      ? "border-emerald-200/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300"
      : tone === "sky"
        ? "border-sky-200/70 bg-sky-500/10 text-sky-700 dark:border-sky-900/60 dark:text-sky-300"
        : "border-slate-200/80 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300";

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm backdrop-blur ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold sm:text-base">{value}</p>
    </div>
  );
}
