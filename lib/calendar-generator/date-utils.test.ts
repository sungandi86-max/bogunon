import { describe, expect, it } from "vitest";

import {
  clampDateToYear,
  firstWeekdayOfMonth,
  formatLocalDate,
  InvalidCalendarDateError,
  isWeekend,
  lastWeekdayOfMonth,
  nextWeekday,
  nthWeekdayOfMonth,
  parseLocalDate,
  previousWeekday,
} from "@/lib/calendar-generator/date-utils";
import type { CalendarDateParts } from "@/lib/calendar-generator/types";

describe("calendar generator date utilities", () => {
  it("formats and parses leap-day date-only values when the date is real", () => {
    // Given
    const leapDay = { year: 2028, month: 2, day: 29 } satisfies CalendarDateParts;

    // When
    const formatted = formatLocalDate(leapDay);
    const parsed = parseLocalDate(formatted);

    // Then
    expect(formatted).toBe("2028-02-29");
    expect(parsed).toEqual(leapDay);
  });

  it("rejects malformed or impossible date-only values", () => {
    // Given
    const malformedDate = "2028-2-29";
    const impossibleDate = "2026-02-29";

    // When
    const malformedResult = parseLocalDate(malformedDate);
    const impossibleResult = parseLocalDate(impossibleDate);

    // Then
    expect(malformedResult).toBeNull();
    expect(impossibleResult).toBeNull();
  });

  it("throws a typed error when required-date consumers receive an impossible date", () => {
    // Given
    const impossibleDate = "2028-02-30";

    // When
    const result = () => nextWeekday(impossibleDate, 1);

    // Then
    expect(result).toThrow(InvalidCalendarDateError);
    expect(result).toThrow("Invalid calendar date: 2028-02-30");
  });

  it("finds first nth and last weekdays without local timezone drift", () => {
    // Given
    const monday = 1;
    const friday = 5;

    // When
    const firstMonday = firstWeekdayOfMonth(2028, 2, monday);
    const secondMonday = nthWeekdayOfMonth({ year: 2028, month: 2, weekday: monday, occurrence: 2 });
    const lastFriday = lastWeekdayOfMonth(2028, 2, friday);

    // Then
    expect(firstMonday).toBe("2028-02-07");
    expect(secondMonday).toBe("2028-02-14");
    expect(lastFriday).toBe("2028-02-25");
  });

  it("returns null when a requested fifth weekday does not exist", () => {
    // Given
    const thursday = 4;

    // When
    const result = nthWeekdayOfMonth({ year: 2028, month: 2, weekday: thursday, occurrence: 5 });

    // Then
    expect(result).toBeNull();
  });

  it("moves to the next or previous weekday strictly outside the input date", () => {
    // Given
    const saturday = "2028-02-26";
    const sunday = "2028-02-27";

    // When
    const weekend = [isWeekend(saturday), isWeekend(sunday)];
    const nextMonday = nextWeekday(saturday, 1);
    const previousFriday = previousWeekday(sunday, 5);

    // Then
    expect(weekend).toEqual([true, true]);
    expect(nextMonday).toBe("2028-02-28");
    expect(previousFriday).toBe("2028-02-25");
  });

  it("clamps date-only values to the selected supported year", () => {
    // Given
    const beforeYear = "2027-12-31";
    const afterYear = "2029-01-01";
    const insideYear = "2028-06-15";

    // When
    const lowerClamp = clampDateToYear(beforeYear, 2028);
    const upperClamp = clampDateToYear(afterYear, 2028);
    const unchanged = clampDateToYear(insideYear, 2028);

    // Then
    expect(lowerClamp).toBe("2028-01-01");
    expect(upperClamp).toBe("2028-12-31");
    expect(unchanged).toBe(insideYear);
  });
});
