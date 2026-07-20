"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { normalizeAcademicTitle } from "@/lib/academic-calendar-import/duplicates";
import { createAcademicEvent } from "@/lib/academic-calendar-import/event";
import {
  AcademicImportUnauthorizedError,
  insertAcademicEvents,
  listAcademicSchoolEvents,
  requireAcademicImportUser,
  updateAcademicEventDescriptions,
} from "@/lib/academic-calendar-import/repository";
import { fetchNeisSchedules, NeisClientError, searchNeisSchools } from "@/lib/neis/client";
import { NEIS_OFFICE_CODES } from "@/lib/neis/offices";
import { getDefaultNeisSchool, upsertDefaultNeisSchool } from "@/lib/neis/school-settings";
import type { NeisDefaultSchool, NeisPreviewItem, NeisSchool } from "@/lib/neis/types";
import type { EventRow } from "@/types/database";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

const dateSchema = z.string().refine(isCalendarDate);
const defaultSchoolSchema = z.object({
  officeCode: z.string().trim().min(1).max(20),
  schoolCode: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(100),
  officeName: z.string().trim().min(1).max(100),
});
const searchSchema = z.object({
  query: z.string().trim().max(80),
  officeCode: z.enum(NEIS_OFFICE_CODES).optional(),
}).superRefine((value, context) => {
  if ((value.query.length === 0 && !value.officeCode) || value.query.length === 1) {
    context.addIssue({ code: "custom", message: "교육청을 선택하거나 학교명을 두 글자 이상 입력해 주세요." });
  }
});
const scheduleSchema = z.object({
  officeCode: z.string().min(1).max(20),
  schoolCode: z.string().min(1).max(30),
  schoolName: z.string().min(1).max(100),
  fromDate: dateSchema,
  toDate: dateSchema,
}).refine((value) => value.fromDate <= value.toDate, { message: "조회 기간을 확인해 주세요." }).refine((value) => {
  const from = new Date(`${value.fromDate}T00:00:00Z`).getTime();
  const to = new Date(`${value.toDate}T00:00:00Z`).getTime();
  return to - from <= 370 * 86_400_000;
}, { message: "조회 기간은 1년 이내로 선택해 주세요." });
const saveSchema = z.array(z.object({
  id: z.string().min(1).max(120),
  date: dateSchema,
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(4000).default(""),
  selected: z.boolean(),
})).max(1000);

type ErrorCode = "invalid-input" | "unauthorized" | "missing-key" | "api-error" | "network-error" | "save-error";
type ActionError = { readonly status: "error"; readonly code: ErrorCode; readonly message: string };
type ActionSuccess = { readonly status: "success"; readonly message: string };
export type NeisSchoolSearchResult = ActionError | { readonly status: "success"; readonly schools: readonly NeisSchool[] };
export type NeisDefaultSchoolResult = ActionError | { readonly status: "success"; readonly school: NeisDefaultSchool | null };
export type NeisScheduleResult = ActionError | { readonly status: "success"; readonly items: readonly NeisPreviewItem[] };
export type NeisImportResult = ActionError | {
  readonly status: "success";
  readonly message: string;
  readonly inserted: number;
  readonly updated: number;
  readonly excluded: number;
  readonly duplicates: number;
  readonly failed: number;
};

