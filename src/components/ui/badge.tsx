import * as React from "react";

import { cn } from "@/lib/utils";

function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-slate-300 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
