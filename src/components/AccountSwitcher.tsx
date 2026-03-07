"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check, Plus, Settings } from "lucide-react";
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
};

export function AccountSwitcher() {
  const router = useRouter();
  const { selectedAccountId, setSelectedAccountId } = useSelectedAccount();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/accounts?status=ACTIVE", { cache: "no-store" });
      const json = (await res.json()) as { accounts?: Account[] };
      const list = json.accounts ?? [];
      setAccounts(list);
      if (!selectedAccountId && list[0]) setSelectedAccountId(list[0].id);
    }
    void load();
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
      <button onClick={() => setIsOpen((v) => !v)} className="group flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 transition-all hover:border-emerald-300">
        <div className="text-xl">{selected.icon ?? "??"}</div>
        <div className="text-left">
          <div className="text-sm font-bold text-gray-900 transition-colors group-hover:text-emerald-600">{selected.name}</div>
          <div className={`text-xs font-semibold ${selectedProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ${selected.currentBalance.toLocaleString()} <span className="ml-1 text-gray-400">({selectedProfit >= 0 ? "+" : ""}{selectedProfit.toFixed(0)})</span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Trading Accounts ({accounts.length})</div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {accounts.map((account) => {
                const profit = account.currentBalance - account.startingBalance;
                const isSelected = account.id === selectedAccountId;
                return (
                  <button key={account.id} onClick={() => { setSelectedAccountId(account.id); setIsOpen(false); }} className={`w-full border-l-4 px-4 py-3 text-left transition-colors ${isSelected ? "border-emerald-500 bg-emerald-50" : "border-transparent hover:bg-gray-50"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-1 items-center gap-3">
                        <div className="text-2xl">{account.icon ?? "??"}</div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <div className="font-semibold text-gray-900">{account.name}</div>
                            {account.status !== "ACTIVE" ? <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">{account.status.toLowerCase()}</span> : null}
                          </div>
                          <div className="text-xs text-gray-500">{account.broker || "No broker"}</div>
                          <div className={`mt-1 text-xs font-semibold ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>${account.currentBalance.toLocaleString()} <span className="ml-1 text-gray-400">({profit >= 0 ? "+" : ""}{profit.toFixed(0)})</span></div>
                        </div>
                      </div>
                      {isSelected ? <Check className="h-5 w-5 text-emerald-600" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
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
