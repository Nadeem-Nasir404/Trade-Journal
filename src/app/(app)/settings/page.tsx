"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type SyncResponse = {
  imported: number;
  skipped: number;
  totalFetched?: number;
  message?: string;
  details?: {
    httpStatus?: number;
    bybitRetCode?: number | null;
    bybitRetMsg?: string | null;
    baseUrl?: string;
    category?: string;
    limit?: string;
  };
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResponse | null>(null);
  const [error, setError] = useState("");

  async function runBybitSync() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/integrations/bybit/sync", { method: "POST" });
      const contentType = res.headers.get("content-type") || "";
      const json = (contentType.includes("application/json")
        ? await res.json()
        : { message: await res.text() }) as SyncResponse & { error?: string };
      if (!res.ok) {
        const parts = [
          json.message || json.error || "Bybit sync failed.",
          json.details?.bybitRetCode !== undefined ? `retCode: ${json.details.bybitRetCode}` : "",
          json.details?.bybitRetMsg ? `retMsg: ${json.details.bybitRetMsg}` : "",
          json.details?.httpStatus ? `http: ${json.details.httpStatus}` : "",
        ].filter(Boolean);
        setError(parts.join(" | "));
      } else {
        setResult(json);
      }
    } catch {
      setError("Unable to reach sync endpoint.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">Settings</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Connect exchange APIs and sync external trades into your journal.</p>

      <div className="rounded-xl border border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Bybit Integration</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Uses `BYBIT_API_KEY` and `BYBIT_API_SECRET` from server environment variables.
            </p>
          </div>
          <Button type="button" onClick={() => void runBybitSync()} disabled={loading} className="bg-emerald-500 text-white hover:bg-emerald-600">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Syncing..." : "Sync Bybit Trades"}
          </Button>
        </div>

        <div className="grid gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>Optional env: `BYBIT_BASE_URL`, `BYBIT_RECV_WINDOW`, `BYBIT_CATEGORY`, `BYBIT_LIMIT`</p>
          <p>Recommended permissions: Read-only API key.</p>
        </div>

        {result ? (
          <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <p className="inline-flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" />Bybit sync completed</p>
            <p className="mt-1">Imported: {result.imported} | Skipped: {result.skipped} | Fetched: {result.totalFetched ?? 0}</p>
            {result.message ? <p className="mt-1">{result.message}</p> : null}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
