import { z } from "zod";

import type { NeisSchedule, NeisScheduleInput, NeisSchool, NeisSchoolSearchInput } from "@/lib/neis/types";

const NEIS_BASE_URL = "https://open.neis.go.kr/hub";
const REQUEST_TIMEOUT_MS = 12_000;

const resultSchema = z.object({ CODE: z.string(), MESSAGE: z.string() });
const resultEnvelopeSchema = z.object({ RESULT: resultSchema });
const schoolRowSchema = z.object({
  ATPT_OFCDC_SC_CODE: z.string(),
  ATPT_OFCDC_SC_NM: z.string(),
  SD_SCHUL_CODE: z.string(),
  SCHUL_NM: z.string(),
  SCHUL_KND_SC_NM: z.string(),
  LCTN_SC_NM: z.string(),
  JU_ORG_NM: z.string().nullish().transform((value) => value ?? undefined),
  ORG_RDNMA: z.string().nullish().transform((value) => value ?? undefined),
  ORG_RDNDA: z.string().nullish().transform((value) => value ?? undefined),
});
const scheduleRowSchema = z.object({
  AA_YMD: z.string().regex(/^\d{8}$/),
  EVENT_NM: z.string(),
  EVENT_CNTNT: z.string().nullish().transform((value) => value ?? ""),
  ONE_GRADE_EVENT_YN: z.string().nullish().transform((value) => value ?? "*"),
  TW_GRADE_EVENT_YN: z.string().nullish().transform((value) => value ?? "*"),
  THREE_GRADE_EVENT_YN: z.string().nullish().transform((value) => value ?? "*"),
  FR_GRADE_EVENT_YN: z.string().nullish().transform((value) => value ?? "*"),
  FIV_GRADE_EVENT_YN: z.string().nullish().transform((value) => value ?? "*"),
  SIX_GRADE_EVENT_YN: z.string().nullish().transform((value) => value ?? "*"),
});
const schoolResponseSchema = z.object({
  RESULT: resultSchema.optional(),
  schoolInfo: z.array(z.union([
    z.object({ head: z.array(z.unknown()) }),
    z.object({ row: z.array(schoolRowSchema) }),
  ])).optional(),
}).refine((value) => value.RESULT !== undefined || value.schoolInfo !== undefined);
const scheduleResponseSchema = z.object({
  RESULT: resultSchema.optional(),
  SchoolSchedule: z.array(z.union([
    z.object({ head: z.array(z.unknown()) }),
    z.object({ row: z.array(scheduleRowSchema) }),
  ])).optional(),
}).refine((value) => value.RESULT !== undefined || value.SchoolSchedule !== undefined);

export type NeisSchoolRow = z.infer<typeof schoolRowSchema>;
export type NeisScheduleRow = z.infer<typeof scheduleRowSchema>;
export type NeisClientErrorCode = "missing-key" | "api-error" | "network-error" | "invalid-response";

export class NeisClientError extends Error {
  readonly code: NeisClientErrorCode;

  constructor(code: NeisClientErrorCode, message: string) {
    super(message);
    this.name = "NeisClientError";
    this.code = code;
  }
}

function apiKey(): string {
  const value = process.env["NEIS_API_KEY"]?.trim();
  if (!value) throw new NeisClientError("missing-key", "NEIS API 키가 설정되지 않았습니다.");
  return value;
}

async function request(path: "schoolInfo" | "SchoolSchedule", params: Readonly<Record<string, string>>): Promise<unknown> {
  const url = new URL(`${NEIS_BASE_URL}/${path}`);
  url.searchParams.set("KEY", apiKey());
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", path === "schoolInfo" ? "50" : "1000");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) throw new NeisClientError("api-error", "NEIS 서비스가 요청을 처리하지 못했습니다.");
    return await response.json();
  } catch (error) {
    if (error instanceof NeisClientError) throw error;
    throw new NeisClientError("network-error", "NEIS 서비스에 연결하지 못했습니다.");
  }
}

