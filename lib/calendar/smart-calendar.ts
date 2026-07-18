import { calendarStickerByKey } from "@/lib/calendar-stickers/catalog";
import { addCalendarDays, monthRange, shiftCalendarMonth } from "@/lib/work-items/date";
import { DEFAULT_CALENDAR_WEEK_START, calendarWeekRange, type CalendarWeekStart } from "@/lib/calendar/preferences";
import type { CalendarStickerRow, EventRow, TaskRow } from "@/types/database";

export type CalendarView = "month" | "week";
export type CalendarItemKind = "event" | "task";
export type CalendarMoveScope = "instance" | "following" | "series";

export interface CalendarSearchResult {
  readonly id: string;
  readonly kind: "event" | "task" | "sticker";
  readonly title: string;
  readonly date: string;
  readonly time: string | null;
  readonly area: EventRow["area"] | TaskRow["area"] | "sticker";
}

export function calendarRange(date: string, view: CalendarView, weekStart: CalendarWeekStart = DEFAULT_CALENDAR_WEEK_START) {
  return view === "month" ? monthRange(date) : calendarWeekRange(date, weekStart);
}

export function shiftCalendarPeriod(date: string, view: CalendarView, offset: number): string {
  return view === "month" ? shiftCalendarMonth(date, offset) : addCalendarDays(date, offset * 7);
}

export function dateSpan(start: string, end: string): string[] {
  const values: string[] = [];
  for (let date = start; date <= end; date = addCalendarDays(date, 1)) values.push(date);
  return values;
}

export function taskCalendarDate(task: TaskRow): string | null {
  return task.scheduled_date ?? task.due_date;
}

function includesQuery(values: readonly (string | null | undefined)[], query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  return normalized.length > 0 && values.some((value) => value?.toLocaleLowerCase("ko-KR").includes(normalized));
}

export function searchCalendar(
  query: string,
  events: readonly EventRow[],
  tasks: readonly TaskRow[],
  stickers: readonly CalendarStickerRow[],
): CalendarSearchResult[] {
  if (!query.trim()) return [];
  const eventResults = events.filter((event) => includesQuery([event.title, event.description, event.memo, event.location], query)).map((event) => ({
    id: event.id, kind: "event" as const, title: event.title, date: event.start_date,
    time: event.is_all_day ? null : event.start_time?.slice(0, 5) ?? null, area: event.area,
  }));
  const taskResults = tasks.filter((task) => includesQuery([task.title, task.description, task.memo], query)).flatMap((task) => {
    const date = taskCalendarDate(task);
    return date ? [{ id: task.id, kind: "task" as const, title: task.title, date, time: null, area: task.area }] : [];
  });
  const stickerResults = stickers.flatMap((sticker) => {
    const definition = calendarStickerByKey(sticker.sticker_key);
    if (!includesQuery([definition?.label, sticker.label, sticker.note], query)) return [];
    return [{ id: sticker.id, kind: "sticker" as const, title: sticker.label || definition?.label || "날짜 스티커", date: sticker.sticker_date, time: null, area: "sticker" as const }];
  });
  return [...eventResults, ...taskResults, ...stickerResults].toSorted((left, right) => left.date.localeCompare(right.date) || (left.time ?? "99:99").localeCompare(right.time ?? "99:99"));
}
