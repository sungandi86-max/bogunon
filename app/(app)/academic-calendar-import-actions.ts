"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { markAcademicDuplicates } from "@/lib/academic-calendar-import/duplicates";
import { createAcademicEvent } from "@/lib/academic-calendar-import/event";
import {
  insertAcademicEvents,
  listAcademicSchoolEvents,
} from "@/lib/academic-calendar-import/repository";
import type { AcademicEventInsert } from "@/lib/academic-calendar-import/repository";
import type { AcademicImportItem } from "@/lib/academic-calendar-import/types";

const calendarDate = /^\d{4}-\d{2}-\d{2}$/;
function isCalendarDate(value: string): boolean {
  if (!calendarDate.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}
const calendarDateSchema = z.string().refine(isCalendarDate, { message: "날짜를 확인해 주세요." });
const selectedImportRowSchema = z.object({
  title: z.string().trim().min(1).max(200),
  startDate: calendarDateSchema,
  endDate: calendarDateSchema,
  selected: z.literal(true),
  allowDuplicate: z.boolean(),
}).refine((row) => row.endDate >= row.startDate, { message: "기간을 확인해 주세요." });
const excludedImportRowSchema = z.object({
  title: z.string().max(200),
  startDate: z.string(),
  endDate: z.string(),
  selected: z.literal(false),
  allowDuplicate: z.boolean(),
});
const importRowsSchema = z.array(z.union([selectedImportRowSchema, excludedImportRowSchema])).max(1000);
const duplicateCheckSchema = z.array(z.object({
  id: z.string().max(80),
  sourceRow: z.number().int().min(1).max(100_000),
  rawDate: z.string().max(120),
  title: z.string().max(200),
  startDate: z.string().max(10),
  endDate: z.string().max(10),
  status: z.enum(["ready", "needsReview", "dateError", "missingTitle", "duplicate", "excluded"]),
  selected: z.boolean(),
})).max(1000);

export type AcademicImportPayload = z.infer<typeof importRowsSchema>[number];
export type AcademicImportActionResult = {
  readonly status: "success" | "error";
  readonly message: string;
  readonly inserted: number;
  readonly excluded: number;
  readonly duplicates: number;
  readonly failed: number;
};

export async function checkAcademicDuplicatesAction(input: unknown): Promise<readonly AcademicImportItem[]> {
  const parsed = duplicateCheckSchema.safeParse(input);
  if (!parsed.success) throw new Error("분석한 일정 내용을 다시 확인해 주세요.");
  return markAcademicDuplicates(parsed.data, await listAcademicSchoolEvents());
}

export async function importAcademicCalendarAction(input: unknown): Promise<AcademicImportActionResult> {
  const parsed = importRowsSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "등록할 일정 내용을 다시 확인해 주세요.", inserted: 0, excluded: 0, duplicates: 0, failed: 0 };
  try {
    const selected = parsed.data.filter((row) => row.selected);
    const excluded = parsed.data.length - selected.length;
    const existing = await listAcademicSchoolEvents();
    const candidates = markAcademicDuplicates(selected.map((row, index) => ({
      id: `selected-${index}`, sourceRow: index + 1, rawDate: row.startDate, title: row.title,
      startDate: row.startDate, endDate: row.endDate, status: "ready", selected: true,
    })), existing);
    const allowed = selected.filter((row, index) => candidates[index]?.status !== "duplicate" || row.allowDuplicate);
    const duplicates = selected.length - allowed.length;
    const values: readonly AcademicEventInsert[] = allowed.map((row) => createAcademicEvent(row.title, row.startDate, row.endDate));
    const result = values.length ? await insertAcademicEvents(values) : { inserted: 0, failed: 0 };
    revalidatePath("/calendar");
    revalidatePath("/briefing");
    return {
      status: result.failed ? "error" : "success",
      message: result.failed ? "일부 일정을 등록하지 못했습니다." : "선택한 학사일정을 등록했습니다.",
      inserted: result.inserted,
      excluded,
      duplicates,
      failed: result.failed,
    };
  } catch {
    return { status: "error", message: "학사일정을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.", inserted: 0, excluded: 0, duplicates: 0, failed: 0 };
  }
}
