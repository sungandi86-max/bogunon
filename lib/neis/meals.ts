import { z } from "zod";

import type { NeisDefaultSchool } from "@/lib/neis/types";

const NEIS_MEAL_URL = "https://open.neis.go.kr/hub/mealServiceDietInfo";
const REQUEST_TIMEOUT_MS = 12_000;

const resultSchema = z.object({ CODE: z.string(), MESSAGE: z.string() });
const mealRowSchema = z.object({
  MLSV_YMD: z.string(),
  DDISH_NM: z.string(),
  CAL_INFO: z.string().nullish(),
});
const responseSchema = z.object({
  RESULT: resultSchema.optional(),
  mealServiceDietInfo: z.array(z.union([
    z.object({ head: z.array(z.unknown()) }),
    z.object({ row: z.array(mealRowSchema) }),
  ])).optional(),
});

export type MealResult =
  | { readonly status: "ready"; readonly date: string; readonly menu: readonly string[]; readonly calories: string | null }
  | { readonly status: "empty"; readonly date: string; readonly reason?: "no-meal" | "no-row" | "empty-menu" }
  | { readonly status: "error"; readonly date: string; readonly reason?: "missing-api-key" | "http" | "api" | "parse" | "network" };

function cleanMenu(raw: string): readonly string[] {
  return raw
    .replaceAll(/<br\s*\/?>/gi, "\n")
    .replaceAll(/<[^>]+>/g, "")
    .split("\n")
    .map((item) => item.replaceAll(/\s*\([^)]*\d[^)]*\)\s*/g, " ").replaceAll(/\s+\d+(?:\.\d+)*\s*$/g, "").replaceAll(/[^\p{L}\p{N}\s·&+\-]/gu, "").trim())
    .filter(Boolean);
}

function logResponseShape(payload: unknown, school: NeisDefaultSchool, date: string): void {
  if (!payload || typeof payload !== "object") {
    console.info("[neis-meals] response shape", { date, officeCode: school.officeCode, schoolCode: school.schoolCode, resultCode: null, resultMessage: null, hasMealServiceDietInfo: false, sections: [] });
    return;
  }
  const response = payload as Record<string, unknown>;
  const result = response["RESULT"] && typeof response["RESULT"] === "object" ? response["RESULT"] as Record<string, unknown> : null;
  const sections = Array.isArray(response["mealServiceDietInfo"]) ? response["mealServiceDietInfo"] : [];
  const sectionSummaries = sections.map((section) => {
    if (!section || typeof section !== "object") return { hasHead: false, rowCount: 0, rows: [] };
    const entry = section as Record<string, unknown>;
    const rows = Array.isArray(entry["row"]) ? entry["row"] : [];
    return {
      hasHead: Array.isArray(entry["head"]),
      rowCount: rows.length,
      rows: rows.map((row) => {
        if (!row || typeof row !== "object") return { mealCode: null, mealName: null, date: null, schoolName: null, hasMenu: false };
        const meal = row as Record<string, unknown>;
        return {
          mealCode: typeof meal["MMEAL_SC_CODE"] === "string" ? meal["MMEAL_SC_CODE"] : null,
          mealName: typeof meal["MMEAL_SC_NM"] === "string" ? meal["MMEAL_SC_NM"] : null,
          date: typeof meal["MLSV_YMD"] === "string" ? meal["MLSV_YMD"] : null,
          schoolName: typeof meal["SCHUL_NM"] === "string" ? meal["SCHUL_NM"] : null,
          hasMenu: typeof meal["DDISH_NM"] === "string" && meal["DDISH_NM"].trim().length > 0,
        };
      }),
    };
  });
  console.info("[neis-meals] response shape", {
    date,
    officeCode: school.officeCode,
    schoolCode: school.schoolCode,
    resultCode: typeof result?.["CODE"] === "string" ? result["CODE"] : null,
    resultMessage: typeof result?.["MESSAGE"] === "string" ? result["MESSAGE"] : null,
    hasMealServiceDietInfo: Array.isArray(response["mealServiceDietInfo"]),
    sections: sectionSummaries,
  });
}

export async function fetchTodayMeal(school: NeisDefaultSchool, date: string): Promise<MealResult> {
  const apiKey = process.env["NEIS_API_KEY"]?.trim();
  if (!apiKey) {
    console.error("[neis-meals] missing NEIS_API_KEY", { date, officeCode: school.officeCode, schoolCode: school.schoolCode });
    return { status: "error", date, reason: "missing-api-key" };
  }
  const url = new URL(NEIS_MEAL_URL);
  url.searchParams.set("KEY", apiKey);
  url.searchParams.set("Type", "json");
  url.searchParams.set("ATPT_OFCDC_SC_CODE", school.officeCode);
  url.searchParams.set("SD_SCHUL_CODE", school.schoolCode);
  url.searchParams.set("MLSV_YMD", date.replaceAll("-", ""));
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) {
      console.error("[neis-meals] request failed", { date, status: response.status, officeCode: school.officeCode, schoolCode: school.schoolCode });
      return { status: "error", date, reason: "http" };
    }
    const payload: unknown = await response.json();
    logResponseShape(payload, school, date);
    const parsed = responseSchema.safeParse(payload);
    if (!parsed.success) {
      console.error("[neis-meals] response parse failed", { date, issues: parsed.error.issues.map(({ path, message }) => ({ path, message })) });
      return { status: "error", date, reason: "parse" };
    }
    if (parsed.data.RESULT?.CODE === "INFO-200") {
      console.info("[neis-meals] no meal for date", { date, officeCode: school.officeCode, schoolCode: school.schoolCode });
      return { status: "empty", date, reason: "no-meal" };
    }
    if (parsed.data.RESULT && parsed.data.RESULT.CODE !== "INFO-000") {
      console.error("[neis-meals] API returned an error", { date, code: parsed.data.RESULT.CODE, message: parsed.data.RESULT.MESSAGE });
      return { status: "error", date, reason: "api" };
    }
    const row = parsed.data.mealServiceDietInfo?.flatMap((entry) => "row" in entry ? entry.row : [])[0];
    if (!row) {
      console.info("[neis-meals] response contained no meal row", { date, officeCode: school.officeCode, schoolCode: school.schoolCode });
      return { status: "empty", date, reason: "no-row" };
    }
    const menu = cleanMenu(row.DDISH_NM);
    if (menu.length > 0) return { status: "ready", date, menu, calories: row.CAL_INFO?.trim() || null };
    console.info("[neis-meals] meal row contained no menu", { date, officeCode: school.officeCode, schoolCode: school.schoolCode });
    return { status: "empty", date, reason: "empty-menu" };
  } catch (error) {
    if (error instanceof Error) {
      console.error("[neis-meals] request exception", { date, name: error.name, message: error.message });
      return { status: "error", date, reason: "network" };
    }
    throw error;
  }
}
