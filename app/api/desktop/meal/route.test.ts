import { beforeEach, describe, expect, it, vi } from "vitest";

import { DesktopBearerUnauthorizedError } from "@/lib/supabase/bearer-server";

const { createDesktopBearerContext, fetchTodayMeal } = vi.hoisted(() => ({
  createDesktopBearerContext: vi.fn(),
  fetchTodayMeal: vi.fn(),
}));

vi.mock("@/lib/supabase/bearer-server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/bearer-server")>();
  return { ...actual, createDesktopBearerContext };
});
vi.mock("@/lib/neis/meals", () => ({ fetchTodayMeal }));

import { GET } from "@/app/api/desktop/meal/route";

const schoolRow = {
  meal_enabled: true,
  neis_office_code: "B10",
  neis_office_name: "서울특별시교육청",
  neis_school_code: "7010198",
  neis_school_name: "세화여자고등학교",
};

function request(date = "2026-09-21", authorization = "Bearer access-token"): Request {
  return new Request(`https://bogunon.example/api/desktop/meal?date=${date}`, {
    headers: { authorization },
  });
}

function createSettingsClient(result: { readonly data: unknown; readonly error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { client: { from }, eq, from, maybeSingle, select };
}

describe("GET /api/desktop/meal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const settings = createSettingsClient({ data: schoolRow, error: null });
    createDesktopBearerContext.mockResolvedValue({ supabase: settings.client, userId: "user-1" });
    fetchTodayMeal.mockResolvedValue({
      calories: "650 Kcal",
      date: "2026-09-21",
      menu: ["현미밥", "된장국"],
      status: "ready",
    });
  });

  it.each(["2026-02-29", "2026-13-01", "2026-09-31", "20260921", "2026-9-21"])(
    "rejects an invalid calendar date: %s",
    async (date) => {
      const response = await GET(request(date));
      expect(response.status).toBe(400);
      expect(createDesktopBearerContext).not.toHaveBeenCalled();
      expect(fetchTodayMeal).not.toHaveBeenCalled();
    },
  );

  it.each([null, "Basic abc", "Bearer bad token"])(
    "returns 401 for missing or invalid bearer authorization",
    async (authorization) => {
      createDesktopBearerContext.mockRejectedValue(new DesktopBearerUnauthorizedError());
      const target = new Request("https://bogunon.example/api/desktop/meal?date=2026-09-21", {
        ...(authorization === null ? {} : { headers: { authorization } }),
      });
      const response = await GET(target);
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        code: "UNAUTHORIZED",
        message: "로그인이 필요합니다.",
        status: "error",
      });
      expect(fetchTodayMeal).not.toHaveBeenCalled();
    },
  );

  it("queries only the verified user's minimal school settings through the bearer client", async () => {
    const settings = createSettingsClient({ data: schoolRow, error: null });
    createDesktopBearerContext.mockResolvedValue({ supabase: settings.client, userId: "user-1" });

    await GET(request());

    expect(settings.from).toHaveBeenCalledWith("user_settings");
    expect(settings.select).toHaveBeenCalledWith(
      "neis_office_code,neis_school_code,neis_school_name,neis_office_name,meal_enabled",
    );
    expect(settings.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it.each([
    null,
    { ...schoolRow, neis_school_code: null },
  ])("returns school-missing without calling NEIS", async (data) => {
    const settings = createSettingsClient({ data, error: null });
    createDesktopBearerContext.mockResolvedValue({ supabase: settings.client, userId: "user-1" });

    const response = await GET(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "school-missing", date: "2026-09-21" });
    expect(fetchTodayMeal).not.toHaveBeenCalled();
  });

  it("returns disabled without calling NEIS", async () => {
    const settings = createSettingsClient({ data: { ...schoolRow, meal_enabled: false }, error: null });
    createDesktopBearerContext.mockResolvedValue({ supabase: settings.client, userId: "user-1" });

    const response = await GET(request());
    await expect(response.json()).resolves.toEqual({
      status: "disabled",
      date: "2026-09-21",
      schoolName: "세화여자고등학교",
    });
    expect(fetchTodayMeal).not.toHaveBeenCalled();
  });

  it("maps a ready meal without exposing authentication or settings data", async () => {
    const response = await GET(request());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      status: "ready",
      date: "2026-09-21",
      schoolName: "세화여자고등학교",
      menu: ["현미밥", "된장국"],
      calories: "650 Kcal",
    });
    expect(fetchTodayMeal).toHaveBeenCalledWith({
      officeCode: "B10",
      officeName: "서울특별시교육청",
      schoolCode: "7010198",
      name: "세화여자고등학교",
    }, "2026-09-21");
    expect(JSON.stringify(payload)).not.toMatch(/access-token|NEIS_API_KEY|user-1|neis_|latitude|address/i);
  });

  it("maps an empty meal", async () => {
    fetchTodayMeal.mockResolvedValue({ status: "empty", date: "2026-09-21", reason: "no-meal" });
    const response = await GET(request());
    await expect(response.json()).resolves.toEqual({
      status: "empty",
      date: "2026-09-21",
      schoolName: "세화여자고등학교",
    });
  });

  it("normalizes a database failure without exposing details", async () => {
    const settings = createSettingsClient({ data: null, error: new Error("private database detail") });
    createDesktopBearerContext.mockResolvedValue({ supabase: settings.client, userId: "user-1" });
    const response = await GET(request());
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      code: "SCHOOL_SETTINGS_ERROR",
      message: "학교 정보를 불러오지 못했습니다.",
    });
  });

  it("normalizes every upstream error to a generic 502 response", async () => {
    fetchTodayMeal.mockResolvedValue({
      status: "error",
      date: "2026-09-21",
      reason: "missing-api-key",
    });
    const response = await GET(request());
    const payload = await response.json();
    expect(response.status).toBe(502);
    expect(payload).toEqual({
      status: "error",
      code: "MEAL_UPSTREAM_ERROR",
      message: "급식 정보를 불러오지 못했습니다.",
    });
    expect(JSON.stringify(payload)).not.toMatch(/missing-api-key|NEIS_API_KEY|access-token/i);
  });
});
