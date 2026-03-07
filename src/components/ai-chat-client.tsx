"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Brain, Loader2, Send, Sparkles, Target, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSelectedAccount } from "@/hooks/use-selected-account";

type Message = {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
};

export function AiChatClient() {
  const { selectedAccountId } = useSelectedAccount();
  const endRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "I am your trading coach. Ask about risk, strategy, discipline, or recent performance.",
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const suggestedPrompts = [
    { icon: <TrendingUp className="h-4 w-4" />, text: "What's my biggest weakness?", category: "Analysis" },
    { icon: <Brain className="h-4 w-4" />, text: "How do emotions affect my trades?", category: "Psychology" },
    { icon: <Target className="h-4 w-4" />, text: "Which setups should I focus on?", category: "Strategy" },
    { icon: <AlertCircle className="h-4 w-4" />, text: "Am I overtrading?", category: "Risk" },
  ];

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text, timestamp: new Date() }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, accountId: selectedAccountId ?? undefined }),
      });

      const json = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: json.reply ?? "I could not generate a reply.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I had trouble connecting to the coach endpoint. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="min-w-0 overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 px-6 py-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/20 p-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Trading Coach</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Context-aware responses from your trades and journal entries</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="min-h-[340px] max-h-[62vh] flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length <= 1 ? (
            <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-5 py-8 text-center dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
              <div className="mx-auto w-full max-w-2xl">
                <div className="mb-3 inline-flex rounded-full bg-emerald-500/10 p-3">
                  <Brain className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="mb-1 text-xl font-semibold text-slate-900 dark:text-white">Your Personal Trading Coach</h3>
                <p className="mb-5 text-slate-500 dark:text-slate-400">Ask about performance, psychology, and strategy.</p>

                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {suggestedPrompts.map((prompt, idx) => (
                    <motion.button
                      key={prompt.text}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      onClick={() => setInput(prompt.text)}
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-emerald-500/30 dark:hover:bg-slate-900"
                    >
                      <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500 transition-colors group-hover:bg-emerald-500/20">
                        {prompt.icon}
                      </div>
                      <div>
                        <p className="text-xs text-emerald-500">{prompt.category}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{prompt.text}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <MessageBubble key={`${m.role}-${idx}`} message={m} />
            ))
          )}

          {loading ? <LoadingIndicator /> : null}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendMessage();
              }}
              placeholder="Ask about your trading performance..."
              className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              disabled={loading}
            />
            <Button
              onClick={() => void sendMessage()}
              disabled={!input.trim() || loading}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 text-white hover:from-emerald-600 hover:to-teal-700 sm:w-auto"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Quick ask:</span>
            {["Win rate", "Best setup", "Emotional patterns"].map((quick) => (
              <button
                key={quick}
                onClick={() => setInput(`What's my ${quick.toLowerCase()}?`)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {quick}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] rounded-2xl p-4 ${isUser ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white" : "border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}>
        {!isUser ? (
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-500">
            <Sparkles className="h-4 w-4" />
            AI Coach
          </div>
        ) : null}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
        <p className={`mt-2 text-xs ${isUser ? "text-emerald-50/80" : "text-slate-500"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[82%] rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
          AI is analyzing your data...
        </div>
      </div>
    </div>
  );
}
