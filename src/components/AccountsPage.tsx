"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Wallet, TrendingUp, DollarSign } from "lucide-react";

import { CreateAccountModal } from "@/components/CreateAccountModal";
import { AccountCard } from "@/components/AccountCard";
import { useSelectedAccount } from "@/hooks/use-selected-account";

type Account = {
  id: number;
  name: string;
  broker: string | null;
  platform: string | null;
  icon: string | null;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "FAILED" | "ARCHIVED";
  accountType: "PERSONAL" | "FUNDED" | "DEMO" | "PROP_FIRM";
  startingBalance: number;
  currentBalance: number;
  currency: string;
  profitTarget: number | null;
  maxOverallDrawdown: number | null;
};

export function AccountsPage() {
  const { setSelectedAccountId, selectedAccountId } = useSelectedAccount();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadAccounts() {
    const params = new URLSearchParams();
    if (filterStatus !== "ALL") params.set("status", filterStatus);
    const res = await fetch(`/api/accounts?${params.toString()}`, { cache: "no-store" });
    const json = (await res.json()) as { accounts?: Account[] };
    setAccounts(json.accounts ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(async () => {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      const res = await fetch(`/api/accounts?${params.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as { accounts?: Account[] };
      if (!cancelled) setAccounts(json.accounts ?? []);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [filterStatus]);

  const stats = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter((a) => a.status === "ACTIVE").length,
    totalBalance: accounts.filter((a) => a.status === "ACTIVE").reduce((sum, a) => sum + a.currentBalance, 0),
    totalProfit: accounts.filter((a) => a.status === "ACTIVE").reduce((sum, a) => sum + (a.currentBalance - a.startingBalance), 0),
  }), [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = account.name.toLowerCase().includes(q) || (account.broker || "").toLowerCase().includes(q);
      const matchesFilter = filterStatus === "ALL" || account.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [accounts, filterStatus, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="border-b border-gray-200 bg-white px-6 py-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Trading Accounts</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Manage multiple accounts, challenges, and brokers</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-600">
              <Plus className="h-4 w-4" />
              New Account
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatsCard icon={<Wallet className="h-5 w-5" />} label="Total Accounts" value={stats.total} color="blue" />
            <StatsCard icon={<TrendingUp className="h-5 w-5" />} label="Active Accounts" value={stats.active} color="emerald" />
            <StatsCard icon={<DollarSign className="h-5 w-5" />} label="Total Balance" value={`$${stats.totalBalance.toLocaleString()}`} color="purple" />
            <StatsCard icon={<TrendingUp className="h-5 w-5" />} label="Total Profit" value={`${stats.totalProfit >= 0 ? "+" : ""}$${Math.abs(stats.totalProfit).toLocaleString()}`} color={stats.totalProfit >= 0 ? "emerald" : "rose"} />
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search accounts by name or broker..." className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-3 pl-12 pr-4 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            </div>
            <div className="flex items-center gap-2">
              {(["ALL", "ACTIVE", "ARCHIVED"] as const).map((filter) => (
                <button key={filter} onClick={() => setFilterStatus(filter)} className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${filterStatus === filter ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
                  {filter.charAt(0) + filter.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {feedback ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
            {feedback}
          </div>
        ) : null}

        {filteredAccounts.length === 0 ? (
          <EmptyState onNewAccount={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAccounts.map((account, index) => (
              <AccountCard
                key={account.id}
                account={account}
                delay={index * 0.05}
                onSelect={() => setSelectedAccountId(account.id)}
                onArchive={async () => {
                  setFeedback(null);
                  const res = await fetch(`/api/accounts/${account.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ARCHIVED" }) });
                  const json = (await res.json()) as { message?: string };
                  if (!res.ok) {
                    setFeedback(json.message ?? "Failed to archive account.");
                    return;
                  }
                  if (selectedAccountId === account.id) setSelectedAccountId(null);
                  await loadAccounts();
                }}
                onDelete={async () => {
                  setFeedback(null);
                  const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
                  const json = (await res.json()) as { message?: string };
                  if (!res.ok) {
                    setFeedback(json.message ?? "Failed to delete account.");
                    return;
                  }
                  if (selectedAccountId === account.id) {
                    setSelectedAccountId(null);
                  }
                  await loadAccounts();
                }}
              />
            ))}
          </div>
        )}
      </div>

      <CreateAccountModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={loadAccounts} />
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "emerald" | "rose" | "blue" | "purple";
}) {
  const colors = {
    emerald: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800 dark:text-emerald-300",
    rose: "from-rose-50 to-rose-100 border-rose-200 text-rose-700 dark:from-rose-900/30 dark:to-rose-800/20 dark:border-rose-800 dark:text-rose-300",
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-700 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800 dark:text-blue-300",
    purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-700 dark:from-purple-900/30 dark:to-purple-800/20 dark:border-purple-800 dark:text-purple-300",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border-2 bg-gradient-to-br p-5 ${colors[color]}`}>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</div>
      </div>
      <div className="font-mono text-2xl font-bold">{value}</div>
    </motion.div>
  );
}

function EmptyState({ onNewAccount }: { onNewAccount: () => void }) {
  return (
    <div className="py-20 text-center">
      <div className="mb-6 inline-flex rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:from-emerald-900/30 dark:to-teal-900/20"><Wallet className="h-12 w-12 text-emerald-600 dark:text-emerald-300" /></div>
      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-slate-100">No trading accounts yet</h3>
      <p className="mx-auto mb-8 max-w-md text-gray-600 dark:text-slate-400">Create your first trading account to start tracking your performance across different brokers and challenges</p>
      <button onClick={onNewAccount} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 font-semibold text-white transition-colors hover:bg-emerald-600">
        <Plus className="h-5 w-5" />
        Create First Account
      </button>
    </div>
  );
}
