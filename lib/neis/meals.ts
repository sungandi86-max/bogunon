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
  | { readonly status: "empty"; readonly date: string }
  | { readonly status: "error"; readonly date: string };

function cleanMenu(raw: string): readonly string[] {
  return raw
    .replaceAll(/<br\s*\/?>/gi, "\n")
    .replaceAll(/<[^>]+>/g, "")
    .split("\n")
    .map((item) => item.replaceAll(/\s*\([^)]*\d[^)]*\)\s*/g, " ").replaceAll(/\s+\d+(?:\.\d+)*\s*$/g, "").replaceAll(/[^\p{L}\p{N}\s·&+\-]/gu, "").trim())
    .filter(Boolean);
}

export async function fetchTodayMeal(school: NeisDefaultSchool, date: string): Promise<MealResult> {
  const apiKey = process.env["NEIS_API_KEY"]?.trim();
  if (!apiKey) return { status: "error", date };
  const url = new URL(NEIS_MEAL_URL);
  url.searchParams.set("KEY", apiKey);
  url.searchParams.set("Type", "json");
  url.searchParams.set("ATPT_OFCDC_SC_CODE", school.officeCode);
  url.searchParams.set("SD_SCHUL_CODE", school.schoolCode);
  url.searchParams.set("MLSV_YMD", date.replaceAll("-", ""));
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) return { status: "error", date };
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) return { status: "error", date };
    if (parsed.data.RESULT?.CODE === "INFO-200") return { status: "empty", date };
    if (parsed.data.RESULT && parsed.data.RESULT.CODE !== "INFO-000") return { status: "error", date };
    const row = parsed.data.mealServiceDietInfo?.flatMap((entry) => "row" in entry ? entry.row : [])[0];
    if (!row) return { status: "empty", date };
    const menu = cleanMenu(row.DDISH_NM);
    return menu.length > 0
      ? { status: "ready", date, menu, calories: row.CAL_INFO?.trim() || null }
      : { status: "empty", date };
  } catch (error) {
    if (error instanceof Error) return { status: "error", date };
    throw error;
  }
}
