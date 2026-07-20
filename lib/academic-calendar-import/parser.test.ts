import { describe, expect, it } from "vitest";

import {
  detectAcademicColumns,
  parseAcademicRows,
  parseAcademicDate,
  parseAcademicPeriod,
} from "@/lib/academic-calendar-import/parser";

describe("academic calendar import parser", () => {
  it("parses full dates and dates containing Korean weekdays", () => {
    expect(parseAcademicDate("2026년 3월 2일(월)", { academicYear: 2026, academicYearMode: false })).toBe("2026-03-02");
    expect(parseAcademicDate("2026.03.17", { academicYear: 2026, academicYearMode: false })).toBe("2026-03-17");
  });

  it("uses the next calendar year for January and February in academic-year mode", () => {
    expect(parseAcademicDate("2월 5일", { academicYear: 2026, academicYearMode: true })).toBe("2027-02-05");
    expect(parseAcademicDate("3/2", { academicYear: 2026, academicYearMode: true })).toBe("2026-03-02");
  });

  it("parses Excel serial dates and rejects impossible dates", () => {
    expect(parseAcademicDate(46083, { academicYear: 2026, academicYearMode: false })).toBe("2026-03-02");
    expect(parseAcademicDate(new Date(2026, 2, 2), { academicYear: 2026, academicYearMode: false })).toBe("2026-03-02");
    expect(parseAcademicDate("2026-02-30", { academicYear: 2026, academicYearMode: false })).toBeNull();
  });

  it("parses a date range into one period event", () => {
    expect(parseAcademicPeriod("2026.04.20~2026.04.24", { academicYear: 2026, academicYearMode: false })).toEqual({
      startDate: "2026-04-20",
      endDate: "2026-04-24",
    });
  });

  it("detects headers that are not on the first row", () => {
    expect(detectAcademicColumns([
      ["2026학년도 학사일정"],
      [],
      ["월", "일", "행사명"],
      [3, 2, "개학식"],
    ])).toEqual(expect.objectContaining({ headerRow: 2, monthColumn: 0, dayColumn: 1, titleColumn: 2 }));
  });

  it("selects valid rows and leaves invalid rows unselected", () => {
    const result = parseAcademicRows([
      ["날짜", "일정"],
      ["2026-03-02", "개학식"],
      ["2026-02-30", "날짜 오류"],
      ["2026-03-03", ""],
    ], { academicYear: 2026, academicYearMode: false });

    expect(result.items.map((item) => ({ status: item.status, selected: item.selected }))).toEqual([
      { status: "ready", selected: true },
      { status: "dateError", selected: false },
      { status: "missingTitle", selected: false },
    ]);
  });

  it("carries a month heading into day-only rows", () => {
    const result = parseAcademicRows([["3월"], ["2일", "개학식"], ["17일", "학부모총회"]], { academicYear: 2026, academicYearMode: false });
    expect(result.items.map((item) => item.startDate)).toEqual(["2026-03-02", "2026-03-17"]);
  });
});
