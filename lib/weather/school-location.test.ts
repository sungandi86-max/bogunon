import { describe, expect, it, vi } from "vitest";

import { resolveSchoolLocation, selectTrustedSchoolPlace } from "@/lib/weather/school-location";
import type { PlaceSearchResult } from "@/lib/maps/types";

const school = {
  address: "서울특별시 서초구 신반포로 56-7",
  latitude: null,
  longitude: null,
  name: "세화여자고등학교",
  region: "서울특별시",
};

const exactPlace: PlaceSearchResult = {
  address: "서울 서초구 신반포로 56-7",
  category: "교육,학문 > 학교 > 고등학교",
  latitude: 37.5,
  longitude: 127.0,
  name: "세화여자고등학교",
  providerId: "school-1",
};

describe("school weather location", () => {
  it("uses stored coordinates without geocoding", async () => {
    const search = vi.fn();
    await expect(resolveSchoolLocation({ ...school, latitude: 37.5, longitude: 127 }, search))
      .resolves.toEqual({ latitude: 37.5, longitude: 127 });
    expect(search).not.toHaveBeenCalled();
  });

  it("uses the address query first and accepts an exact school match", async () => {
    const search = vi.fn().mockResolvedValue([exactPlace]);
    await expect(resolveSchoolLocation(school, search)).resolves.toEqual({ latitude: 37.5, longitude: 127 });
    expect(search).toHaveBeenCalledWith("세화여자고등학교 서울특별시 서초구 신반포로 56-7");
    expect(search).toHaveBeenCalledOnce();
  });

  it("falls back to the school name when the first query has no trusted match", async () => {
    const unrelated = { ...exactPlace, name: "세화여자대학교", category: "교육,학문 > 대학교" };
    const search = vi.fn()
      .mockResolvedValueOnce([unrelated])
      .mockResolvedValueOnce([exactPlace]);

    await expect(resolveSchoolLocation(school, search)).resolves.toEqual({ latitude: 37.5, longitude: 127 });
    expect(search).toHaveBeenNthCalledWith(2, "세화여자고등학교");
  });

  it("does not trust the first unrelated result", () => {
    const unrelated = { ...exactPlace, name: "세화여자대학교", category: "교육,학문 > 대학교" };
    expect(selectTrustedSchoolPlace([unrelated], school)).toBeNull();
  });

  it("returns null when geocoding fails", async () => {
    const search = vi.fn().mockRejectedValue(new Error("private provider detail"));
    await expect(resolveSchoolLocation(school, search)).resolves.toBeNull();
  });
});
