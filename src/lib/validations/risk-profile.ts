import { z } from "zod";

export const riskProfileSchema = z.object({
  accountId: z.coerce.number().int().positive(),
  accountType: z.enum(["FUNDED", "PERSONAL"]),
  startingBalance: z.coerce.number().positive(),
  currentBalance: z.coerce.number().positive(),
  maxDailyLoss: z.coerce.number().nonnegative().nullable().optional(),
  maxOverallDrawdown: z.coerce.number().nonnegative().nullable().optional(),
  maxDailyLossType: z.enum(["PERCENTAGE", "FIXED"]).nullable().optional(),
  maxDrawdownType: z.enum(["PERCENTAGE", "FIXED"]).nullable().optional(),
  phase1TargetPct: z.coerce.number().min(0).max(100).nullable().optional(),
  phase2TargetPct: z.coerce.number().min(0).max(100).nullable().optional(),
  personalDailyLossPct: z.coerce.number().min(0).max(100).nullable().optional(),
  customRules: z.array(z.string().trim().min(1).max(240)).max(24).default([]),
});

export type RiskProfileInput = z.infer<typeof riskProfileSchema>;
