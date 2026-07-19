import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ACADEMIC_CALENDAR_STICKERS,
  CALENDAR_STICKER_CATALOG,
  HEALTH_CALENDAR_STICKERS,
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

  it("registers exactly 28 health-work stickers with stable namespace and categories", () => {
    expect(HEALTH_CALENDAR_STICKERS).toHaveLength(28);
    expect(HEALTH_CALENDAR_STICKERS.every((item) => item.key.startsWith("health."))).toBe(true);
    expect(HEALTH_CALENDAR_STICKERS.every((item) => item.pack === "health")).toBe(true);
    expect(HEALTH_CALENDAR_STICKERS.every((item) => item.label.length > 0)).toBe(true);
    expect(HEALTH_CALENDAR_STICKERS.every((item) => item.keywords.length > 0)).toBe(true);

    const byCategory = new Map<string, number>();
    for (const sticker of HEALTH_CALENDAR_STICKERS) {
      byCategory.set(sticker.category, (byCategory.get(sticker.category) ?? 0) + 1);
    }

    expect(Object.fromEntries(byCategory)).toEqual({
      screening: 7,
      education: 9,
      operation: 7,
      administration: 5,
    });
    expect(new Set(HEALTH_CALENDAR_STICKERS.map((item) => item.sortOrder)).size).toBe(28);
    expect(calendarStickerCategory("health.aed-check")).toBe("school");
  });

  it("keeps the health registry and SVG directory in one-to-one sync", () => {
    const registeredFiles = HEALTH_CALENDAR_STICKERS
      .map((sticker) => sticker.assetPath.split("/").at(-1))
      .sort();
    const assetFiles = readdirSync(join(process.cwd(), "public", "stickers", "health"))
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

  it("gives every health SVG an accessible title and local image role", () => {
    for (const sticker of HEALTH_CALENDAR_STICKERS) {
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

  it("searches health labels, keywords, categories, and pack", () => {
    expect(filterCalendarStickers(HEALTH_CALENDAR_STICKERS, "검사").map((item) => item.label)).toEqual([
      "학생건강검진", "소변검사", "결핵검사", "시력검사", "구강검사",
    ]);
    expect(filterCalendarStickers(HEALTH_CALENDAR_STICKERS, "교육").map((item) => item.label)).toEqual([
      "심폐소생술 교육",
      "응급처치 교육",
      "성교육",
      "흡연예방교육",
      "음주예방교육",
      "약물오남용 예방교육",
      "감염병 예방교육",
      "생명존중교육",
      "비만예방교육",
    ]);
    expect(filterCalendarStickers(HEALTH_CALENDAR_STICKERS, "점검").map((item) => item.label)).toEqual([
      "AED 점검", "의약품 점검", "응급키트 점검", "보건실 환경점검", "의료폐기물 점검",
    ]);
    expect(filterCalendarStickers(HEALTH_CALENDAR_STICKERS, "CPR").map((item) => item.label)).toEqual(["심폐소생술 교육"]);
    expect(filterCalendarStickers(HEALTH_CALENDAR_STICKERS, "담임").map((item) => item.label)).toEqual(["담임 협조 요청"]);
    expect(filterCalendarStickers(HEALTH_CALENDAR_STICKERS, "", "screening")).toHaveLength(7);
    expect(filterCalendarStickers(HEALTH_CALENDAR_STICKERS, "health")).toHaveLength(28);
  });
});
