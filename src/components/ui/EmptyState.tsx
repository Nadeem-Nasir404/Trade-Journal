"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  variant?: "no-trades" | "no-results";
  className?: string;
};

function EmptyIllustration({ variant }: { variant: "no-trades" | "no-results" }) {
  return (
    <svg viewBox="0 0 240 140" className="h-36 w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="24" width="200" height="92" rx="12" className="fill-slate-100 dark:fill-slate-800" />
      <rect x="34" y="38" width="52" height="10" rx="5" className="fill-slate-300 dark:fill-slate-600" />
      <rect x="34" y="58" width="172" height="44" rx="8" className="fill-white dark:fill-slate-900" />
      {variant === "no-trades" ? (
        <>
          <path d="M70 90 L104 72 L136 86 L170 64" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="170" cy="64" r="5" fill="#10B981" />
        </>
      ) : (
        <>
          <circle cx="120" cy="78" r="18" stroke="#64748B" strokeWidth="4" />
          <path d="M134 92 L152 108" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function EmptyState({
  title = "No trades yet",
  description = "Start tracking your executions to unlock analytics, calendar insights, and behavioral coaching.",
  ctaLabel = "Start trading",
  onCta,
  variant = "no-trades",
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900", className)}
    >
      <EmptyIllustration variant={variant} />
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-4 flex justify-center">
        <Button onClick={onCta} className="bg-emerald-600 hover:bg-emerald-500">
          <BarChart3 className="h-4 w-4" />
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export default EmptyState;
