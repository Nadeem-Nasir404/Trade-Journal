import { z } from "zod";

export const journalEntrySchema = z.object({
  userId: z.string().trim().optional().or(z.literal("")),
  entryDate: z.coerce.date(),
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(1).max(8000),
  imageUrl: z
    .string()
    .trim()
    .max(4_000_000)
    .optional()
    .or(z.literal("")),
  mood: z.string().trim().max(80).optional().or(z.literal("")),
  tags: z.string().trim().max(240).optional().or(z.literal("")),
  strategyTags: z.string().trim().max(400).optional().or(z.literal("")),
  preTradeMood: z.string().trim().max(80).optional().or(z.literal("")),
  executionQuality: z.string().trim().max(80).optional().or(z.literal("")),
  score: z.coerce.number().int().min(1).max(10).optional().nullable(),
  linkedTradeIds: z.array(z.coerce.number().int().positive()).optional().default([]),
});

export const journalFiltersSchema = z.object({
  q: z.string().trim().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  maxEntries: z.coerce.number().int().positive().max(300).optional(),
});
