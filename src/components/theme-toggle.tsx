"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { mode, toggleMode, mounted } = useThemeMode();

  if (!mounted) {
    return <div className="h-10 w-10" />;
  }

  const isDark = mode === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleMode}
      className={cn(
        "group relative h-10 w-10 overflow-hidden rounded-full border-slate-300 bg-white/80 p-0 backdrop-blur transition-all duration-500 hover:scale-105 hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900/80",
      )}
      aria-label="Toggle theme"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.35),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_70%_30%,rgba(168,85,247,0.35),transparent_60%)]" />
      <Sun
        className={cn(
          "absolute h-4 w-4 text-amber-500 transition-all duration-500",
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 text-sky-300 transition-all duration-500",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
