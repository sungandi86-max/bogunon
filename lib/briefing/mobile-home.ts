import { addCalendarDays, seoulDateTime, todayInSeoul } from "@/lib/work-items/date";
import type { EventRow } from "@/types/database";

export function sortTodayEvents(events: readonly EventRow[], now?: Date): EventRow[] {
  return events
    .filter((event) => event.area !== "exercise")
    .toSorted((left, right) => {
      const leftStart = eventStart(left);
      const leftEnd = eventEnd(left);
      const rightStart = eventStart(right);
      const rightEnd = eventEnd(right);
      const leftStarted = Boolean(now && leftStart && leftStart <= now && leftEnd && leftEnd > now);
      const rightStarted = Boolean(now && rightStart && rightStart <= now && rightEnd && rightEnd > now);
      if (leftStarted !== rightStarted) return leftStarted ? -1 : 1;
      if (left.is_all_day !== right.is_all_day) return left.is_all_day ? 1 : -1;
      return (left.start_time ?? "99:99").localeCompare(right.start_time ?? "99:99");
    });
}

function eventStart(event: EventRow): Date | null {
  if (event.is_all_day || !event.start_time) return null;
  return seoulDateTime(event.start_date, event.start_time);
}

function eventEnd(event: EventRow): Date | null {
  if (event.is_all_day || !event.end_time) return null;
  const endDate = event.end_time.slice(0, 5) < (event.start_time?.slice(0, 5) ?? "00:00")
    ? addCalendarDays(event.end_date, 1)
    : event.end_date;
  return seoulDateTime(endDate, event.end_time);
}

function minuteLabel(milliseconds: number): string {
  const minutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours}시간 ${rest}분`;
  if (hours) return `${hours}시간`;
  return `${minutes}분`;
}

export interface NextScheduledEvent {
  readonly event: EventRow;
  readonly remainingLabel: string;
  readonly state: "upcoming" | "inProgress";
}

export function nextScheduledEvent(events: readonly EventRow[], now: Date): NextScheduledEvent | null {
  const timed = events.filter((event) => event.area !== "exercise" && !event.is_all_day && event.start_time)
    .map((event) => ({ event, start: eventStart(event), end: eventEnd(event) }))
    .filter((item): item is { event: EventRow; start: Date; end: Date | null } => item.start !== null)
    .toSorted((left, right) => left.start.getTime() - right.start.getTime());
  const active = timed.find((item) => item.start <= now && item.end !== null && item.end > now);
  if (active?.end) return { event: active.event, remainingLabel: `진행 중 · 종료까지 ${minuteLabel(active.end.getTime() - now.getTime())}`, state: "inProgress" };
  const next = timed.find((item) => item.start >= now);
  if (!next) return null;
  const today = todayInSeoul(now);
  const prefix = next.event.start_date === today ? "" : next.event.start_date === addCalendarDays(today, 1) ? "내일 · " : `${next.event.start_date.slice(5).replace("-", ".")} · `;
  return { event: next.event, remainingLabel: `${prefix}${minuteLabel(next.start.getTime() - now.getTime())} 후`, state: "upcoming" };
}
