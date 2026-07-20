"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { moveCalendarEventTimeAction } from "@/app/(app)/work-item-actions";
import { buildTimeGridItems, layoutTimedItems, moveTimedItemDraft, seoulDateTime, type AllDayGridItem, type PositionedTimedItem } from "@/lib/calendar/time-grid";
import { calendarWeekRange } from "@/lib/calendar/preferences";
import { dateSpan } from "@/lib/calendar/smart-calendar";
import type { CalendarStickerRow, EventRow, TaskRow } from "@/types/database";

type Props = {
  readonly date: string;
  readonly events: readonly EventRow[];
  readonly mode: "week" | "day";
  readonly onSelectDate: (date: string) => void;
  readonly onSelectItem: (item: AllDayGridItem) => void;
  readonly onSelectSlot: (date: string, minute: number) => void;
  readonly selectedDate: string;
  readonly stickers: readonly CalendarStickerRow[];
  readonly tasks: readonly TaskRow[];
  readonly today: string;
};

const HOUR_START = 8;
const HOUR_END = 20;
const HOUR_HEIGHT = 64;
const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "Asia/Seoul" });
const draggedItemSchema = z.object({ id: z.string(), date: z.string(), startMinute: z.number(), endMinute: z.number() });

function parseDraggedItem(raw: string) {
  try {
    return draggedItemSchema.safeParse(JSON.parse(raw));
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

function dateLabel(date: string): string {
  return weekday.format(new Date(`${date}T00:00:00+09:00`));
}

function AllDayLane({ dates, items, onSelectItem }: { readonly dates: readonly string[]; readonly items: readonly AllDayGridItem[]; readonly onSelectItem: Props["onSelectItem"] }) {
  return <div className="time-calendar__all-day"><strong>종일</strong><div className="time-calendar__all-day-grid" style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }}>{dates.map((date) => <div key={date}>{items.filter((item) => item.date === date).map((item) => <button className={`time-calendar__all-day-item is-${item.kind}`} key={`${item.kind}-${item.id}`} onClick={() => onSelectItem(item)} type="button"><span aria-hidden="true" />{item.title}</button>)}</div>)}</div></div>;
}

function TimedBlock({ item, onSelectItem }: { readonly item: PositionedTimedItem; readonly onSelectItem: Props["onSelectItem"] }) {
  const visibleStart = Math.max(item.startMinute, HOUR_START * 60);
  const visibleEnd = Math.min(item.endMinute, HOUR_END * 60);
  if (visibleEnd <= visibleStart) return null;
  const style = {
    top: ((visibleStart - HOUR_START * 60) / 60) * HOUR_HEIGHT,
    height: Math.max(34, ((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT),
    left: `${(item.column / item.columnCount) * 100}%`,
    width: `${100 / item.columnCount}%`,
  };
  return <button className={`time-calendar__event is-${item.colorKey}`} draggable onClick={() => onSelectItem(item)} onDragStart={(event) => event.dataTransfer.setData("application/x-bogunon-time-event", JSON.stringify(item))} style={style} type="button"><strong>{item.title}</strong><span>{item.startTime}–{item.endTime}</span></button>;
}

export function TimeGridCalendar({ date, events, mode, onSelectDate, onSelectItem, onSelectSlot, selectedDate, stickers, tasks, today }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const week = calendarWeekRange(date, "monday");
  const dates = useMemo(() => mode === "week" ? dateSpan(week.first, week.last) : [date], [date, mode, week.first, week.last]);
  const model = useMemo(() => buildTimeGridItems({ dates, events, tasks, stickers }), [dates, events, stickers, tasks]);
  const positioned = useMemo(() => layoutTimedItems(model.timed), [model.timed]);
  const now = seoulDateTime();
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, index) => HOUR_START + index);
  const dropTimedItem = (targetDate: string, targetMinute: number, raw: string) => {
    if (!raw) return;
    const parsed = parseDraggedItem(raw);
    if (!parsed?.success) return;
    const item = parsed.data;
    const moved = moveTimedItemDraft(item, targetDate, targetMinute);
    const formData = new FormData();
    formData.set("id", item.id); formData.set("date", moved.date); formData.set("startTime", moved.startTime); formData.set("endTime", moved.endTime);
    startTransition(async () => { const result = await moveCalendarEventTimeAction(formData); if (result.status === "success") router.refresh(); });
  };
  return <section aria-label={mode === "week" ? "주간 시간표" : "일간 시간표"} className={`time-calendar is-${mode}`}>
    <div className="time-calendar__date-strip" aria-label="주간 날짜 선택">{dateSpan(week.first, week.last).map((day) => <button aria-pressed={day === selectedDate} className={`${day === selectedDate ? "is-selected" : ""}${day === today ? " is-today" : ""}`} key={day} onClick={() => onSelectDate(day)} type="button"><span>{dateLabel(day)}</span><strong>{Number(day.slice(8))}</strong></button>)}</div>
    <AllDayLane dates={dates} items={model.allDay} onSelectItem={onSelectItem} />
    <div className="time-calendar__scroll"><div className="time-calendar__hours">{hours.map((hour) => <time dateTime={`${String(hour).padStart(2, "0")}:00`} key={hour}>{String(hour).padStart(2, "0")}:00</time>)}</div><div className="time-calendar__days" style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }}>{dates.map((day) => <div className={`time-calendar__day${day === today ? " is-today" : ""}`} key={day}>{hours.slice(0, -1).map((hour) => <button aria-label={`${day} ${String(hour).padStart(2, "0")}:00 일정 추가`} className="time-calendar__slot" key={hour} onClick={() => onSelectSlot(day, hour * 60)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); dropTimedItem(day, hour * 60, event.dataTransfer.getData("application/x-bogunon-time-event")); }} type="button" />)}{positioned.filter((item) => item.date === day).map((item) => <TimedBlock item={item} key={item.id} onSelectItem={onSelectItem} />)}{day === now.date && now.minute >= HOUR_START * 60 && now.minute <= HOUR_END * 60 && <div aria-label={`현재 시간 ${Math.floor(now.minute / 60)}:${String(now.minute % 60).padStart(2, "0")}`} className="time-calendar__now" style={{ top: ((now.minute - HOUR_START * 60) / 60) * HOUR_HEIGHT }}><span /></div>}</div>)}</div></div>
  </section>;
}
