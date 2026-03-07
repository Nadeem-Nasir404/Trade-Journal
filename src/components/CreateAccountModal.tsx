"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Wallet, AlertCircle } from "lucide-react";

const BROKERS = ["FTMO", "TopStepTrader", "MyForexFunds", "The5%ers", "FundedNext", "Binance", "Interactive Brokers", "TD Ameritrade", "E*TRADE", "Robinhood", "MetaTrader 4", "MetaTrader 5", "TradingView", "Coinbase", "Other"];
const PLATFORMS = ["MT4", "MT5", "TradingView", "cTrader", "NinjaTrader", "ThinkOrSwim", "Webull", "Binance", "Interactive Brokers", "Other"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF"];
const ACCOUNT_TYPES = [
  { value: "PERSONAL", label: "Personal", icon: "\u{1F4B0}", desc: "Your own capital" },
  { value: "FUNDED", label: "Funded Challenge", icon: "\u{1F3C6}", desc: "FTMO, Topstep, etc." },
  { value: "DEMO", label: "Demo/Paper", icon: "\u{1F4DD}", desc: "Practice account" },
] as const;
const ACCOUNT_ICONS = [
  { value: "\u{1F4B0}", label: "Money Bag" },
  { value: "\u{1F3C6}", label: "Trophy" },
  { value: "\u{1F4DD}", label: "Memo" },
  { value: "\u{1F4C8}", label: "Chart" },
  { value: "\u{1F3AF}", label: "Target" },
  { value: "\u{26A1}", label: "Flash" },
  { value: "\u{1F680}", label: "Rocket" },
  { value: "\u{1F48E}", label: "Diamond" },
  { value: "\u{1F525}", label: "Fire" },
  { value: "\u{2728}", label: "Sparkles" },
];

type FormData = {
  name: string;
  broker: string;
  platform: string;
  startingBalance: string;
  currency: string;
  accountType: "PERSONAL" | "FUNDED" | "DEMO" | "PROP_FIRM";
  icon: string;
  profitTarget: string;
  maxDailyLoss: string;
  maxDailyLossType: "FIXED" | "PERCENTAGE";
  maxOverallDrawdown: string;
  maxDrawdownType: "FIXED" | "PERCENTAGE";
  notes: string;
};

export function CreateAccountModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    broker: "",
    platform: "",
    startingBalance: "",
    currency: "USD",
    accountType: "PERSONAL",
    icon: "\u{1F4B0}",
    profitTarget: "",
    maxDailyLoss: "",
    maxDailyLossType: "FIXED",
    maxOverallDrawdown: "",
    maxDrawdownType: "FIXED",
    notes: "",
  });

  function validate() {
    const next: Record<string, string> = {};
    if (!formData.name.trim()) next.name = "Account name is required";
    if (!formData.startingBalance || Number(formData.startingBalance) <= 0) next.startingBalance = "Starting balance must be greater than 0";
    if (formData.accountType === "FUNDED") {
      if (!formData.profitTarget) next.profitTarget = "Profit target required for funded accounts";
      if (!formData.maxOverallDrawdown) next.maxOverallDrawdown = "Max drawdown required for funded accounts";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setSaving(true);
    const payload = {
      ...formData,
      startingBalance: Number(formData.startingBalance),
      profitTarget: formData.profitTarget ? Number(formData.profitTarget) : null,
      maxDailyLoss: formData.maxDailyLoss ? Number(formData.maxDailyLoss) : null,
      maxOverallDrawdown: formData.maxOverallDrawdown ? Number(formData.maxOverallDrawdown) : null,
      status: "ACTIVE",
    };

    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { message?: string } | null;
      setSubmitError(json?.message ?? "Failed to create account.");
      return;
    }

    await onCreated();
    onClose();
  }

  const isFundedAccount = formData.accountType === "FUNDED";

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
              <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500 p-2"><Wallet className="h-5 w-5 text-white" /></div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">New Trading Account</h2>
                      <p className="mt-0.5 text-sm text-gray-600 dark:text-slate-400">Set up a new account to track your trading</p>
                    </div>
                  </div>
                  <button type="button" onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/50 dark:hover:bg-slate-800"><X className="h-5 w-5 text-gray-600 dark:text-slate-300" /></button>
                </div>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="max-h-[calc(90vh-180px)] space-y-6 overflow-y-auto p-6">
                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-700 dark:text-slate-300">Account Type <span className="text-rose-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                      {ACCOUNT_TYPES.map((type) => (
                      <button key={type.value} type="button" onClick={() => setFormData((p) => ({ ...p, accountType: type.value, icon: type.icon }))} className={`rounded-xl border-2 p-4 text-left transition-all ${formData.accountType === type.value ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"}`}>
                        <div className="mb-2 flex items-center gap-3"><span className="text-2xl">{type.icon}</span><span className="font-semibold text-gray-900 dark:text-slate-100">{type.label}</span></div>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Account Name <span className="text-rose-500">*</span></label>
                    <input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., FTMO 100k" className={`w-full rounded-xl border-2 px-4 py-3 focus:outline-none ${errors.name ? "border-rose-500" : "border-gray-200 focus:border-emerald-500"}`} />
                    {errors.name ? <p className="mt-1 flex items-center gap-1 text-xs text-rose-600"><AlertCircle className="h-3 w-3" />{errors.name}</p> : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">Icon</label>
                    <select value={formData.icon} onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))} className="w-full rounded-xl border-2 border-gray-200 px-3 py-3 text-base focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      {ACCOUNT_ICONS.map((icon) => <option key={icon.value} value={icon.value}>{icon.value} {icon.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Broker</label>
                    <select value={formData.broker} onChange={(e) => setFormData((p) => ({ ...p, broker: e.target.value }))} className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"><option value="">Select broker...</option>{BROKERS.map((b) => <option key={b} value={b}>{b}</option>)}</select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Platform</label>
                    <select value={formData.platform} onChange={(e) => setFormData((p) => ({ ...p, platform: e.target.value }))} className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"><option value="">Select platform...</option>{PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Starting Balance <span className="text-rose-500">*</span></label>
                    <input type="number" step="0.01" value={formData.startingBalance} onChange={(e) => setFormData((p) => ({ ...p, startingBalance: e.target.value }))} className={`w-full rounded-xl border-2 px-4 py-3 font-mono focus:outline-none ${errors.startingBalance ? "border-rose-500" : "border-gray-200 focus:border-emerald-500"}`} />
                    {errors.startingBalance ? <p className="mt-1 flex items-center gap-1 text-xs text-rose-600"><AlertCircle className="h-3 w-3" />{errors.startingBalance}</p> : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Currency</label>
                    <select value={formData.currency} onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value }))} className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-emerald-500 focus:outline-none">{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                </div>

                {isFundedAccount ? (
                  <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
                    <h3 className="mb-4 font-bold text-purple-900">Funded Account Rules</h3>
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-semibold text-purple-900">Profit Target <span className="text-rose-500">*</span></label>
                      <input type="number" step="0.01" value={formData.profitTarget} onChange={(e) => setFormData((p) => ({ ...p, profitTarget: e.target.value }))} className={`w-full rounded-xl border-2 px-4 py-3 font-mono focus:outline-none ${errors.profitTarget ? "border-rose-500" : "border-purple-200 focus:border-purple-500"}`} />
                    </div>
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      <input type="number" step="0.01" value={formData.maxDailyLoss} onChange={(e) => setFormData((p) => ({ ...p, maxDailyLoss: e.target.value }))} placeholder="Max daily loss" className="col-span-2 rounded-xl border-2 border-purple-200 px-4 py-3 font-mono focus:border-purple-500 focus:outline-none" />
                      <select value={formData.maxDailyLossType} onChange={(e) => setFormData((p) => ({ ...p, maxDailyLossType: e.target.value as "FIXED" | "PERCENTAGE" }))} className="rounded-xl border-2 border-purple-200 px-4 py-3 focus:border-purple-500 focus:outline-none"><option value="FIXED">$</option><option value="PERCENTAGE">%</option></select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" step="0.01" value={formData.maxOverallDrawdown} onChange={(e) => setFormData((p) => ({ ...p, maxOverallDrawdown: e.target.value }))} placeholder="Max overall drawdown" className={`col-span-2 rounded-xl border-2 px-4 py-3 font-mono focus:outline-none ${errors.maxOverallDrawdown ? "border-rose-500" : "border-purple-200 focus:border-purple-500"}`} />
                      <select value={formData.maxDrawdownType} onChange={(e) => setFormData((p) => ({ ...p, maxDrawdownType: e.target.value as "FIXED" | "PERCENTAGE" }))} className="rounded-xl border-2 border-purple-200 px-4 py-3 focus:border-purple-500 focus:outline-none"><option value="FIXED">$</option><option value="PERCENTAGE">%</option></select>
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Notes (Optional)</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} rows={3} className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-emerald-500 focus:outline-none" />
                </div>
                {submitError ? (
                  <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                    {submitError}
                  </p>
                ) : null}
              </form>

              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/60">
                <button type="button" onClick={onClose} className="rounded-lg px-5 py-2.5 font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">Cancel</button>
                <button type="button" onClick={() => void handleSubmit()} disabled={saving} className="rounded-lg bg-emerald-500 px-8 py-2.5 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-600 disabled:opacity-50">
                  {saving ? "Creating..." : "Create Account"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
