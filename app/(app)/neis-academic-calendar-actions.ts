"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { markAcademicDuplicates } from "@/lib/academic-calendar-import/duplicates";
import { createAcademicEvent } from "@/lib/academic-calendar-import/event";
import { insertAcademicEvents, listAcademicSchoolEvents, requireAcademicImportUser } from "@/lib/academic-calendar-import/repository";
import { fetchNeisSchedules, NeisClientError, searchNeisSchools } from "@/lib/neis/client";
import { NEIS_OFFICE_CODES } from "@/lib/neis/offices";
import type { NeisPreviewItem, NeisSchool } from "@/lib/neis/types";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function isCalendarDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}
const dateSchema = z.string().refine(isCalendarDate);
const searchSchema = z.object({ query: z.string().trim().max(80), officeCode: z.enum(NEIS_OFFICE_CODES).optional() }).superRefine((value, context) => {
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
  selected: z.boolean(),
})).max(1000);

type ErrorCode = "invalid-input" | "unauthorized" | "missing-key" | "api-error" | "network-error" | "save-error";
type ActionError = { readonly status: "error"; readonly code: ErrorCode; readonly message: string };
export type NeisSchoolSearchResult = ActionError | { readonly status: "success"; readonly schools: readonly NeisSchool[] };
export type NeisScheduleResult = ActionError | { readonly status: "success"; readonly items: readonly NeisPreviewItem[] };
export type NeisImportResult = ActionError | {
  readonly status: "success";
  readonly message: string;
  readonly inserted: number;
  readonly excluded: number;
  readonly duplicates: number;
  readonly failed: number;
};

function actionError(error: unknown, context: "search" | "schedule" | "save"): ActionError {
  if (error instanceof NeisClientError) {
    const messages = {
      "missing-key": "NEIS API 키가 설정되지 않았습니다. 관리자에게 문의해 주세요.",
      "api-error": "NEIS 서비스 오류로 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      "network-error": "NEIS 서비스에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.",
      "invalid-response": "NEIS 응답 형식을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    } as const;
    return { status: "error", code: error.code === "invalid-response" ? "api-error" : error.code, message: messages[error.code] };
  }
  if (error instanceof Error && error.message === "로그인이 필요합니다.") {
    const message = context === "save" ? "로그인 후 학사일정을 저장해 주세요." : context === "schedule" ? "로그인 후 학사일정을 조회해 주세요." : "로그인 후 학교를 검색해 주세요.";
    return { status: "error", code: "unauthorized", message };
  }
  return { status: "error", code: context === "save" ? "save-error" : "api-error", message: context === "save" ? "학사일정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." };
}

export async function searchNeisSchoolsAction(input: unknown): Promise<NeisSchoolSearchResult> {
  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) return { status: "error", code: "invalid-input", message: "교육청을 선택하거나 학교명을 두 글자 이상 입력해 주세요." };
  try {
    await requireAcademicImportUser();
    return { status: "success", schools: await searchNeisSchools({ query: parsed.data.query, ...(parsed.data.officeCode ? { officeCode: parsed.data.officeCode } : {}) }) };
  } catch (error) {
    return actionError(error, "search");
  }
}

export async function loadNeisSchedulesAction(input: unknown): Promise<NeisScheduleResult> {
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return { status: "error", code: "invalid-input", message: "학교와 조회 기간을 다시 확인해 주세요." };
  try {
    await requireAcademicImportUser();
    const schedules = await fetchNeisSchedules(parsed.data);
    const existing = await listAcademicSchoolEvents();
    const marked = markAcademicDuplicates(schedules.map((item, index) => ({
      id: item.id, sourceRow: index + 1, rawDate: item.date, title: item.title,
      startDate: item.date, endDate: item.date, status: "ready", selected: true,
    })), existing);
    return { status: "success", items: schedules.map((item, index) => ({
      ...item,
      status: marked[index]?.status === "duplicate" ? "duplicate" : "ready",
      selected: marked[index]?.selected ?? false,
    })) };
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
    const marked = markAcademicDuplicates(selected.map((item, index) => ({
      id: item.id, sourceRow: index + 1, rawDate: item.date, title: item.title,
      startDate: item.date, endDate: item.date, status: "ready", selected: true,
    })), await listAcademicSchoolEvents());
    const allowed = selected.filter((_, index) => marked[index]?.status !== "duplicate");
    const result = allowed.length ? await insertAcademicEvents(allowed.map((item) => createAcademicEvent(item.title, item.date, item.date))) : { inserted: 0, failed: 0 };
    revalidatePath("/calendar");
    revalidatePath("/briefing");
    return {
      status: "success",
      message: "선택한 NEIS 학사일정을 등록했습니다.",
      inserted: result.inserted,
      excluded: parsed.data.length - selected.length,
      duplicates: selected.length - allowed.length,
      failed: result.failed,
    };
  } catch (error) {
    return actionError(error, "save");
  }
}
