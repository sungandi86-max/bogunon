import { describe, expect, it } from "vitest";

import {
  classifyNeisSchedule,
  filterNeisPreviewItems,
  formatGradeBadge,
} from "@/lib/neis/preview";
import type { NeisPreviewFilters, NeisPreviewItem } from "@/lib/neis/types";

const defaults: NeisPreviewFilters = {
  includeSaturdayClosures: false,
  includeHolidays: true,
  includeVacations: true,
  category: "all",
  query: "",
};

function item(overrides: Partial<NeisPreviewItem>): NeisPreviewItem {
  return {
    id: "schedule-1",
    date: "2026-07-20",
    title: "학교 행사",
    content: "체육관에서 진행",
    grades: ["전 학년"],
    status: "ready",
    selected: true,
    ...overrides,
  };
}

describe("NEIS preview filtering", () => {
  it("classifies exams, holidays, vacations, and ordinary school events", () => {
    expect(classifyNeisSchedule("2학기 기말고사")).toBe("exam");
    expect(classifyNeisSchedule("광복절")).toBe("holiday");
    expect(classifyNeisSchedule("여름방학식")).toBe("vacation");
    expect(classifyNeisSchedule("진로 체험의 날")).toBe("schoolEvent");
  });

  it("excludes Saturday closures by default and reveals them immediately when enabled", () => {
    const items = [
      item({ id: "event", title: "학생회 선거" }),
      item({ id: "saturday", title: "토요휴업일" }),
    ];

    expect(filterNeisPreviewItems(items, defaults).map(({ id }) => id)).toEqual(["event"]);
    expect(filterNeisPreviewItems(items, { ...defaults, includeSaturdayClosures: true }).map(({ id }) => id)).toEqual(["event", "saturday"]);
  });

  it("combines include toggles, category, and search across title, detail, grade, and date", () => {
    const items = [
      item({ id: "exam", date: "2026-07-03", title: "기말고사", content: "3학년 평가", grades: ["3학년"] }),
      item({ id: "holiday", title: "제헌절" }),
      item({ id: "vacation", title: "여름방학" }),
    ];

    expect(filterNeisPreviewItems(items, { ...defaults, category: "exam", query: "2026.07" }).map(({ id }) => id)).toEqual(["exam"]);
    expect(filterNeisPreviewItems(items, { ...defaults, query: "3학년" }).map(({ id }) => id)).toEqual(["exam"]);
    expect(filterNeisPreviewItems(items, { ...defaults, includeHolidays: false }).map(({ id }) => id)).not.toContain("holiday");
    expect(filterNeisPreviewItems(items, { ...defaults, includeVacations: false }).map(({ id }) => id)).not.toContain("vacation");
  });

  it("formats selected grade combinations as compact badges", () => {
    expect(formatGradeBadge(["전 학년"])).toBe("전 학년");
    expect(formatGradeBadge(["1학년", "2학년"])).toBe("1·2학년");
    expect(formatGradeBadge([])).toBe("학년 정보 없음");
  });
});
