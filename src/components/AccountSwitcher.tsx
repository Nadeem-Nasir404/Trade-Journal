"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check, Plus, Settings, Wallet, Trophy, LineChart, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelectedAccount } from "@/hooks/use-selected-account";

type Account = {
  id: number;
  name: string;
  icon: string | null;
  broker: string | null;
  status: string;
  currentBalance: number;
  startingBalance: number;
  accountType?: "PERSONAL" | "FUNDED" | "DEMO" | "PROP_FIRM";
};

function renderIcon(icon: string | null, accountType: Account["accountType"] | undefined, className: string) {
  const key = (icon ?? "").toLowerCase();
  if (icon === "\u{1F4B0}") return <span className={className}>{"\u{1F4B0}"}</span>;
  if (icon === "\u{1F3C6}") return <span className={className}>{"\u{1F3C6}"}</span>;
  if (icon === "\u{1F4DD}") return <span className={className}>{"\u{1F4DD}"}</span>;
  if (icon === "\u{1F4C8}") return <span className={className}>{"\u{1F4C8}"}</span>;
  if (icon === "\u{1F3AF}") return <span className={className}>{"\u{1F3AF}"}</span>;
  if (icon === "\u{26A1}") return <span className={className}>{"\u{26A1}"}</span>;
  if (icon === "\u{1F680}") return <span className={className}>{"\u{1F680}"}</span>;
  if (key === "wallet" || accountType === "PERSONAL") return <Wallet className={className} />;
  if (key === "trophy" || accountType === "FUNDED") return <Trophy className={className} />;
  if (key === "rocket") return <Rocket className={className} />;
  return <LineChart className={className} />;
}

export function AccountSwitcher() {
  const router = useRouter();
  const { selectedAccountId, setSelectedAccountId } = useSelectedAccount();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/accounts?status=ACTIVE", { cache: "no-store" });
      const json = (await res.json()) as { accounts?: Account[] };
      const list = json.accounts ?? [];
      if (cancelled) return;
      setAccounts(list);
      if (!selectedAccountId && list[0]) {
        setSelectedAccountId(list[0].id);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [selectedAccountId, setSelectedAccountId]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  if (!selected) {
    return (
      <button onClick={() => router.push("/accounts")} className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-600">
        <Plus className="h-4 w-4" />
        Create Account
      </button>
    );
  }

  const selectedProfit = selected.currentBalance - selected.startingBalance;

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen((v) => !v)} className="group flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 transition-all hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500/60">
        <div className="rounded-md bg-slate-100 p-1.5 dark:bg-slate-800">
          {renderIcon(selected.icon, selected.accountType, "h-4 w-4 text-slate-700 dark:text-slate-200")}
        </div>
        <div className="text-left">
          <div className="text-sm font-bold text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-slate-100">{selected.name}</div>
          <div className={`text-xs font-semibold ${selectedProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ${selected.currentBalance.toLocaleString()} <span className="ml-1 text-gray-400 dark:text-slate-500">({selectedProfit >= 0 ? "+" : ""}{selectedProfit.toFixed(0)})</span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform dark:text-slate-400 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Trading Accounts ({accounts.length})</div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {accounts.map((account) => {
                const profit = account.currentBalance - account.startingBalance;
                const isSelected = account.id === selectedAccountId;
                return (
                  <button key={account.id} onClick={() => { setSelectedAccountId(account.id); setIsOpen(false); }} className={`w-full border-l-4 px-4 py-3 text-left transition-colors ${isSelected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-transparent hover:bg-gray-50 dark:hover:bg-slate-800"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-1 items-center gap-3">
                        <div className="rounded-md bg-slate-100 p-1.5 dark:bg-slate-800">
                          {renderIcon(account.icon, account.accountType, "h-4 w-4 text-slate-700 dark:text-slate-200")}
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <div className="font-semibold text-gray-900 dark:text-slate-100">{account.name}</div>
                            {account.status !== "ACTIVE" ? <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-slate-700 dark:text-slate-300">{account.status.toLowerCase()}</span> : null}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{account.broker || "No broker"}</div>
                          <div className={`mt-1 text-xs font-semibold ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>${account.currentBalance.toLocaleString()} <span className="ml-1 text-gray-400 dark:text-slate-500">({profit >= 0 ? "+" : ""}{profit.toFixed(0)})</span></div>
                        </div>
                      </div>
                      {isSelected ? <Check className="h-5 w-5 text-emerald-600" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
              <button onClick={() => { router.push("/accounts"); setIsOpen(false); }} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-600">
                <Settings className="h-4 w-4" />
                Manage Accounts
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
