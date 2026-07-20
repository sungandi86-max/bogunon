import type { TemplateDefinition } from "@/lib/work-items/workflow";
import type { CalendarStickerRow, EventRow, TaskRow } from "@/types/database";

export type TimeGridKind = "event" | "task" | "sticker";

export type AllDayGridItem = {
  readonly date: string;
  readonly id: string;
  readonly kind: TimeGridKind;
  readonly title: string;
  readonly colorKey: string;
};

export type TimedGridItem = AllDayGridItem & {
  readonly kind: "event";
  readonly startMinute: number;
  readonly endMinute: number;
  readonly startTime: string;
  readonly endTime: string;
};

export type PositionedTimedItem = TimedGridItem & {
  readonly column: number;
  readonly columnCount: number;
};

type TimeGridInput = {
  readonly dates: readonly string[];
  readonly events: readonly EventRow[];
  readonly tasks: readonly TaskRow[];
  readonly stickers: readonly CalendarStickerRow[];
};

function minuteOf(time: string): number {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function formatGridTime(minute: number): string {
  const bounded = Math.max(0, Math.min(24 * 60, minute));
  return `${String(Math.floor(bounded / 60)).padStart(2, "0")}:${String(bounded % 60).padStart(2, "0")}`;
}

function eventColor(event: EventRow): string {
  return event.color_key ?? (event.area === "personal" ? "lavender" : event.area === "schoolSchedule" ? "yellow" : "mint");
}

export function buildTimeGridItems(input: TimeGridInput): { readonly allDay: readonly AllDayGridItem[]; readonly timed: readonly TimedGridItem[] } {
  const dateSet = new Set(input.dates);
  const timed: TimedGridItem[] = [];
  const allDay: AllDayGridItem[] = [];
  for (const event of input.events) {
    for (const date of input.dates) {
      if (date < event.start_date || date > event.end_date) continue;
      if (!event.is_all_day && event.start_time) {
        const startMinute = minuteOf(event.start_time);
        const parsedEnd = event.end_time ? minuteOf(event.end_time) : startMinute + 60;
        const endMinute = parsedEnd > startMinute ? parsedEnd : startMinute + 60;
        timed.push({ date, id: event.id, kind: "event", title: event.title, colorKey: eventColor(event), startMinute, endMinute, startTime: formatGridTime(startMinute), endTime: formatGridTime(endMinute) });
      } else {
        allDay.push({ date, id: event.id, kind: "event", title: event.title, colorKey: eventColor(event) });
      }
    }
  }
  for (const task of input.tasks) {
    const date = task.scheduled_date ?? task.due_date;
    if (date && dateSet.has(date)) allDay.push({ date, id: task.id, kind: "task", title: task.title, colorKey: "navy" });
  }
  for (const sticker of input.stickers) {
    for (const date of input.dates) {
      if (date >= sticker.sticker_date && date <= (sticker.end_date ?? sticker.sticker_date)) {
        allDay.push({ date, id: sticker.id, kind: "sticker", title: sticker.label, colorKey: "sticker" });
      }
    }
  }
  return {
    allDay: allDay.toSorted((left, right) => ({ event: 0, task: 1, sticker: 2 }[left.kind] - { event: 0, task: 1, sticker: 2 }[right.kind])),
    timed: timed.toSorted((left, right) => left.date.localeCompare(right.date) || left.startMinute - right.startMinute || left.endMinute - right.endMinute),
  };
}

export function layoutTimedItems(items: readonly TimedGridItem[]): readonly PositionedTimedItem[] {
  const sorted = [...items].sort((left, right) => left.date.localeCompare(right.date) || left.startMinute - right.startMinute || left.endMinute - right.endMinute);
  const positioned: PositionedTimedItem[] = [];
  let group: Array<TimedGridItem & { readonly column: number }> = [];
  let groupEnd = -1;
  const flush = () => {
    const columnCount = group.reduce((maximum, item) => Math.max(maximum, item.column + 1), 1);
    positioned.push(...group.map((item) => ({ ...item, columnCount })));
    group = [];
    groupEnd = -1;
  };
  for (const item of sorted) {
    if (group.length > 0 && (item.date !== group[0]?.date || item.startMinute >= groupEnd)) flush();
    const occupied = new Set(group.filter((candidate) => candidate.endMinute > item.startMinute).map((candidate) => candidate.column));
    let column = 0;
    while (occupied.has(column)) column += 1;
    group.push({ ...item, column });
    groupEnd = Math.max(groupEnd, item.endMinute);
  }
  if (group.length > 0) flush();
  return positioned;
}

export function seoulDateTime(value = new Date()): { readonly date: string; readonly minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value ?? 0);
  return { date: `${part("year")}-${String(part("month")).padStart(2, "0")}-${String(part("day")).padStart(2, "0")}`, minute: part("hour") * 60 + part("minute") };
}

export function createSlotDraft(date: string, minute: number): TemplateDefinition {
  const startMinute = Math.max(0, Math.min(23 * 60, Math.floor(minute / 30) * 30));
  return { key: `calendar-slot-${date}-${startMinute}`, name: "시간 일정", kind: "event", area: "healthWork", category: "event", title: "", description: "", priority: "normal", estimatedMinutes: 60, recommendedTiming: "선택한 시간", recurrenceFrequency: null, checklist: [], memo: "", startDate: date, endDate: date, startTime: formatGridTime(startMinute), endTime: formatGridTime(startMinute + 60), isAllDay: false };
}

export function moveTimedItemDraft(item: Pick<TimedGridItem, "date" | "startMinute" | "endMinute">, date: string, startMinute: number): { readonly date: string; readonly startTime: string; readonly endTime: string } {
  const duration = Math.max(30, item.endMinute - item.startMinute);
  const boundedStart = Math.max(0, Math.min(24 * 60 - duration, Math.floor(startMinute / 30) * 30));
  return { date, startTime: formatGridTime(boundedStart), endTime: formatGridTime(boundedStart + duration) };
}
