"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type FormErrors = {
  email?: string;
  password?: string;
  root?: string;
};

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const tradingSymbols = ["BTCUSD", "ETHUSD", "AAPL", "EURUSD", "NVDA"];

  function validateForm() {
    const next: FormErrors = {};
    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      next.email = "Email is invalid";
    }

    if (!password.trim()) {
      next.password = "Password is required";
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setIsLoading(false);

    if (result?.error) {
      setErrors({ root: "Invalid email or password. Demo: demo@tradejournal.app / demo123" });
      return;
    }

    router.push("/dashboard");
  }

  async function handleGoogleLogin() {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 p-4">
      <motion.div
        className="absolute left-[6%] top-[10%] h-[52vw] w-[52vw] max-h-[420px] max-w-[420px] rounded-full bg-emerald-500/20 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3], x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[8%] right-[4%] h-[64vw] w-[64vw] max-h-[560px] max-w-[560px] rounded-full bg-teal-500/15 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2], x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="absolute left-0 right-0 top-5 z-10 hidden justify-center gap-2 px-4 sm:flex md:gap-3">
        {tradingSymbols.map((symbol, index) => (
          <motion.div
            key={symbol}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="cursor-default rounded-full border border-slate-700/50 bg-slate-800/60 px-3 py-1.5 text-[11px] font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:bg-slate-800/80 md:px-4 md:py-2 md:text-xs"
          >
            {symbol}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md pt-6 sm:pt-10"
      >
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 p-5 shadow-2xl backdrop-blur-2xl sm:rounded-3xl sm:p-8 md:p-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="mb-6 text-center">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <svg className="h-10 w-10 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">TradeJournal</h1>
            <p className="mb-4 text-sm text-slate-400">Track performance and sharpen your edge</p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2"
            >
              <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-semibold text-emerald-400">Trusted by 2,300+ active traders</span>
            </motion.div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onClick={() => void handleGoogleLogin()}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 font-semibold text-slate-900 shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {isLoading ? "Connecting..." : "Continue with Google"}
          </motion.button>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }} className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700" /></div>
            <div className="relative flex justify-center text-sm"><span className="bg-slate-900/70 px-4 text-slate-500">OR USE EMAIL</span></div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined, root: undefined }));
                }}
                className="w-full rounded-xl border-2 border-slate-700 bg-slate-800/50 px-4 py-3.5 text-white placeholder-slate-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="you@example.com"
              />
              {errors.email ? <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-sm text-red-400">{errors.email}</motion.p> : null}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }}>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined, root: undefined }));
                }}
                className="w-full rounded-xl border-2 border-slate-700 bg-slate-800/50 px-4 py-3.5 text-white placeholder-slate-500 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your password"
              />
              {errors.password ? <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-sm text-red-400">{errors.password}</motion.p> : null}
            </motion.div>

            {errors.root ? <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-rose-400">{errors.root}</motion.p> : null}

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </motion.button>
          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }} className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-slate-700/50 pt-6 sm:gap-6">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs text-slate-400">Live KPIs</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs text-slate-400">Secure Auth</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-slate-400">Analytics</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
