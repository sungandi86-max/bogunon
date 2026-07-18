import { describe, expect, it } from "vitest";

import { CALENDAR_STICKER_CATALOG, calendarStickerByKey } from "@/lib/calendar-stickers/catalog";

describe("school calendar sticker catalog", () => {
  const expectedCatalog = [
    ["vacation-ceremony", "방학식"],
    ["opening-ceremony", "개학식"],
    ["holiday", "공휴일"],
    ["long-weekend", "연휴"],
    ["school-closure", "재량휴업일"],
    ["exam-period", "시험기간"],
    ["school-event", "학교행사"],
    ["staff-training", "교직원 연수"],
    ["flexible-curriculum", "수업량 유연화"],
    ["other", "기타"],
  ];

  it("defines ten unique local SVG stickers without emoji", () => {
    const keys = CALENDAR_STICKER_CATALOG.map((sticker) => sticker.key);
    const assets = CALENDAR_STICKER_CATALOG.map((sticker) => sticker.assetPath);

    expect(CALENDAR_STICKER_CATALOG).toHaveLength(10);
    expect(new Set(keys)).toHaveProperty("size", 10);
    expect(new Set(assets)).toHaveProperty("size", 10);
    expect(assets.every((asset) => /^\/stickers\/school-calendar\/[a-z-]+\.svg$/.test(asset))).toBe(true);
    expect(CALENDAR_STICKER_CATALOG.every((sticker) => !/\p{Extended_Pictographic}/u.test(sticker.label))).toBe(true);
    expect(CALENDAR_STICKER_CATALOG.map(({ key, label }) => [key, label])).toEqual(expectedCatalog);
  });

  it("looks up a known sticker and rejects an unknown key", () => {
    expect(calendarStickerByKey("opening-ceremony")?.label).toBe("개학식");
    expect(calendarStickerByKey("unknown")).toBeUndefined();
  });
});
