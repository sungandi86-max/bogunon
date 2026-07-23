import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  })),
}));

import {
  clearUserSchoolSettings,
  getDefaultNeisSchool,
  getUserSchoolSettings,
  upsertDefaultNeisSchool,
  upsertUserSchoolSettings,
} from "@/lib/neis/school-settings";

const school = {
  officeCode: "B10",
  schoolCode: "7010082",
  name: "여의도고등학교",
  officeName: "서울특별시교육청",
};

const userSchool = {
  ...school,
  schoolLevel: "고등학교",
  region: "서울특별시",
  address: "서울특별시 영등포구 국제금융로7길 37",
  latitude: null,
  longitude: null,
  mealEnabled: true,
  weatherEnabled: false,
};

describe("NEIS default school settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.maybeSingle.mockResolvedValue({
      data: {
        neis_office_code: school.officeCode,
        neis_school_code: school.schoolCode,
        neis_school_name: school.name,
        neis_office_name: school.officeName,
        neis_school_level: userSchool.schoolLevel,
        neis_region: userSchool.region,
        neis_address: userSchool.address,
        school_latitude: null,
        school_longitude: null,
        meal_enabled: true,
        weather_enabled: false,
      },
      error: null,
    });
    mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.updateEq.mockResolvedValue({ error: null });
    mocks.update.mockReturnValue({ eq: mocks.updateEq });
    mocks.from.mockReturnValue({ select: mocks.select, upsert: mocks.upsert, update: mocks.update });
  });

  it("loads only the authenticated user's saved school", async () => {
    await expect(getDefaultNeisSchool()).resolves.toEqual(school);
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("upserts the four school fields under the authenticated user id", async () => {
    await expect(upsertDefaultNeisSchool(school)).resolves.toBeUndefined();
    expect(mocks.upsert).toHaveBeenCalledWith({
      user_id: "user-1",
      neis_office_code: "B10",
      neis_school_code: "7010082",
      neis_school_name: "여의도고등학교",
      neis_office_name: "서울특별시교육청",
    }, { onConflict: "user_id" });
  });

  it("loads the authenticated user's complete school preferences", async () => {
    await expect(getUserSchoolSettings()).resolves.toEqual(userSchool);
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("stores school preferences under the authenticated user id", async () => {
    await expect(upsertUserSchoolSettings(userSchool)).resolves.toBeUndefined();
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "user-1",
      neis_school_code: school.schoolCode,
      meal_enabled: true,
      weather_enabled: false,
    }), { onConflict: "user_id" });
  });

  it("clears only school fields without deleting other user settings", async () => {
    await expect(clearUserSchoolSettings()).resolves.toBeUndefined();
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      neis_school_code: null,
      meal_enabled: true,
      weather_enabled: true,
    }));
    expect(mocks.updateEq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("blocks unauthenticated school writes", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(upsertUserSchoolSettings(userSchool)).rejects.toThrow();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("reports Supabase request failures", async () => {
    mocks.upsert.mockResolvedValueOnce({ error: new Error("database unavailable") });
    await expect(upsertUserSchoolSettings(userSchool)).rejects.toThrow("학교 정보를 저장하지 못했습니다.");
  });
});
