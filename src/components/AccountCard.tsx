"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Target,
  Shield,
} from "lucide-react";

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

const statusConfig = {
  ACTIVE: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Active" },
  PAUSED: { bg: "bg-amber-100", text: "text-amber-700", label: "Paused" },
  COMPLETED: { bg: "bg-blue-100", text: "text-blue-700", label: "Passed" },
  FAILED: { bg: "bg-rose-100", text: "text-rose-700", label: "Failed" },
  ARCHIVED: { bg: "bg-gray-100", text: "text-gray-700", label: "Archived" },
} as const;

const typeConfig = {
  PERSONAL: { icon: "\u{1F4B0}", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", label: "Personal" },
  FUNDED: { icon: "\u{1F3C6}", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", label: "Funded" },
  DEMO: { icon: "\u{1F4DD}", bg: "bg-gray-100 dark:bg-slate-800", text: "text-gray-700 dark:text-slate-200", label: "Demo" },
  PROP_FIRM: { icon: "\u{1F3E2}", bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300", label: "Prop Firm" },
} as const;

export function AccountCard({
  account,
  delay = 0,
  onEdit,
  onDelete,
  onSelect,
  onArchive,
}: {
  account: Account;
  delay?: number;
  onEdit?: () => void;
  onDelete: () => void;
  onSelect: () => void;
  onArchive?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const profit = account.currentBalance - account.startingBalance;
  const profitPercent = account.startingBalance > 0 ? (profit / account.startingBalance) * 100 : 0;
  const isProfitable = profit >= 0;

  const profitProgress = account.profitTarget ? Math.min((profit / account.profitTarget) * 100, 100) : null;
  const drawdown = account.startingBalance - account.currentBalance;
  const drawdownProgress =
    account.maxOverallDrawdown && account.maxOverallDrawdown > 0
      ? Math.min((Math.abs(drawdown) / account.maxOverallDrawdown) * 100, 100)
      : null;

  const status = statusConfig[account.status];
  const type = typeConfig[account.accountType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      onClick={onSelect}
      className="cursor-pointer rounded-2xl border-2 border-gray-200 bg-white transition-all hover:border-emerald-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500/60"
    >
      <div className="border-b border-gray-100 p-5 dark:border-slate-700">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{account.icon || type.icon}</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-slate-100">{account.name}</h3>
              {account.broker ? <p className="text-sm text-gray-500 dark:text-slate-400">{account.broker}</p> : null}
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((v) => !v);
              }}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <MoreVertical className="h-4 w-4 text-gray-400 dark:text-slate-400" />
            </button>

            {showMenu ? (
              <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-xl border border-gray-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                {onEdit ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Account
                  </button>
                ) : null}
                {onArchive ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Edit className="h-4 w-4" />
                    Archive Account
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>{status.label}</span>
          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${type.bg} ${type.text}`}>{type.label}</span>
          {account.platform ? <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-slate-800 dark:text-slate-300">{account.platform}</span> : null}
        </div>
      </div>

      <div className="border-b border-gray-100 p-5 dark:border-slate-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1 text-xs text-gray-500 dark:text-slate-400">Current Balance</div>
            <div className="font-mono text-2xl font-bold text-gray-900 dark:text-slate-100">{account.currency === "USD" ? "$" : ""}{account.currentBalance.toLocaleString()}</div>
          </div>
          <div>
            <div className="mb-1 text-xs text-gray-500 dark:text-slate-400">Profit/Loss</div>
            <div className={`font-mono text-2xl font-bold ${isProfitable ? "text-emerald-600" : "text-rose-600"}`}>
              {isProfitable ? "+" : ""}{account.currency === "USD" ? "$" : ""}{Math.abs(profit).toLocaleString()}
            </div>
            <div className={`text-xs font-semibold ${isProfitable ? "text-emerald-600" : "text-rose-600"}`}>
              {isProfitable ? "+" : ""}{profitPercent.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {account.accountType === "FUNDED" ? (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 dark:from-purple-900/20 dark:to-pink-900/20">
          {account.profitTarget ? (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">Profit Target</span>
                </div>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">${profit.toLocaleString()} / ${account.profitTarget.toLocaleString()}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-slate-800">
                <div className={`h-full transition-all ${profitProgress && profitProgress >= 100 ? "bg-emerald-500" : "bg-purple-500"}`} style={{ width: `${profitProgress ?? 0}%` }} />
              </div>
              {profitProgress && profitProgress >= 100 ? (
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="font-semibold">Target Reached!</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {account.maxOverallDrawdown ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-rose-600" />
                  <span className="text-xs font-semibold text-rose-900 dark:text-rose-200">Max Drawdown</span>
                </div>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">${Math.abs(drawdown).toLocaleString()} / ${account.maxOverallDrawdown.toLocaleString()}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-slate-800">
                <div
                  className={`h-full transition-all ${
                    (drawdownProgress ?? 0) >= 100 ? "bg-rose-500" : (drawdownProgress ?? 0) >= 80 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${drawdownProgress ?? 0}%` }}
                />
              </div>
              {(drawdownProgress ?? 0) >= 80 ? (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-semibold">Approaching Limit ({(drawdownProgress ?? 0).toFixed(0)}%)</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 text-center dark:bg-slate-800/60">
        <div>
          <div className="mb-1 text-xs text-gray-500 dark:text-slate-400">Starting</div>
          <div className="font-mono text-sm font-bold text-gray-700 dark:text-slate-200">${account.startingBalance.toLocaleString()}</div>
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500 dark:text-slate-400">ROI</div>
          <div className={`font-mono text-sm font-bold ${isProfitable ? "text-emerald-600" : "text-rose-600"}`}>{isProfitable ? "+" : ""}{profitPercent.toFixed(2)}%</div>
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500 dark:text-slate-400">Currency</div>
          <div className="text-sm font-bold text-gray-700 dark:text-slate-200">{account.currency}</div>
        </div>
      </div>
    </motion.div>
  );
}
