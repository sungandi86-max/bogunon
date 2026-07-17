import { z } from "zod";

import type { EventRow, RecurrenceFrequency } from "@/types/database";

const exerciseTypeValues = ["badminton", "walking", "running", "strength", "stretching", "other"] as const;
const exerciseIntensityValues = ["light", "moderate", "strong"] as const;
const exerciseStatusValues = ["planned", "completed", "cancelled"] as const;

export const EXERCISE_TYPES = [
  { value: "badminton", label: "배드민턴" },
  { value: "walking", label: "걷기" },
  { value: "running", label: "러닝" },
  { value: "strength", label: "근력운동" },
  { value: "stretching", label: "스트레칭" },
  { value: "other", label: "기타" },
] as const;

export const EXERCISE_INTENSITIES = [
  { value: "light", label: "가볍게" },
  { value: "moderate", label: "보통" },
  { value: "strong", label: "강하게" },
] as const;

export const EXERCISE_RECURRENCES = [
  { value: "", label: "반복 안 함" },
  { value: "daily", label: "매일" },
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
  { value: "yearly", label: "매년" },
] as const;

export const exerciseTypeSchema = z.enum(exerciseTypeValues);
export const exerciseIntensitySchema = z.enum(exerciseIntensityValues);
export const exerciseStatusSchema = z.enum(exerciseStatusValues);
export type ExerciseType = z.infer<typeof exerciseTypeSchema>;
export type ExerciseIntensity = z.infer<typeof exerciseIntensitySchema>;
export type ExerciseStatus = z.infer<typeof exerciseStatusSchema>;

export const exerciseInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.number().int().min(1).max(1440),
  exerciseType: exerciseTypeSchema,
  intensity: exerciseIntensitySchema,
  location: z.string().trim().max(100),
  memo: z.string().trim().max(1000),
  recurrence: z.enum(["daily", "weekly", "monthly", "yearly"]).nullable(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  status: exerciseStatusSchema,
});

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;

const exerciseMetadataSchema = exerciseInputSchema.pick({
  durationMinutes: true,
  intensity: true,
  location: true,
  recurrence: true,
  status: true,
});

const metadataPrefix = "bogunon:exercise:v1:";

export type ExerciseRecord = ExerciseInput & { readonly event: EventRow; readonly id: string };

function labelForExerciseType(value: ExerciseType): string {
  return EXERCISE_TYPES.find((item) => item.value === value)?.label ?? "기타";
}

function exerciseTypeFromTitle(title: string): ExerciseType {
  return EXERCISE_TYPES.find((item) => item.label === title)?.value ?? "other";
}

