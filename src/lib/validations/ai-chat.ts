import { z } from "zod";

export const aiChatSchema = z.object({
  message: z.string().trim().min(2).max(2000),
  accountId: z.coerce.number().int().positive().optional().nullable(),
});
