import { addCalendarDays } from "@/lib/work-items/date";

export const CALENDAR_WEEK_START_STORAGE_KEY = "bogunon-calendar-week-start";
export const DEFAULT_CALENDAR_WEEK_START = "sunday";

export type CalendarWeekStart = "sunday" | "monday";

const weekdaySets = {
  sunday: ["일", "월", "화", "수", "목", "금", "토"],
  monday: ["월", "화", "수", "목", "금", "토", "일"],
} as const satisfies Record<CalendarWeekStart, readonly string[]>;

export function parseCalendarWeekStart(value: string | null): CalendarWeekStart {
  return value === "monday" ? "monday" : DEFAULT_CALENDAR_WEEK_START;
}

export function weekdayLabels(weekStart: CalendarWeekStart): readonly string[] {
  return weekdaySets[weekStart];
}

export function calendarWeekRange(date: string, weekStart: CalendarWeekStart) {
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const offset = weekStart === "sunday" ? weekday : weekday === 0 ? 6 : weekday - 1;
  const first = addCalendarDays(date, -offset);
  return { first, last: addCalendarDays(first, 6) };
}

export function calendarMonthCells(month: string, weekStart: CalendarWeekStart): readonly (string | null)[] {
  const [year = 1970, monthNumber = 1] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const leading = weekStart === "sunday" ? firstWeekday : firstWeekday === 0 ? 6 : firstWeekday - 1;
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - leading + 1;
    return day >= 1 && day <= daysInMonth
      ? `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : null;
  });
}
