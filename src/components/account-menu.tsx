"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

function initials(name?: string | null, email?: string | null) {
  const base = name?.trim() || email?.trim() || "U";
  const parts = base.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export function AccountMenu() {
  const { data } = useSession();
  const [open, setOpen] = useState(false);

  const name = data?.user?.name ?? "Trader";
  const email = data?.user?.email ?? "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-label="Open account menu"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-slate-950">{initials(name, email)}</span>
        <span className="hidden md:inline">{name}</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-300 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
            <p className="text-sm font-semibold">{name}</p>
            {email ? <p className="text-xs text-slate-500 dark:text-slate-400">{email}</p> : null}
          </div>
          <div className="mt-2 space-y-1">
            <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              <User className="h-4 w-4" /> My Profile
            </Link>
            <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
