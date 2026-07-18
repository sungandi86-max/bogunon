import { describe, expect, it } from "vitest";

import { addCalendarDays, formatSeoulDateTime, monthRange, shiftCalendarMonth, todayInSeoul, weekRange } from "@/lib/work-items/date";

describe("work item dates", () => {
  it("uses the Seoul calendar date", () => {
    expect(todayInSeoul(new Date("2026-07-16T15:30:00Z"))).toBe("2026-07-17");
  });

  it("returns the exact month range", () => {
    expect(monthRange("2028-02-10")).toEqual({ first: "2028-02-01", last: "2028-02-29" });
  });

  it("formats timestamps deterministically in the Seoul timezone", () => {
    // Given
    const timestamp = "2026-07-17T15:09:05.000Z";

    // When
    const result = formatSeoulDateTime(timestamp);

    // Then
    expect(result).toBe("2026. 07. 18. 00:09:05");
  });
});

describe("calendar date navigation", () => {
  it("uses Monday-first week boundaries without local timezone drift", () => {
    expect(weekRange("2026-07-18")).toEqual({ first: "2026-07-13", last: "2026-07-19" });
    expect(addCalendarDays("2026-07-18", 1)).toBe("2026-07-19");
  });

  it("clamps month navigation to the target month", () => {
    expect(shiftCalendarMonth("2026-01-31", 1)).toBe("2026-02-28");
  });
});
