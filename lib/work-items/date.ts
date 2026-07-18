const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function todayInSeoul(now = new Date()) {
  return dateFormatter.format(now);
}

export function formatSeoulDateTime(value: string | Date) {
  const parts = dateTimeFormatter.formatToParts(typeof value === "string" ? new Date(value) : value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}. ${part("month")}. ${part("day")}. ${part("hour")}:${part("minute")}:${part("second")}`;
}

export function monthRange(date: string) {
  const [year = 1970, month = 1] = date.split("-").map(Number);
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { first, last: `${year}-${String(month).padStart(2, "0")}-${lastDay}` };
}

export function addCalendarDays(date: string, days: number): string {
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function weekRange(date: string) {
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const first = addCalendarDays(date, weekday === 0 ? -6 : 1 - weekday);
  return { first, last: addCalendarDays(first, 6) };
}

export function shiftCalendarMonth(date: string, offset: number): string {
  const [year = 1970, month = 1] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));
  const targetMonth = shifted.getUTCMonth() + 1;
  const targetYear = shifted.getUTCFullYear();
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const day = Math.min(Number(date.slice(8, 10)) || 1, lastDay);
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function seoulDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time.slice(0, 5)}:00+09:00`);
}
