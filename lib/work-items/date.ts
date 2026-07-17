const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayInSeoul(now = new Date()) {
  return dateFormatter.format(now);
}

export function monthRange(date: string) {
  const [year = 1970, month = 1] = date.split("-").map(Number);
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { first, last: `${year}-${String(month).padStart(2, "0")}-${lastDay}` };
}
