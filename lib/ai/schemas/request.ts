import { z } from "zod";

export const AiAssistantRequestSchema = z.object({
  input: z.string().trim().min(1).max(1_200),
  context: z.object({
    surface: z.string().trim().min(1).max(64),
    entityId: z.string().trim().min(1).max(128).optional(),
  }).strict().optional(),
  saveHistory: z.boolean().optional().default(false),
}).strict();

export type AiAssistantRequest = z.infer<typeof AiAssistantRequestSchema>;
