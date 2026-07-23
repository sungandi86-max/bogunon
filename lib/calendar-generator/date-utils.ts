import type { CalendarDateParts, MonthNumber, Weekday, WeekdayOccurrence } from "@/lib/calendar-generator/types";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export class InvalidCalendarDateError extends Error {
  readonly value: string;

  constructor(value: string) {
    super(`Invalid calendar date: ${value}`);
    this.name = "InvalidCalendarDateError";
    this.value = value;
  }
}

export type NthWeekdayRequest = {
  readonly year: number;
  readonly month: MonthNumber;
  readonly weekday: Weekday;
  readonly occurrence: WeekdayOccurrence;
};

export function parseLocalDate(value: string): CalendarDateParts | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (match === null) return null;

  const yearText = match.at(1);
  const monthText = match.at(2);
  const dayText = match.at(3);
  if (yearText === undefined || monthText === undefined || dayText === undefined) return null;

  const month = monthFromNumber(Number(monthText));
  if (month === null) return null;

  const parts = {
    year: Number(yearText),
    month,
    day: Number(dayText),
  };

  if (parts.day < 1 || parts.day > daysInMonth(parts.year, parts.month)) {
    return null;
  }

  return parts;
}

export function formatLocalDate(parts: CalendarDateParts): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function isWeekend(date: string): boolean {
  const weekday = weekdayOf(readRequiredDate(date));
  return weekday === 0 || weekday === 6;
}

export function nextWeekday(date: string, weekday: Weekday): string {
  const parts = readRequiredDate(date);
  const offset = positiveDayOffset(weekday - weekdayOf(parts));
  return formatLocalDate(addDays(parts, offset));
}

export function previousWeekday(date: string, weekday: Weekday): string {
  const parts = readRequiredDate(date);
  const offset = positiveDayOffset(weekdayOf(parts) - weekday);
  return formatLocalDate(addDays(parts, -offset));
}

export function firstWeekdayOfMonth(year: number, month: MonthNumber, weekday: Weekday): string {
  const first = { year, month, day: 1 };
  const offset = (weekday - weekdayOf(first) + 7) % 7;
  return formatLocalDate({ year, month, day: 1 + offset });
}

export function nthWeekdayOfMonth(request: NthWeekdayRequest): string | null {
  const first = readRequiredDate(firstWeekdayOfMonth(request.year, request.month, request.weekday));
  const day = first.day + (request.occurrence - 1) * 7;
  if (day > daysInMonth(request.year, request.month)) return null;
  return formatLocalDate({ year: request.year, month: request.month, day });
}

export function lastWeekdayOfMonth(year: number, month: MonthNumber, weekday: Weekday): string {
  const lastDay = daysInMonth(year, month);
  const last = { year, month, day: lastDay };
  const offset = (weekdayOf(last) - weekday + 7) % 7;
  return formatLocalDate({ year, month, day: lastDay - offset });
}

export function clampDateToYear(date: string, year: number): string {
  const normalized = formatLocalDate(readRequiredDate(date));
  const first = `${year}-01-01`;
  const last = `${year}-12-31`;
  if (normalized < first) return first;
  if (normalized > last) return last;
  return normalized;
}

function readRequiredDate(value: string): CalendarDateParts {
  const parts = parseLocalDate(value);
  if (parts === null) throw new InvalidCalendarDateError(value);
  return parts;
}

function addDays(parts: CalendarDateParts, days: number): CalendarDateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  const month = monthFromNumber(date.getUTCMonth() + 1);
  if (month === null) throw new InvalidCalendarDateError(formatLocalDate(parts));

  return {
    year: date.getUTCFullYear(),
    month,
    day: date.getUTCDate(),
  };
}

function weekdayOf(parts: CalendarDateParts): number {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function positiveDayOffset(offset: number): number {
  const normalized = (offset + 7) % 7;
  return normalized === 0 ? 7 : normalized;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function monthFromNumber(value: number): MonthNumber | null {
  switch (value) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 3;
    case 4:
      return 4;
    case 5:
      return 5;
    case 6:
      return 6;
    case 7:
      return 7;
    case 8:
      return 8;
    case 9:
      return 9;
    case 10:
      return 10;
    case 11:
      return 11;
    case 12:
      return 12;
    default:
      return null;
  }
}
