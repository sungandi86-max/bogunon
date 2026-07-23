import type { CalendarDateRuleKind, CalendarTemplatePack, MonthNumber, Weekday } from "@/lib/calendar-generator/types";

export const MIN_SUPPORTED_YEAR = 2000;
export const MAX_SUPPORTED_YEAR = 2100;

export const SUPPORTED_CALENDAR_PACKS = ["holiday", "academic", "health"] as const satisfies readonly CalendarTemplatePack[];

export const CALENDAR_DATE_RULE_KINDS = [
  "fixed",
  "nth-weekday",
  "last-weekday",
  "relative",
  "explicit",
  "range",
  "month-list",
] as const satisfies readonly CalendarDateRuleKind[];

export const MONTH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const satisfies readonly MonthNumber[];

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const satisfies readonly Weekday[];
