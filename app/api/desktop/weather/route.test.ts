import { beforeEach, describe, expect, it, vi } from "vitest";

import { DesktopBearerUnauthorizedError } from "@/lib/supabase/bearer-server";
import { WeatherProviderError } from "@/lib/weather/providers/open-meteo";

const { createDesktopBearerContext, fetchCurrentWeather, resolveSchoolLocation } = vi.hoisted(() => ({
  createDesktopBearerContext: vi.fn(),
  fetchCurrentWeather: vi.fn(),
  resolveSchoolLocation: vi.fn(),
}));

vi.mock("@/lib/supabase/bearer-server", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/supabase/bearer-server")>(),
  createDesktopBearerContext,
}));
vi.mock("@/lib/weather/gateway", () => ({ fetchCurrentWeather }));
vi.mock("@/lib/weather/school-location", () => ({ resolveSchoolLocation }));

import { GET } from "@/app/api/desktop/weather/route";

const schoolRow = {
  neis_address: "서울특별시 서초구 신반포로 56-7",
  neis_region: "서울특별시",
  neis_school_code: "7010198",
  neis_school_name: "세화여자고등학교",
  school_latitude: 37.5,
  school_longitude: 127,
  weather_enabled: true,
};

function createSettingsClient(result: { readonly data: unknown; readonly error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { client: { from }, eq, from, select };
}

const request = (authorization: string | null = "Bearer access-token") => new Request(
  "https://bogunon.example/api/desktop/weather",
  authorization === null ? {} : { headers: { authorization } },
);

describe("GET /api/desktop/weather", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const settings = createSettingsClient({ data: schoolRow, error: null });
    createDesktopBearerContext.mockResolvedValue({ supabase: settings.client, userId: "user-1" });
    resolveSchoolLocation.mockResolvedValue({ latitude: 37.5, longitude: 127 });
    fetchCurrentWeather.mockResolvedValue({
      apparentTemperatureC: 22.1,
      conditionLabel: "대체로 맑음",
      highC: 26.5,
      lowC: 18.2,
      observedAt: "2026-09-21T14:15",
      temperatureC: 23.4,
      weatherCode: 2,
    });
  });

  it.each([null, "Basic token", "Bearer bad token"])("returns 401 for invalid authorization", async (authorization) => {
    createDesktopBearerContext.mockRejectedValue(new DesktopBearerUnauthorizedError());
    const response = await GET(request(authorization));
    expect(response.status).toBe(401);
    expect(resolveSchoolLocation).not.toHaveBeenCalled();
    expect(fetchCurrentWeather).not.toHaveBeenCalled();
  });

  it("queries only the verified user's minimal school settings", async () => {
    const settings = createSettingsClient({ data: schoolRow, error: null });
    createDesktopBearerContext.mockResolvedValue({ supabase: settings.client, userId: "user-1" });
    await GET(request());
    expect(settings.from).toHaveBeenCalledWith("user_settings");
    expect(settings.select).toHaveBeenCalledWith(
      "neis_school_code,neis_school_name,neis_region,neis_address,school_latitude,school_longitude,weather_enabled",
    );
    expect(settings.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns school-missing without resolving a location", async () => {
    const settings = createSettingsClient({ data: null, error: null });
    createDesktopBearerContext.mockResolvedValue({ supabase: settings.client, userId: "user-1" });
    const response = await GET(request());
    await expect(response.json()).resolves.toEqual({ status: "school-missing" });
    expect(resolveSchoolLocation).not.toHaveBeenCalled();
  });

  it("returns disabled without calling providers", async () => {
    const settings = createSettingsClient({ data: { ...schoolRow, weather_enabled: false }, error: null });
    createDesktopBearerContext.mockResolvedValue({ supabase: settings.client, userId: "user-1" });
    const response = await GET(request());
    await expect(response.json()).resolves.toEqual({ status: "disabled", schoolName: "세화여자고등학교" });
    expect(resolveSchoolLocation).not.toHaveBeenCalled();
    expect(fetchCurrentWeather).not.toHaveBeenCalled();
  });

  it("returns location-unavailable when no trusted school location is found", async () => {
    resolveSchoolLocation.mockResolvedValue(null);
    const response = await GET(request());
    await expect(response.json()).resolves.toEqual({ status: "location-unavailable", schoolName: "세화여자고등학교" });
    expect(fetchCurrentWeather).not.toHaveBeenCalled();
  });

  it("returns the minimal ready weather response", async () => {
    const response = await GET(request());
    const payload = await response.json();
    expect(payload).toEqual({
      apparentTemperatureC: 22.1,
      conditionLabel: "대체로 맑음",
      highC: 26.5,
      lowC: 18.2,
      observedAt: "2026-09-21T14:15",
      schoolName: "세화여자고등학교",
      status: "ready",
      temperatureC: 23.4,
      weatherCode: 2,
    });
    expect(JSON.stringify(payload)).not.toMatch(/access-token|KAKAO|user-1|neis_|latitude|longitude|address/i);
  });

  it("normalizes weather provider failures to a generic 502", async () => {
    fetchCurrentWeather.mockRejectedValue(new WeatherProviderError());
    const response = await GET(request());
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: "WEATHER_UPSTREAM_ERROR",
      message: "날씨 정보를 불러오지 못했습니다.",
      status: "error",
    });
  });
});
