import { z } from "zod";

import { StudentRecordAiResponseSchema } from "@/lib/ai/prompts/student-record";
import { AiConnectionInputSchema, AiProviderIdSchema } from "@/lib/ai/types";

export const AI_WRITING_TONES = [
  { value: "objective", label: "객관적이고 구체적으로" },
  { value: "growth", label: "긍정적이고 성장 중심으로" },
  { value: "concise", label: "간결하게" },
] as const;

export const AI_DOCUMENT_LENGTHS = [
  { value: "short", label: "짧게", instruction: "핵심만 담아 2~3문장으로 작성" },
  { value: "normal", label: "보통", instruction: "핵심 근거를 담아 4~6문장으로 작성" },
  {
    value: "within-1500-bytes",
    label: "1500바이트 이내",
    instruction: "UTF-8 기준 1500바이트 이내를 목표로 작성",
  },
] as const;

export const MAX_ACTIVITY_REPORT_CHARACTERS = 15_000;
export const MAX_ADDITIONAL_RECORD_CHARACTERS = 3_000;

const toneValues = ["objective", "growth", "concise"] as const;
const lengthValues = ["short", "normal", "within-1500-bytes"] as const;

export const SchoolRecordGuidelineInputSchema = z.object({
  academicYear: z.string().regex(/^\d{4}$/),
  schoolLevel: z.literal("고등학교"),
  sourceType: z.enum(["guide", "correction", "supplement"]),
  text: z.string().trim().min(1).max(100_000),
}).strict();

export const AiDocumentWriterRequestSchema = z.object({
  studentId: z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9_-]+$/),
  activityReport: z.string().trim().min(1).max(MAX_ACTIVITY_REPORT_CHARACTERS),
  additionalRecord: z.string().max(MAX_ADDITIONAL_RECORD_CHARACTERS),
  tone: z.enum(toneValues),
  length: z.enum(lengthValues),
  privacyConfirmed: z.literal(true),
  guideline: SchoolRecordGuidelineInputSchema.nullable(),
}).strict();

export const AiDocumentWriterApiRequestSchema = z.object({
  connection: AiConnectionInputSchema,
  document: AiDocumentWriterRequestSchema,
}).strict();

export const AiDocumentWriterResponseSchema = StudentRecordAiResponseSchema;

export type AiDocumentWriterRequest = z.infer<typeof AiDocumentWriterRequestSchema>;
export type AiDocumentWriterResponse = z.infer<typeof AiDocumentWriterResponseSchema>;

export const AiDocumentWriterResultSchema = AiDocumentWriterResponseSchema.extend({
  mode: AiProviderIdSchema,
}).strict();

export type AiDocumentWriterResult = z.infer<typeof AiDocumentWriterResultSchema>;

export function countUtf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function countCharacters(value: string): number {
  return Array.from(value).length;
}
