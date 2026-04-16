"use client";

import { BookOpenCheck, Plus, Shield, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  customRules: string[];
  builtInRules: string[];
  draftRule: string;
  onDraftRuleChange: (value: string) => void;
  onAddRule: () => void;
  onUpdateRule: (index: number, value: string) => void;
  onDeleteRule: (index: number) => void;
};

export function RulesTab({ customRules, builtInRules, draftRule, onDraftRuleChange, onAddRule, onUpdateRule, onDeleteRule }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="overflow-hidden rounded-[24px] border-slate-200/80 bg-white/90 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
        <CardHeader className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
          <CardTitle className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-emerald-500" /> Your Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customRules.map((rule, index) => (
            <div key={`${index}-${rule.slice(0, 12)}`} className="flex items-start gap-2">
              <Textarea className="min-h-[90px]" value={rule} onChange={(e) => onUpdateRule(index, e.target.value)} />
              <Button type="button" variant="outline" size="sm" onClick={() => onDeleteRule(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <Input placeholder="Add a custom rule" value={draftRule} onChange={(e) => onDraftRuleChange(e.target.value)} />
            <Button type="button" onClick={onAddRule}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[24px] border-slate-200/80 bg-white/90 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
        <CardHeader className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
          <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4 text-sky-500" /> Built-In Guidance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {builtInRules.map((rule) => (
            <div key={rule} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
              {rule}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
