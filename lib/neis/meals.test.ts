import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchTodayMeal } from "@/lib/neis/meals";

const school = { officeCode: "B10", schoolCode: "7010198", name: "세화여자고등학교", officeName: "서울특별시교육청" };
const originalApiKey = process.env["NEIS_API_KEY"];

afterEach(() => {
  vi.restoreAllMocks();
  if (originalApiKey === undefined) delete process.env["NEIS_API_KEY"];
  else process.env["NEIS_API_KEY"] = originalApiKey;
});

describe("fetchTodayMeal", () => {
  it("parses a meal row for the requested date", async () => {
    process.env["NEIS_API_KEY"] = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      mealServiceDietInfo: [
        { head: [{ list_total_count: 1 }] },
        { row: [{ MLSV_YMD: "20260904", DDISH_NM: "현미밥<br/>된장국", CAL_INFO: "650 Kcal" }] },
      ],
    }), { status: 200 })));

    await expect(fetchTodayMeal(school, "2026-09-04")).resolves.toEqual({
      status: "ready", date: "2026-09-04", menu: ["현미밥", "된장국"], calories: "650 Kcal",
    });
  });

  it("distinguishes an official no-meal response from a request failure", async () => {
    process.env["NEIS_API_KEY"] = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ RESULT: { CODE: "INFO-200", MESSAGE: "해당하는 데이터가 없습니다." } }), { status: 200 })));
    await expect(fetchTodayMeal(school, "2026-09-03")).resolves.toMatchObject({ status: "empty", reason: "no-meal" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("upstream failure", { status: 503 })));
    await expect(fetchTodayMeal(school, "2026-09-04")).resolves.toMatchObject({ status: "error", reason: "http" });
  });

  it("reports missing credentials and malformed responses separately", async () => {
    delete process.env["NEIS_API_KEY"];
    await expect(fetchTodayMeal(school, "2026-09-04")).resolves.toMatchObject({ status: "error", reason: "missing-api-key" });

    process.env["NEIS_API_KEY"] = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ mealServiceDietInfo: [{ row: [{ DDISH_NM: "누락" }] }] }), { status: 200 })));
    await expect(fetchTodayMeal(school, "2026-09-04")).resolves.toMatchObject({ status: "error", reason: "parse" });
  });
});
