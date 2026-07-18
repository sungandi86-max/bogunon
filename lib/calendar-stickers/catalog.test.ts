import { describe, expect, it } from "vitest";

import { PERSONAL_CALENDAR_STICKERS, SCHOOL_CALENDAR_STICKERS, calendarStickerByKey, calendarStickerCategory } from "@/lib/calendar-stickers/catalog";

describe("calendar sticker catalog", () => {
  it("keeps legacy school keys and namespaces personal sticker keys", () => {
    expect(SCHOOL_CALENDAR_STICKERS.some((item) => item.key === "vacation-ceremony")).toBe(true);
    expect(PERSONAL_CALENDAR_STICKERS).toHaveLength(12);
    expect(PERSONAL_CALENDAR_STICKERS.every((item) => item.key.startsWith("personal."))).toBe(true);
    expect(calendarStickerCategory("vacation-ceremony")).toBe("school");
    expect(calendarStickerCategory("personal.hospital")).toBe("personal");
  });

  it("maps every personal sticker to a local SVG asset", () => {
    for (const sticker of PERSONAL_CALENDAR_STICKERS) {
      expect(calendarStickerByKey(sticker.key)?.assetPath).toMatch(/^\/stickers\/personal-calendar\/.+\.svg$/);
    }
  });
});
