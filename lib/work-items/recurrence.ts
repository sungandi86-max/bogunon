import type { RecurrenceFrequency } from "@/types/database";

interface DateParts {
  readonly day: number;
  readonly month: number;
  readonly year: number;
}

const MAX_OCCURRENCES = 4000;

function parseDate(value: string): DateParts {
  const [yearText = "", monthText = "", dayText = ""] = value.split("-");
  return { year: Number(yearText), month: Number(monthText), day: Number(dayText) };
}

function formatDate({ day, month, year }: DateParts): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDays(value: string, days: number): string {
  const { day, month, year } = parseDate(value);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return formatDate({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

export function shiftFromAnchor(anchor: string, value: string | null, occurrence: string): string | null {
  if (!value) return null;
  const anchorDate = new Date(`${anchor}T00:00:00Z`);
  const valueDate = new Date(`${value}T00:00:00Z`);
  const offsetDays = Math.round((valueDate.getTime() - anchorDate.getTime()) / 86_400_000);
  return addDays(occurrence, offsetDays);
}

export function occurrenceDatesThrough(
  anchor: string,
  through: string,
  frequency: RecurrenceFrequency,
): readonly string[] {
  const results: string[] = [];
  const anchorParts = parseDate(anchor);

  switch (frequency) {
    case "daily":
    case "weekly": {
      const step = frequency === "daily" ? 1 : 7;
      for (let candidate = addDays(anchor, step); candidate <= through; candidate = addDays(candidate, step)) {
        results.push(candidate);
        if (results.length >= MAX_OCCURRENCES) break;
      }
      return results;
    }
    case "monthly": {
      let monthIndex = anchorParts.year * 12 + anchorParts.month;
      while (results.length < MAX_OCCURRENCES) {
        const year = Math.floor(monthIndex / 12);
        const month = (monthIndex % 12) + 1;
        const candidate = formatDate({ year, month, day: anchorParts.day });
        if (candidate > through) break;
        if (anchorParts.day <= daysInMonth(year, month)) results.push(candidate);
        monthIndex += 1;
      }
      return results;
    }
    case "yearly":
      for (let year = anchorParts.year + 1; results.length < MAX_OCCURRENCES; year += 1) {
        const candidate = formatDate({ year, month: anchorParts.month, day: anchorParts.day });
        if (candidate > through) break;
        if (anchorParts.day <= daysInMonth(year, anchorParts.month)) results.push(candidate);
      }
      return results;
  }
}
