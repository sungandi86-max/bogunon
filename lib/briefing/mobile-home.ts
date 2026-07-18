import type { EventRow } from "@/types/database";

export function sortTodayEvents(events: readonly EventRow[]): EventRow[] {
  return events
    .filter((event) => event.area !== "exercise")
    .toSorted((left, right) => {
      if (left.is_all_day !== right.is_all_day) return left.is_all_day ? -1 : 1;
      return (left.start_time ?? "00:00").localeCompare(right.start_time ?? "00:00");
    });
}

function eventDate(event: EventRow): Date | null {
  if (event.is_all_day || !event.start_time) return null;
  return new Date(`${event.start_date}T${event.start_time.slice(0, 5)}:00+09:00`);
}

function remainingLabel(milliseconds: number): string {
  const minutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours}시간 ${rest}분 후`;
  if (hours) return `${hours}시간 후`;
  if (minutes) return `${minutes}분 후`;
  return "곧 시작";
}

export function nextScheduledEvent(events: readonly EventRow[], now: Date): { readonly event: EventRow; readonly remainingLabel: string } | null {
  const next = sortTodayEvents(events)
    .map((event) => ({ event, start: eventDate(event) }))
    .filter((item): item is { event: EventRow; start: Date } => item.start !== null && item.start.getTime() >= now.getTime())
    .toSorted((left, right) => left.start.getTime() - right.start.getTime())[0];
  return next ? { event: next.event, remainingLabel: remainingLabel(next.start.getTime() - now.getTime()) } : null;
}
