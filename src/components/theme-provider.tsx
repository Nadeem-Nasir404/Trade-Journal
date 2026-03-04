"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("theme-mode");
    const initial: ThemeMode =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    // Theme init must set state once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModeState(initial);
    applyMode(initial);
    setMounted(true);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      mounted,
      setMode: (nextMode) => {
        setModeState(nextMode);
        applyMode(nextMode);
        window.localStorage.setItem("theme-mode", nextMode);
      },
      toggleMode: () => {
        const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";
        setModeState(nextMode);
        applyMode(nextMode);
        window.localStorage.setItem("theme-mode", nextMode);
      },
    }),
    [mode, mounted],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeMode must be used inside ThemeProvider");
  }
  return ctx;
}
