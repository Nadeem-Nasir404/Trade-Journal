"use client";

import { AnimatePresence, motion } from "framer-motion";

import { tabSlideFade } from "@/components/ui/animations";
import { cn } from "@/lib/utils";

export function AnimatedTabContent({ tabKey, children }: { tabKey: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={tabKey} variants={tabSlideFade} initial="hidden" animate="visible" exit="exit">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function ActiveUnderline({ active }: { active?: boolean }) {
  return (
    <span className="relative block h-0.5 w-full overflow-hidden">
      <motion.span
        className={cn("absolute left-0 top-0 h-0.5 bg-emerald-500", active ? "w-full" : "w-0")}
        layout
        transition={{ duration: 0.2 }}
      />
    </span>
  );
}

export function HoverUnderlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="group inline-flex flex-col text-slate-600 dark:text-slate-300">
      {children}
      <span className="h-0.5 w-0 bg-emerald-500 transition-all duration-200 group-hover:w-full" />
    </a>
  );
}
