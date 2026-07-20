import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ACADEMIC_CALENDAR_STICKERS,
  CALENDAR_STICKER_CATALOG,
  HEALTH_CALENDAR_STICKERS,
  HOLIDAY_CALENDAR_STICKERS,
  PERSONAL_CALENDAR_STICKERS,
  SCHOOL_CALENDAR_STICKERS,
  calendarStickerByKey,
  calendarStickerCategory,
  filterCalendarStickers,
} from "@/lib/calendar-stickers/catalog";

describe("calendar sticker catalog", () => {
  const holidayDefinitions = [
    { key: "holiday.new-year", label: "신정", category: "national", assetPath: "/stickers/holiday/new-year.svg", keywords: ["새해", "양력설", "공휴일"], sortOrder: 10 },
    { key: "holiday.march-first", label: "삼일절", category: "national", assetPath: "/stickers/holiday/march-first.svg", keywords: ["3.1절", "독립", "국경일"], sortOrder: 20 },
    { key: "holiday.constitution-day", label: "제헌절", category: "national", assetPath: "/stickers/holiday/constitution-day.svg", keywords: ["헌법", "국경일", "기념일"], sortOrder: 30 },
    { key: "holiday.buddhas-birthday", label: "부처님 오신 날", category: "national", assetPath: "/stickers/holiday/buddhas-birthday.svg", keywords: ["석가탄신일", "불탄일", "공휴일"], sortOrder: 40 },
    { key: "holiday.labor-day", label: "노동절", category: "national", assetPath: "/stickers/holiday/labor-day.svg", keywords: ["근로자의 날", "노동", "휴일"], sortOrder: 50 },
    { key: "holiday.childrens-day", label: "어린이날", category: "national", assetPath: "/stickers/holiday/childrens-day.svg", keywords: ["어린이", "가정의 달", "공휴일"], sortOrder: 60 },
    { key: "holiday.memorial-day", label: "현충일", category: "national", assetPath: "/stickers/holiday/memorial-day.svg", keywords: ["추념", "국가추념일", "공휴일"], sortOrder: 70 },
    { key: "holiday.liberation-day", label: "광복절", category: "national", assetPath: "/stickers/holiday/liberation-day.svg", keywords: ["광복", "국경일", "공휴일"], sortOrder: 80 },
    { key: "holiday.national-foundation-day", label: "개천절", category: "national", assetPath: "/stickers/holiday/national-foundation-day.svg", keywords: ["개천", "국경일", "공휴일"], sortOrder: 90 },
    { key: "holiday.hangul-day", label: "한글날", category: "national", assetPath: "/stickers/holiday/hangul-day.svg", keywords: ["한글", "국경일", "공휴일"], sortOrder: 100 },
    { key: "holiday.christmas", label: "성탄절", category: "national", assetPath: "/stickers/holiday/christmas.svg", keywords: ["크리스마스", "기독탄신일", "공휴일"], sortOrder: 110 },
    { key: "holiday.seollal", label: "설날", category: "traditional", assetPath: "/stickers/holiday/seollal.svg", keywords: ["새해", "명절", "음력설"], sortOrder: 210 },
    { key: "holiday.seollal-break", label: "설날 연휴", category: "traditional", assetPath: "/stickers/holiday/seollal-break.svg", keywords: ["명절", "설 연휴", "연휴"], sortOrder: 220 },
    { key: "holiday.chuseok", label: "추석", category: "traditional", assetPath: "/stickers/holiday/chuseok.svg", keywords: ["명절", "한가위", "보름"], sortOrder: 230 },
    { key: "holiday.chuseok-break", label: "추석 연휴", category: "traditional", assetPath: "/stickers/holiday/chuseok-break.svg", keywords: ["명절", "추석 연휴", "연휴"], sortOrder: 240 },
    { key: "holiday.substitute", label: "대체공휴일", category: "special", assetPath: "/stickers/holiday/substitute.svg", keywords: ["휴일", "대체", "공휴일"], sortOrder: 310 },
    { key: "holiday.temporary", label: "임시공휴일", category: "special", assetPath: "/stickers/holiday/temporary.svg", keywords: ["휴일", "임시", "공휴일"], sortOrder: 320 },
    { key: "holiday.election-day", label: "선거일", category: "special", assetPath: "/stickers/holiday/election-day.svg", keywords: ["투표", "선거", "공휴일"], sortOrder: 330 },
    { key: "holiday", label: "공휴일", category: "special", assetPath: "/stickers/holiday/public-holiday.svg", keywords: ["휴일", "공휴일", "쉬는 날"], sortOrder: 340 },
    { key: "long-weekend", label: "연휴", category: "general", assetPath: "/stickers/holiday/long-weekend.svg", keywords: ["휴일", "연속 휴일", "징검다리"], sortOrder: 410 },
  ] as const;

  it("keeps legacy school and personal keys while registering the academic pack", () => {
    expect(ACADEMIC_CALENDAR_STICKERS).toHaveLength(28);
    expect(ACADEMIC_CALENDAR_STICKERS.some((item) => item.key === "vacation-ceremony")).toBe(true);
    expect(ACADEMIC_CALENDAR_STICKERS.some((item) => item.key === "opening-ceremony")).toBe(true);
    expect(PERSONAL_CALENDAR_STICKERS).toHaveLength(12);
    expect(PERSONAL_CALENDAR_STICKERS.every((item) => item.key.startsWith("personal."))).toBe(true);
    expect(SCHOOL_CALENDAR_STICKERS.map((item) => item.key as string)).not.toContain("holiday");
    expect(calendarStickerCategory("academic.midterm")).toBe("school");
    expect(calendarStickerCategory("personal.hospital")).toBe("personal");
    expect(calendarStickerByKey("academic.club")).toMatchObject({ label: "동아리", pack: "academic", category: "event", assetPath: "/stickers/academic/club.svg", sortOrder: 290 });
    expect(filterCalendarStickers(ACADEMIC_CALENDAR_STICKERS, "동아리").map((item) => item.key)).toEqual(["academic.club"]);
  });

  it("registers the 20-sticker holiday pack with exact metadata and legacy keys moved once", () => {
    expect(HOLIDAY_CALENDAR_STICKERS).toHaveLength(20);
    expect(HOLIDAY_CALENDAR_STICKERS.map((item) => ({
      key: item.key,
      label: item.label,
      category: item.category,
      assetPath: item.assetPath,
      keywords: item.keywords,
      sortOrder: item.sortOrder,
    }))).toEqual(holidayDefinitions);
    expect(HOLIDAY_CALENDAR_STICKERS.every((item) => item.pack === "holiday")).toBe(true);
    expect(HOLIDAY_CALENDAR_STICKERS.filter((item) => !item.key.startsWith("holiday.")).map((item) => item.key).sort()).toEqual(["holiday", "long-weekend"]);
    const schoolKeys: readonly string[] = SCHOOL_CALENDAR_STICKERS.map((item) => item.key);
    expect(schoolKeys).not.toContain("holiday");
    expect(schoolKeys).not.toContain("long-weekend");
    expect(new Set(HOLIDAY_CALENDAR_STICKERS.map((item) => item.sortOrder)).size).toBe(20);
    expect(calendarStickerCategory("holiday.labor-day")).toBe("school");
    expect(calendarStickerCategory("holiday")).toBe("school");
  });

  it("keeps holiday category counts stable", () => {
    const byCategory = new Map<string, number>();
    for (const sticker of HOLIDAY_CALENDAR_STICKERS) {
      byCategory.set(sticker.category, (byCategory.get(sticker.category) ?? 0) + 1);
    }

    expect(Object.fromEntries(byCategory)).toEqual({
      national: 11,
      traditional: 4,
      special: 4,
      general: 1,
    });
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

  it("searches holiday labels, keywords, categories, and pack", () => {
    expect(filterCalendarStickers(HOLIDAY_CALENDAR_STICKERS, "새해").map((item) => item.label)).toEqual(["신정", "설날"]);
    expect(filterCalendarStickers(HOLIDAY_CALENDAR_STICKERS, "명절").map((item) => item.label)).toEqual(["설날", "설날 연휴", "추석", "추석 연휴"]);
    expect(filterCalendarStickers(HOLIDAY_CALENDAR_STICKERS, "휴일").map((item) => item.label)).toEqual(["대체공휴일", "임시공휴일", "공휴일", "연휴"]);
    expect(filterCalendarStickers(HOLIDAY_CALENDAR_STICKERS, "크리스마스").map((item) => item.label)).toEqual(["성탄절"]);
    expect(filterCalendarStickers(HOLIDAY_CALENDAR_STICKERS, "한글").map((item) => item.label)).toEqual(["한글날"]);
    expect(filterCalendarStickers(HOLIDAY_CALENDAR_STICKERS, "투표").map((item) => item.label)).toEqual(["선거일"]);
    expect(filterCalendarStickers(HOLIDAY_CALENDAR_STICKERS, "석가탄신일").map((item) => item.label)).toEqual(["부처님 오신 날"]);
    expect(filterCalendarStickers(HOLIDAY_CALENDAR_STICKERS, "", "national")).toHaveLength(11);
    expect(filterCalendarStickers(HOLIDAY_CALENDAR_STICKERS, "holiday")).toHaveLength(20);
  });
});
