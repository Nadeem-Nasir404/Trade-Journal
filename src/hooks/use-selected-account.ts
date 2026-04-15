"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

const STORAGE_KEY_PREFIX = "selected-trading-account-id";
const EVENT_NAME = "trading-account-change";

export function useSelectedAccount() {
  const { data } = useSession();
  const userId = data?.user?.id ?? "anonymous";
  const storageKey = useMemo(() => `${STORAGE_KEY_PREFIX}:${userId}`, [userId]);
  const [selectedAccountId, setSelectedAccountIdState] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timeoutId = window.setTimeout(() => {
      const stored = window.localStorage.getItem(storageKey);
      const parsed = Number(stored);
      setSelectedAccountIdState(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [storageKey]);

  useEffect(() => {
    const listener = () => {
      const value = window.localStorage.getItem(storageKey);
      const parsed = Number(value);
      setSelectedAccountIdState(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
    };

    window.addEventListener(EVENT_NAME, listener);
    return () => window.removeEventListener(EVENT_NAME, listener);
  }, [storageKey]);

  function setSelectedAccountId(value: number | null) {
    if (value && value > 0) {
      window.localStorage.setItem(storageKey, String(value));
    } else {
      window.localStorage.removeItem(storageKey);
    }
    setSelectedAccountIdState(value);
    window.dispatchEvent(new Event(EVENT_NAME));
  }

  return { selectedAccountId, setSelectedAccountId };
}