function dateText(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function endSchedule(date: string, startTime: string, durationMinutes: number): { readonly date: string; readonly time: string } {
  const [hourText, minuteText] = startTime.split(":");
  const startMinutes = Number(hourText) * 60 + Number(minuteText);
  const total = startMinutes + durationMinutes;
  const endMinutes = total % 1440;
  return { date: addDays(date, Math.floor(total / 1440)), time: `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}` };
}

function fallbackDuration(event: EventRow): number {
  if (!event.start_time || !event.end_time) return 60;
  const start = event.start_time.slice(0, 5).split(":").map(Number);
  const end = event.end_time.slice(0, 5).split(":").map(Number);
  const startMinutes = (start[0] ?? 0) * 60 + (start[1] ?? 0);
  const endMinutes = (end[0] ?? 0) * 60 + (end[1] ?? 0) + (event.end_date > event.start_date ? 1440 : 0);
  return Math.max(1, endMinutes - startMinutes);
}

export function serializeExerciseMetadata(metadata: z.infer<typeof exerciseMetadataSchema>): string {
  return `${metadataPrefix}${JSON.stringify(exerciseMetadataSchema.parse(metadata))}`;
}

function storedMetadata(event: EventRow): z.infer<typeof exerciseMetadataSchema> | null {
  if (!event.description?.startsWith(metadataPrefix)) return null;
  try {
    const parsed = exerciseMetadataSchema.safeParse(JSON.parse(event.description.slice(metadataPrefix.length)));
    return parsed.success ? parsed.data : null;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return null;
  }
}

export function isExerciseRecordEvent(event: EventRow): boolean {
  return event.area === "exercise" && storedMetadata(event) !== null;
}

function metadataFromEvent(event: EventRow): z.infer<typeof exerciseMetadataSchema> {
  return storedMetadata(event) ?? { durationMinutes: fallbackDuration(event), intensity: "moderate", location: "", recurrence: null, status: "planned" };
}

export function exerciseRecordFromEvent(event: EventRow): ExerciseRecord {
  const metadata = metadataFromEvent(event);
  return {
    ...metadata,
    date: event.start_date,
    event,
    exerciseType: exerciseTypeFromTitle(event.title),
    id: event.id,
    memo: event.memo ?? "",
    startTime: event.start_time?.slice(0, 5) ?? "09:00",
  };
}

export function exerciseEventValues(input: ExerciseInput): Omit<EventRow, "id" | "user_id" | "created_at" | "updated_at"> {
  const end = endSchedule(input.date, input.startTime, input.durationMinutes);
  return {
    area: "exercise",
    description: serializeExerciseMetadata(input),
    end_date: end.date,
    end_time: end.time,
    is_all_day: false,
    memo: input.memo || null,
    start_date: input.date,
    start_time: input.startTime,
    title: labelForExerciseType(input.exerciseType),
  };
}

function timeFromInput(input: string): string {
  const match = input.match(/(오전|오후|저녁)?\s*(\d{1,2})(?::(\d{1,2})|시(?!간)(?:\s*(\d{1,2})분)?)/);
  if (!match) return "18:00";
  const period = match[1];
  let hour = Number(match[2]);
  const minute = Number(match[3] ?? match[4] ?? 0);
  if (minute > 59 || (period && (hour < 1 || hour > 12)) || (!period && hour > 23)) return "18:00";
  if (period === "오전" && hour === 12) hour = 0;
  if ((period === "오후" || period === "저녁") && hour < 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function durationFromInput(input: string): number {
  if (/-\s*\d+(?:\.\d+)?\s*(?:시간|분)/.test(input)) return 60;
  const hourMatch = input.match(/(\d+(?:\.\d+)?)\s*시간/);
  if (hourMatch) return Math.max(1, Math.round(Number(hourMatch[1]) * 60));
  const minuteMatch = input.match(/(\d+)\s*분/);
  return minuteMatch ? Math.max(1, Number(minuteMatch[1])) : 60;
}

export type ExerciseQuickInput = Pick<ExerciseInput, "date" | "durationMinutes" | "exerciseType" | "intensity" | "recurrence" | "startTime">;

export function parseExerciseQuickInput(input: string, now = new Date()): ExerciseQuickInput {
  const exerciseType = EXERCISE_TYPES.find((item) => item.value !== "other" && input.includes(item.label))?.value ?? "other";
  const intensity = input.includes("강하게") ? "strong" : input.includes("가볍게") ? "light" : "moderate";
  const recurrence: RecurrenceFrequency | null = input.includes("매일") ? "daily" : input.includes("매주") ? "weekly" : input.includes("매월") ? "monthly" : input.includes("매년") ? "yearly" : null;
  const today = dateText(now);
  return {
    date: input.includes("내일") ? addDays(today, 1) : today,
    durationMinutes: durationFromInput(input),
    exerciseType,
    intensity,
    recurrence,
    startTime: timeFromInput(input),
  };
}

export const exerciseStatusLabels: Readonly<Record<ExerciseStatus, string>> = { planned: "예정", completed: "완료", cancelled: "취소" };
export const exerciseRecurrenceLabels: Readonly<Record<RecurrenceFrequency, string>> = { daily: "매일 반복", weekly: "매주 반복", monthly: "매월 반복", yearly: "매년 반복" };
