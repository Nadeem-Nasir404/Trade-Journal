"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "selected-trading-account-id";
const EVENT_NAME = "trading-account-change";

export function useSelectedAccount() {
  const [selectedAccountId, setSelectedAccountIdState] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = Number(stored);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  useEffect(() => {
    const listener = () => {
      const value = window.localStorage.getItem(STORAGE_KEY);
      const parsed = Number(value);
      setSelectedAccountIdState(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
    };

    window.addEventListener(EVENT_NAME, listener);
    return () => window.removeEventListener(EVENT_NAME, listener);
  }, []);

  function setSelectedAccountId(value: number | null) {
    if (value && value > 0) {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setSelectedAccountIdState(value);
    window.dispatchEvent(new Event(EVENT_NAME));
  }

  return { selectedAccountId, setSelectedAccountId };
}
