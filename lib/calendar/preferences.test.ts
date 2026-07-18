import { describe, expect, it } from "vitest";

import { DEFAULT_CALENDAR_WEEK_START, calendarMonthCells, calendarWeekRange, parseCalendarWeekStart, weekdayLabels } from "@/lib/calendar/preferences";

describe("calendar preferences", () => {
  it("uses Sunday when no stored preference exists", () => {
    expect(DEFAULT_CALENDAR_WEEK_START).toBe("sunday");
    expect(parseCalendarWeekStart(null)).toBe("sunday");
    expect(weekdayLabels("sunday")).toEqual(["일", "월", "화", "수", "목", "금", "토"]);
  });

  it("moves the real first-week date placement when Monday is selected", () => {
    const sundayCells = calendarMonthCells("2026-07", "sunday");
    const mondayCells = calendarMonthCells("2026-07", "monday");

    expect(sundayCells.indexOf("2026-07-01")).toBe(3);
    expect(mondayCells.indexOf("2026-07-01")).toBe(2);
  });

  it("calculates Sunday and Monday week ranges across month boundaries", () => {
    expect(calendarWeekRange("2026-07-01", "sunday")).toEqual({ first: "2026-06-28", last: "2026-07-04" });
    expect(calendarWeekRange("2026-07-01", "monday")).toEqual({ first: "2026-06-29", last: "2026-07-05" });
  });

  it("keeps leap-day placement valid", () => {
    const cells = calendarMonthCells("2028-02", "sunday");
    expect(cells).toContain("2028-02-29");
    expect(cells).toHaveLength(42);
  });
});
