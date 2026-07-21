import { z } from "zod";

import { EXERCISE_RECORD_TYPES } from "@/types/database";

const uuidSchema = z.string().uuid();

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const nullableText = (maximum: number) => z.string().trim().min(1).max(maximum).nullable().optional().transform((value) => value ?? null);
const nullableCount = z.number().int().min(0).max(1000).nullable().optional().transform((value) => value ?? null);

export const exerciseLogInputSchema = z.object({
  stickerId: uuidSchema,
  exerciseDate: z.string().refine(isCalendarDate),
  recordType: z.enum(EXERCISE_RECORD_TYPES),
  durationMinutes: z.number().int().min(1).max(1440).nullable(),
  note: nullableText(500),
}).strict();

export type ExerciseLogInput = z.infer<typeof exerciseLogInputSchema>;

export const lessonReviewInputSchema = z.object({
  exerciseLogId: uuidSchema,
  lessonFocus: nullableText(200),
  learned: nullableText(1000),
  mistakes: nullableText(1000),
  coachFeedback: nullableText(1000),
  nextGoal: nullableText(1000),
  memo: nullableText(2000),
}).strict().refine((value) => [value.lessonFocus, value.learned, value.mistakes, value.coachFeedback, value.nextGoal, value.memo].some((item) => item !== null), {
  message: "레슨 리뷰 내용을 하나 이상 입력해 주세요.",
});

export type LessonReviewInput = z.infer<typeof lessonReviewInputSchema>;

export const competitionReviewInputSchema = z.object({
  exerciseLogId: uuidSchema,
  competitionName: nullableText(200),
  location: nullableText(200),
  eventCategory: nullableText(200),
  grade: nullableText(100),
  partner: nullableText(100),
  totalGames: nullableCount,
  wins: nullableCount,
  losses: nullableCount,
  finalResult: nullableText(200),
  strengths: nullableText(1000),
  improvements: nullableText(1000),
  nextGoal: nullableText(1000),
  memo: nullableText(2000),
}).strict().superRefine((value, context) => {
  const hasContent = [
    value.competitionName, value.location, value.eventCategory, value.grade, value.partner,
    value.totalGames, value.wins, value.losses, value.finalResult, value.strengths,
    value.improvements, value.nextGoal, value.memo,
  ].some((item) => item !== null);
  if (!hasContent) context.addIssue({ code: "custom", message: "대회 리뷰 내용을 하나 이상 입력해 주세요." });
  if ((value.wins !== null || value.losses !== null) && value.totalGames === null) {
    context.addIssue({ code: "custom", message: "승패를 입력하려면 전체 경기 수가 필요합니다." });
  }
  if (value.totalGames !== null && (value.wins ?? 0) + (value.losses ?? 0) > value.totalGames) {
    context.addIssue({ code: "custom", message: "승수와 패수의 합은 전체 경기 수를 넘을 수 없습니다." });
  }
});

export type CompetitionReviewInput = z.infer<typeof competitionReviewInputSchema>;