function actionError(error: unknown, context: "search" | "schedule" | "save" | "settings"): ActionError {
  if (error instanceof NeisClientError) {
    const messages = {
      "missing-key": "NEIS API 키가 설정되지 않았습니다. 관리자에게 문의해 주세요.",
      "api-error": "NEIS 서비스 오류로 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      "network-error": "NEIS 서비스에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.",
      "invalid-response": "NEIS 응답 형식을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    } as const;
    return { status: "error", code: error.code === "invalid-response" ? "api-error" : error.code, message: messages[error.code] };
  }
  const isUnauthorized = error instanceof AcademicImportUnauthorizedError;
  if (isUnauthorized) {
    return { status: "error", code: "unauthorized", message: "로그인 후 NEIS 학사일정을 이용해 주세요." };
  }
  if (context === "save") return { status: "error", code: "save-error", message: "학사일정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  if (context === "settings") return { status: "error", code: "save-error", message: "기본 학교 설정을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  return { status: "error", code: "api-error", message: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." };
}

function scheduleKey(date: string, title: string): string {
  return `${date}|${normalizeAcademicTitle(title)}`;
}

function normalizedContent(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function existingByScheduleKey(events: readonly EventRow[]): Map<string, EventRow> {
  return new Map(events
    .filter((event) => event.area === "schoolSchedule")
    .map((event) => [scheduleKey(event.start_date, event.title), event]));
}

export async function getDefaultNeisSchoolAction(): Promise<NeisDefaultSchoolResult> {
  try {
    return { status: "success", school: await getDefaultNeisSchool() };
  } catch (error) {
    return actionError(error, "settings");
  }
}

export async function saveDefaultNeisSchoolAction(input: unknown): Promise<ActionError | ActionSuccess> {
  const parsed = defaultSchoolSchema.safeParse(input);
  if (!parsed.success) return { status: "error", code: "invalid-input", message: "선택한 학교 정보를 확인해 주세요." };
  try {
    await upsertDefaultNeisSchool(parsed.data);
    return { status: "success", message: "기본 학교를 저장했습니다." };
  } catch (error) {
    return actionError(error, "settings");
  }
}

export async function searchNeisSchoolsAction(input: unknown): Promise<NeisSchoolSearchResult> {
  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) return { status: "error", code: "invalid-input", message: "교육청을 선택하거나 학교명을 두 글자 이상 입력해 주세요." };
  try {
    await requireAcademicImportUser();
    return { status: "success", schools: await searchNeisSchools({
      query: parsed.data.query,
      ...(parsed.data.officeCode ? { officeCode: parsed.data.officeCode } : {}),
    }) };
  } catch (error) {
    return actionError(error, "search");
  }
}

export async function loadNeisSchedulesAction(input: unknown): Promise<NeisScheduleResult> {
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return { status: "error", code: "invalid-input", message: "학교와 조회 기간을 다시 확인해 주세요." };
  try {
    await requireAcademicImportUser();
    const [schedules, existingEvents] = await Promise.all([
      fetchNeisSchedules(parsed.data),
      listAcademicSchoolEvents(),
    ]);
    const existing = existingByScheduleKey(existingEvents);
    const newKeys = new Set<string>();
    const items = schedules.map((item): NeisPreviewItem => {
      const key = scheduleKey(item.date, item.title);
      const current = existing.get(key);
      if (current) {
        const unchanged = normalizedContent(current.description) === normalizedContent(item.content);
        return { ...item, status: unchanged ? "duplicate" : "changed", selected: false };
      }
      if (newKeys.has(key)) return { ...item, status: "duplicate", selected: false };
      newKeys.add(key);
      return { ...item, status: "ready", selected: true };
    });
    return { status: "success", items };
  } catch (error) {
    return actionError(error, "schedule");
  }
}

export async function importNeisAcademicCalendarAction(input: unknown): Promise<NeisImportResult> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { status: "error", code: "invalid-input", message: "저장할 일정을 다시 확인해 주세요." };
  try {
    await requireAcademicImportUser();
    const selected = parsed.data.filter((item) => item.selected);
    const existing = existingByScheduleKey(await listAcademicSchoolEvents());
    const newKeys = new Set<string>();
    const inserts = [];
    const updates: { id: string; description: string | null }[] = [];
    let duplicates = 0;

    for (const item of selected) {
      const key = scheduleKey(item.date, item.title);
      const current = existing.get(key);
      if (current) {
        if (normalizedContent(current.description) === normalizedContent(item.content)) {
          duplicates += 1;
        } else {
          updates.push({ id: current.id, description: item.content || null });
        }
        continue;
      }
      if (newKeys.has(key)) {
        duplicates += 1;
        continue;
      }
      newKeys.add(key);
      inserts.push(createAcademicEvent(item.title, item.date, item.date, item.content || null));
    }

    const insertResult = inserts.length ? await insertAcademicEvents(inserts) : { inserted: 0, failed: 0 };
    const updateResult = updates.length ? await updateAcademicEventDescriptions(updates) : { updated: 0, failed: 0 };
    revalidatePath("/calendar");
    revalidatePath("/briefing");
    return {
      status: "success",
      message: "선택한 NEIS 학사일정을 반영했습니다.",
      inserted: insertResult.inserted,
      updated: updateResult.updated,
      excluded: parsed.data.length - selected.length,
      duplicates,
      failed: insertResult.failed + updateResult.failed,
    };
  } catch (error) {
    return actionError(error, "save");
  }
}
