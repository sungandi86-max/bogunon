import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearUserSchoolSettingsAction,
  saveUserSchoolSettingsAction,
} from "@/app/(app)/settings/school-actions";
import {
  clearUserSchoolSettings,
  upsertUserSchoolSettings,
} from "@/lib/neis/school-settings";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/neis/school-settings", () => ({
  clearUserSchoolSettings: vi.fn(),
  upsertUserSchoolSettings: vi.fn(),
}));

const school = {
  officeCode: "B10",
  schoolCode: "7010082",
  name: "여의도고등학교",
  officeName: "서울특별시교육청",
  schoolLevel: "고등학교",
  region: "서울특별시",
  address: "서울특별시 영등포구 국제금융로7길 37",
  latitude: null,
  longitude: null,
  mealEnabled: true,
  weatherEnabled: false,
};

describe("school settings actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates and saves the selected school", async () => {
    await expect(saveUserSchoolSettingsAction(school)).resolves.toEqual({
      status: "success",
      message: "학교 설정이 저장되었습니다.",
    });
    expect(upsertUserSchoolSettings).toHaveBeenCalledWith(school);
  });

  it("rejects invalid school input before making a request", async () => {
    await expect(saveUserSchoolSettingsAction({ ...school, schoolCode: "" })).resolves.toEqual({
      status: "error",
      message: "선택한 학교 정보를 확인해 주세요.",
    });
    expect(upsertUserSchoolSettings).not.toHaveBeenCalled();
  });

  it("returns repository save failures", async () => {
    vi.mocked(upsertUserSchoolSettings).mockRejectedValueOnce(new Error("학교 정보를 저장하지 못했습니다."));
    await expect(saveUserSchoolSettingsAction(school)).resolves.toEqual({
      status: "error",
      message: "학교 정보를 저장하지 못했습니다.",
    });
  });

  it("clears the saved school settings", async () => {
    await expect(clearUserSchoolSettingsAction()).resolves.toEqual({
      status: "success",
      message: "학교 정보를 초기화했습니다.",
    });
    expect(clearUserSchoolSettings).toHaveBeenCalledOnce();
  });
});
