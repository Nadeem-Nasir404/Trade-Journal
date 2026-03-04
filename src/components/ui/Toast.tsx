"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { toastSlideIn } from "@/components/ui/animations";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
};

type ToastContextValue = {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              variants={toastSlideIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="pointer-events-auto rounded-lg border border-slate-300 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {toast.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> : null}
                  {toast.type === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 text-rose-500" /> : null}
                  {toast.type === "info" ? <AlertCircle className="mt-0.5 h-4 w-4 text-sky-500" /> : null}
                  <div>
                    <p className="text-sm font-semibold">{toast.title}</p>
                    {toast.message ? <p className="text-xs text-slate-500 dark:text-slate-400">{toast.message}</p> : null}
                  </div>
                </div>
                <button type="button" onClick={() => removeToast(toast.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default ToastProvider;
