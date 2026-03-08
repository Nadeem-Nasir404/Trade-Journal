"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Bot, BookOpenText, BriefcaseBusiness, LayoutDashboard, Menu, NotebookPen, PanelLeftClose, PanelLeftOpen, ScrollText, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { AccountMenu } from "@/components/account-menu";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/trades", label: "Trades", icon: ScrollText },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: BriefcaseBusiness },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ai-chat", label: "AI Chat", icon: Bot },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarExpanded = !collapsed || sidebarHovered;

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    // Persisted UI preference hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(saved === "1");
  }, []);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--background)] transition-colors">
      <div className={cn("mx-auto grid min-h-screen max-w-[1500px] min-w-0 grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4", sidebarExpanded ? "lg:grid-cols-[248px_1fr]" : "lg:grid-cols-[78px_1fr]")}>
        <div className="sticky top-0 z-40 flex items-center justify-between rounded-xl border border-slate-200 bg-white/90 px-3 py-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/85">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-slate-900/5 p-1.5 dark:bg-white/5">
              <BookOpenText className="h-4 w-4 text-slate-800 dark:text-slate-100" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Alpha Journal</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <motion.aside
          initial={prefersReducedMotion ? false : { opacity: 0, x: -16 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          className="relative hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-slate-50 to-slate-100/70 p-3 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.5)] transition-colors lg:block dark:border-slate-700/70 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
        >
          <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl dark:bg-emerald-500/15" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-sky-500/15 blur-2xl dark:bg-sky-500/10" />

          <div className={cn("relative mb-6 flex items-center px-2", sidebarExpanded ? "justify-between" : "justify-center")}>
            <div className={cn("flex items-center gap-2.5", !sidebarExpanded && "justify-center")}>
              <div className="rounded-lg bg-slate-900/5 p-1.5 dark:bg-white/5">
                <BookOpenText className="h-4.5 w-4.5 text-slate-800 dark:text-slate-100" />
              </div>
              {sidebarExpanded ? <p className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">Alpha Journal</p> : null}
            </div>
            {sidebarExpanded ? (
              <button
                type="button"
                onClick={toggleSidebar}
                className="rounded-lg border border-slate-200/70 bg-white/60 p-1.5 text-slate-500 backdrop-blur transition hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {!sidebarExpanded ? (
            <div className="relative mb-3 flex justify-center">
              <button
                type="button"
                onClick={toggleSidebar}
                className="rounded-lg border border-slate-200/70 bg-white/60 p-1.5 text-slate-500 backdrop-blur transition hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <nav className="relative space-y-1.5">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <motion.div key={item.href} whileHover={prefersReducedMotion ? undefined : { x: 2 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100",
                      sidebarExpanded ? "gap-2" : "justify-center",
                      active &&
                        "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-[0_8px_20px_-12px_rgba(2,132,199,0.7)] hover:from-slate-900 hover:to-slate-800 dark:from-slate-100 dark:to-white dark:text-slate-900 dark:hover:from-slate-100 dark:hover:to-white",
                    )}
                  >
                    {sidebarExpanded && !active ? (
                      <span className="absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 rounded-r bg-emerald-500 opacity-0 transition-all duration-200 group-hover:h-5 group-hover:opacity-100 dark:bg-emerald-400" />
                    ) : null}
                    <Icon className={cn("h-4 w-4 shrink-0", active && "drop-shadow-[0_0_10px_rgba(16,185,129,0.45)]")} />
                    {sidebarExpanded ? item.label : null}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </motion.aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu overlay"
              className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={prefersReducedMotion ? false : { x: -24, opacity: 0 }}
              animate={prefersReducedMotion ? undefined : { x: 0, opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { x: -24, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute left-0 top-0 h-full w-[86vw] max-w-[320px] overflow-y-auto border-r border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 p-3 dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
            >
              <div className="mb-5 flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-slate-900/5 p-1.5 dark:bg-white/5">
                    <BookOpenText className="h-4.5 w-4.5 text-slate-800 dark:text-slate-100" />
                  </div>
                  <p className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">Alpha Journal</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {nav.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100",
                        active &&
                          "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-[0_8px_20px_-12px_rgba(2,132,199,0.7)] dark:from-slate-100 dark:to-white dark:text-slate-900",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active && "drop-shadow-[0_0_10px_rgba(16,185,129,0.45)]")} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </div>
        ) : null}

        <main className="min-w-0 overflow-x-hidden rounded-2xl border border-slate-300 bg-white p-3 shadow-sm transition-colors sm:p-4 dark:border-slate-700 dark:bg-slate-900 lg:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2 border-b border-slate-200 pb-3 dark:border-slate-800 sm:mb-5 sm:pb-4">
            <AccountSwitcher />
            <ThemeToggle />
            <AccountMenu />
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
