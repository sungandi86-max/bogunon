import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ACADEMIC_CALENDAR_STICKERS,
  CALENDAR_STICKER_CATALOG,
  PERSONAL_CALENDAR_STICKERS,
  SCHOOL_CALENDAR_STICKERS,
  calendarStickerByKey,
  calendarStickerCategory,
  filterCalendarStickers,
} from "@/lib/calendar-stickers/catalog";

describe("calendar sticker catalog", () => {
  it("keeps legacy school and personal keys while registering the 27-sticker academic pack", () => {
    expect(ACADEMIC_CALENDAR_STICKERS).toHaveLength(27);
    expect(ACADEMIC_CALENDAR_STICKERS.some((item) => item.key === "vacation-ceremony")).toBe(true);
    expect(ACADEMIC_CALENDAR_STICKERS.some((item) => item.key === "opening-ceremony")).toBe(true);
    expect(PERSONAL_CALENDAR_STICKERS).toHaveLength(12);
    expect(PERSONAL_CALENDAR_STICKERS.every((item) => item.key.startsWith("personal."))).toBe(true);
    expect(SCHOOL_CALENDAR_STICKERS.some((item) => item.key === "holiday")).toBe(true);
    expect(calendarStickerCategory("academic.midterm")).toBe("school");
    expect(calendarStickerCategory("personal.hospital")).toBe("personal");
  });

  it("keeps every registry key unique", () => {
    const keys = CALENDAR_STICKER_CATALOG.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("maps every sticker to an existing local SVG", () => {
    for (const sticker of CALENDAR_STICKER_CATALOG) {
      const path = join(process.cwd(), "public", sticker.assetPath.replace(/^\//, ""));
      expect(existsSync(path), sticker.assetPath).toBe(true);
      expect(calendarStickerByKey(sticker.key)?.assetPath).toBe(sticker.assetPath);
    }
  });

  it("keeps the academic registry and SVG directory in one-to-one sync", () => {
    const registeredFiles = ACADEMIC_CALENDAR_STICKERS
      .map((sticker) => sticker.assetPath.split("/").at(-1))
      .sort();
    const assetFiles = readdirSync(join(process.cwd(), "public", "stickers", "academic"))
      .filter((file) => file.endsWith(".svg"))
      .sort();

    expect(assetFiles).toEqual(registeredFiles);
  });

  it("gives every academic SVG an accessible title", () => {
    for (const sticker of ACADEMIC_CALENDAR_STICKERS) {
      const path = join(process.cwd(), "public", sticker.assetPath.replace(/^\//, ""));
      const svg = readFileSync(path, "utf8");
      expect(svg).toContain(`<title>${sticker.label}</title>`);
      expect(svg).toMatch(/role=["']img["']/);
    }
  });

  it("searches academic labels, keywords, and categories", () => {
    expect(filterCalendarStickers(ACADEMIC_CALENDAR_STICKERS, "시험").map((item) => item.label)).toEqual([
      "진단평가", "중간고사", "기말고사", "시험기간", "수행평가",
    ]);
    expect(filterCalendarStickers(ACADEMIC_CALENDAR_STICKERS, "방학").map((item) => item.label)).toEqual([
      "방학식", "여름방학", "겨울방학", "방학캠프",
    ]);
    expect(filterCalendarStickers(ACADEMIC_CALENDAR_STICKERS, "", "exam")).toHaveLength(5);
  });
});
