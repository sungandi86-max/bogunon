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
