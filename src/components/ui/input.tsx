import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-slate-300/80 bg-white/85 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-500 focus-visible:border-emerald-500/70 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/25 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-emerald-400/60 dark:focus-visible:bg-slate-900 dark:focus-visible:ring-emerald-400/20",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