function validateResult(result: z.infer<typeof resultSchema> | undefined): void {
  if (!result || result.CODE === "INFO-000" || result.CODE === "INFO-200") return;
  throw new NeisClientError("api-error", "NEIS 서비스에서 오류를 반환했습니다.");
}

function headResult(entries: readonly unknown[]): z.infer<typeof resultSchema> | undefined {
  for (const entry of entries) {
    const parsedHead = z.object({ head: z.array(z.unknown()) }).safeParse(entry);
    if (!parsedHead.success) continue;
    for (const candidate of parsedHead.data.head) {
      const parsed = resultEnvelopeSchema.safeParse(candidate);
      if (parsed.success) return parsed.data.RESULT;
    }
  }
  return undefined;
}

function compactDate(value: string): string {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function gradeLabels(row: NeisScheduleRow): readonly string[] {
  const gradeFlags = [
    ["1학년", row.ONE_GRADE_EVENT_YN],
    ["2학년", row.TW_GRADE_EVENT_YN],
    ["3학년", row.THREE_GRADE_EVENT_YN],
    ["4학년", row.FR_GRADE_EVENT_YN],
    ["5학년", row.FIV_GRADE_EVENT_YN],
    ["6학년", row.SIX_GRADE_EVENT_YN],
  ] as const;
  const applicableGrades = gradeFlags.filter(([, flag]) => flag !== "*");
  const grades = applicableGrades.filter(([, flag]) => flag === "Y").map(([label]) => label);
  return applicableGrades.length > 0 && grades.length === applicableGrades.length ? ["전 학년"] : grades;
}

export async function searchNeisSchools(input: NeisSchoolSearchInput): Promise<readonly NeisSchool[]> {
  const raw = await request("schoolInfo", {
    ...(input.query ? { SCHUL_NM: input.query } : {}),
    ...(input.officeCode ? { ATPT_OFCDC_SC_CODE: input.officeCode } : {}),
  });
  const parsed = schoolResponseSchema.safeParse(raw);
  if (!parsed.success) throw new NeisClientError("invalid-response", "학교 검색 응답을 확인하지 못했습니다.");
  validateResult(parsed.data.RESULT);
  const entries = parsed.data.schoolInfo ?? [];
  validateResult(headResult(entries));
  return entries.flatMap((entry) => "row" in entry ? entry.row : []).map((row) => ({
    officeCode: row.ATPT_OFCDC_SC_CODE,
    schoolCode: row.SD_SCHUL_CODE,
    name: row.SCHUL_NM,
    type: row.SCHUL_KND_SC_NM,
    region: row.LCTN_SC_NM,
    officeName: row.JU_ORG_NM ?? row.ATPT_OFCDC_SC_NM,
    address: row.ORG_RDNMA ?? row.ORG_RDNDA ?? "주소 정보 없음",
  }));
}

export async function fetchNeisSchedules(input: NeisScheduleInput): Promise<readonly NeisSchedule[]> {
  const raw = await request("SchoolSchedule", {
    ATPT_OFCDC_SC_CODE: input.officeCode,
    SD_SCHUL_CODE: input.schoolCode,
    AA_FROM_YMD: input.fromDate.replaceAll("-", ""),
    AA_TO_YMD: input.toDate.replaceAll("-", ""),
  });
  const parsed = scheduleResponseSchema.safeParse(raw);
  if (!parsed.success) throw new NeisClientError("invalid-response", "학사일정 응답을 확인하지 못했습니다.");
  validateResult(parsed.data.RESULT);
  const entries = parsed.data.SchoolSchedule ?? [];
  validateResult(headResult(entries));
  return entries.flatMap((entry) => "row" in entry ? entry.row : []).map((row, index) => ({
    id: `${input.schoolCode}-${row.AA_YMD}-${index}`,
    date: compactDate(row.AA_YMD),
    title: row.EVENT_NM.trim(),
    content: row.EVENT_CNTNT.trim(),
    grades: gradeLabels(row),
  })).filter((item) => item.title.length > 0).sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title, "ko"));
}
