"use client";

import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  iconClassName,
  showText = true,
}: {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20", iconClassName)}>
        <svg className="h-5 w-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
        </svg>
      </div>
      {showText ? <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">Alpha Journal</span> : null}
    </div>
  );
}
