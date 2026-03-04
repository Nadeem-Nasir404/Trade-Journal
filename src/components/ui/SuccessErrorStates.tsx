"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { errorShake } from "@/components/ui/animations";
import { cn } from "@/lib/utils";

export function SuccessCheckmark({ label = "Saved" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600">
      <motion.div
        className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 22 }}
      >
        <Check className="h-3 w-3" />
      </motion.div>
      {label}
    </div>
  );
}

export function ErrorShake({ children, trigger }: { children: React.ReactNode; trigger: boolean }) {
  return (
    <motion.div variants={errorShake} initial="idle" animate={trigger ? "shake" : "idle"}>
      {children}
    </motion.div>
  );
}

export function InvalidGlow({ invalid, children }: { invalid?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn(invalid ? "rounded-md ring-2 ring-rose-500/70 shadow-[0_0_0_4px_rgba(244,63,94,0.15)]" : "")}>{children}</div>
  );
}
