"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Bot, BriefcaseBusiness, ChevronRight, LayoutDashboard, Menu, NotebookPen, ScrollText, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { AccountMenu } from "@/components/account-menu";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { BrandLogo } from "@/components/brand-logo";
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
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarExpanded = sidebarHovered;
  const sidebarWidthClass = sidebarExpanded ? "lg:grid-cols-[272px_1fr]" : "lg:grid-cols-[88px_1fr]";

  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--background)] transition-colors">
      <div className={cn("mx-auto grid min-h-screen max-w-[1500px] min-w-0 grid-cols-1 gap-3 p-3 transition-[grid-template-columns] duration-300 ease-out sm:gap-4 sm:p-4", sidebarWidthClass)}>
        <div className="sticky top-0 z-40 flex items-center justify-between rounded-xl border border-slate-200 bg-white/90 px-3 py-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/85">
          <BrandLogo />
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
          className="relative hidden overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.94)_46%,rgba(241,245,249,0.92)_100%)] p-3 shadow-[0_18px_50px_-26px_rgba(15,23,42,0.55)] transition-all duration-300 lg:block dark:border-slate-700/70 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.96)_0%,rgba(9,14,32,0.96)_46%,rgba(3,7,18,0.98)_100%)]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(16,185,129,0.04)_100%)] dark:bg-[linear-gradient(180deg,transparent_0%,rgba(16,185,129,0.06)_100%)]" />
          <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl dark:bg-emerald-500/15" />
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-36 w-36 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/10" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-sky-500/15 blur-2xl dark:bg-sky-500/10" />

          <div className={cn("relative mb-5 overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-2.5 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-white/5", sidebarExpanded ? "mx-1" : "mx-0")}>
            <div className={cn("flex items-center", sidebarExpanded ? "justify-between gap-3" : "justify-center")}>
              <BrandLogo iconClassName="h-10 w-10 rounded-2xl shadow-[0_10px_24px_-12px_rgba(16,185,129,0.7)]" className="gap-3" showText={sidebarExpanded} />
              {sidebarExpanded ? (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, x: 8 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                  className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300"
                >
                  Pro
                </motion.div>
              ) : null}
            </div>
            {sidebarExpanded ? (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                className="mt-3 rounded-2xl bg-slate-950 px-3 py-3 text-white dark:bg-white/[0.04]"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Stay sharp today</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300 dark:text-slate-400">
                      Review trades, capture lessons, and keep your edge documented.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>

          <nav className="relative space-y-2">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.href}
                  whileHover={prefersReducedMotion ? undefined : { x: sidebarExpanded ? 4 : 0 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    title={!sidebarExpanded ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center overflow-hidden rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-white/85 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100",
                      sidebarExpanded ? "gap-3" : "justify-center",
                      active &&
                        "bg-[linear-gradient(135deg,#0f172a_0%,#111827_52%,#0f766e_130%)] text-white shadow-[0_14px_28px_-16px_rgba(16,185,129,0.7)] hover:text-white dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.95)_0%,rgba(6,78,59,0.95)_100%)] dark:text-white",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-2xl border border-white/10 bg-white/[0.06]"
                        transition={{ type: "spring", stiffness: 240, damping: 26 }}
                      />
                    ) : null}
                    {!active ? (
                      <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-emerald-500/0 transition-all duration-200 group-hover:bg-emerald-500/80 dark:group-hover:bg-emerald-400/90" />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200",
                        active
                          ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                          : "bg-slate-100 text-slate-600 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-emerald-500/10 dark:group-hover:text-emerald-300",
                      )}
                    >
                      <Icon className={cn("h-4.5 w-4.5", active && "drop-shadow-[0_0_10px_rgba(16,185,129,0.45)]")} />
                    </span>
                    {sidebarExpanded ? (
                      <>
                        <span className="relative z-10 flex-1">
                          <span className={cn("block text-sm font-semibold", active ? "text-white" : "text-slate-900 dark:text-slate-100")}>{item.label}</span>
                          <span className={cn("block text-[11px]", active ? "text-slate-300" : "text-slate-500 dark:text-slate-400")}>
                            {item.label === "Journal"
                              ? "Reflections and lessons"
                              : item.label === "Trades"
                                ? "Execution and review"
                                : item.label === "Dashboard"
                                  ? "Performance overview"
                                  : item.label === "Accounts"
                                    ? "Capital and challenges"
                                    : item.label === "Analytics"
                                      ? "Edge and patterns"
                                      : "Assistant workspace"}
                          </span>
                        </span>
                        <ChevronRight className={cn("relative z-10 h-4 w-4 transition-transform", active ? "translate-x-0 text-white" : "text-slate-400 group-hover:translate-x-0.5")} />
                      </>
                    ) : null}
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
                <BrandLogo />
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
                        "group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100",
                        active &&
                          "bg-[linear-gradient(135deg,#0f172a_0%,#111827_52%,#0f766e_130%)] text-white shadow-[0_14px_28px_-16px_rgba(16,185,129,0.7)] dark:text-white",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                          active ? "bg-white/10" : "bg-slate-100 dark:bg-slate-800",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active && "drop-shadow-[0_0_10px_rgba(16,185,129,0.45)]")} />
                      </span>
                      <span className="flex-1">
                        <span className={cn("block font-semibold", active ? "text-white" : "text-slate-900 dark:text-slate-100")}>{item.label}</span>
                      </span>
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
          <footer className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
              Crafted with 💖 by Nad • Powered by The Alpha Lab • 2026
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
