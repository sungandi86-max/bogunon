"use client";

import { useEffect, useRef, useState } from "react";

import { CalendarEntry, type MovableCalendarItem } from "@/components/calendar/calendar-entry";
import { useCalendarPreferences } from "@/components/calendar/calendar-preferences-provider";
import { StickerManagementButton } from "@/components/calendar/sticker-management-button";
import { calendarStickerByKey } from "@/lib/calendar-stickers/catalog";
import { calendarMonthCells, weekdayLabels } from "@/lib/calendar/preferences";
import { taskCalendarDate } from "@/lib/calendar/smart-calendar";
import { todayInSeoul } from "@/lib/work-items/date";
import type { CalendarStickerRow, EventRow, TaskRow } from "@/types/database";

type CalendarDisplayItem =
  | { readonly id: string; readonly item: EventRow; readonly kind: "event"; readonly order: number; readonly priority: number; readonly time: string | null }
  | { readonly id: string; readonly item: TaskRow; readonly kind: "task"; readonly order: number; readonly priority: number; readonly time: null }
  | { readonly id: string; readonly item: CalendarStickerRow; readonly kind: "sticker"; readonly order: number; readonly priority: number; readonly time: null };

interface Props { readonly events?: EventRow[]; readonly highlight?: string | undefined; readonly month?: string; readonly onDropDate?: (value: { readonly id: string; readonly kind: "event" | "task"; readonly date: string; readonly newDate: string }) => void; readonly onMove?: ((value: MovableCalendarItem) => void) | undefined; readonly onSelectDate?: (date: string) => void; readonly schoolStickers?: CalendarStickerRow[]; readonly selectedDate?: string; readonly tasks?: TaskRow[]; readonly today?: string; readonly visibleItemLimit?: number }

function stickerPriority(sticker: CalendarStickerRow): number {
  const pack = calendarStickerByKey(sticker.sticker_key)?.pack;
  if (pack === "health") return 1;
  if (pack === "academic" || pack === "school") return 2;
  if (pack === "holiday") return 3;
  return 4;
}

function displayItems(events: EventRow[], tasks: TaskRow[], stickers: CalendarStickerRow[]): CalendarDisplayItem[] {
  return [
    ...events.map((item, order) => ({ id: item.id, item, kind: "event" as const, order, priority: 0, time: item.start_time })),
    ...tasks.map((item, order) => ({ id: item.id, item, kind: "task" as const, order: events.length + order, priority: 0, time: null })),
    ...stickers.map((item, order) => ({ id: item.id, item, kind: "sticker" as const, order: events.length + tasks.length + order, priority: stickerPriority(item), time: null })),
  ].sort((left, right) => left.priority - right.priority || (left.time === null ? 1 : 0) - (right.time === null ? 1 : 0) || (left.time ?? "").localeCompare(right.time ?? "") || left.order - right.order);
}

function responsiveItemLimit(weekCount: number, calendarHeight?: number): number {
  if (typeof window === "undefined") return weekCount === 6 ? 1 : 2;
  if (window.innerWidth < 768) return weekCount === 6 && window.innerHeight < 900 ? 1 : 2;
  const cellHeight = ((calendarHeight && calendarHeight > 0 ? calendarHeight : window.innerHeight - 292) - 38) / weekCount;
  if (cellHeight >= 94) return 4;
  if (cellHeight >= 80) return 3;
  if (cellHeight >= 66) return 2;
  return 1;
}

function useResponsiveItemLimit(weekCount: number) {
  const calendarRef = useRef<HTMLElement>(null);
  const [limit, setLimit] = useState(() => weekCount === 6 ? 1 : 2);
  useEffect(() => {
    const update = () => setLimit(responsiveItemLimit(weekCount, calendarRef.current?.getBoundingClientRect().height));
    update();
    window.addEventListener("resize", update);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (calendarRef.current) observer?.observe(calendarRef.current);
    return () => { window.removeEventListener("resize", update); observer?.disconnect(); };
  }, [weekCount]);
  return { calendarRef, limit };
}

function StickerCalendarItem({ date, highlighted, sticker }: { readonly date: string; readonly highlighted: boolean; readonly sticker: CalendarStickerRow }) {
  const pack = calendarStickerByKey(sticker.sticker_key)?.pack ?? "school";
  return <StickerManagementButton date={date} label={sticker.label} recordId={sticker.id} recordType="calendar">
    <span className={`calendar-item calendar-item--sticker calendar-item--${pack}${highlighted ? " is-highlighted" : ""}`}>
      <span aria-hidden="true" className="calendar-item__indicator" />
      <span className="calendar-item__title">{sticker.label}</span>
    </span>
  </StickerManagementButton>;
}

export function FullMonthCalendar({ events = [], highlight, month = "2026-07", onDropDate, onMove, onSelectDate, schoolStickers = [], selectedDate, tasks = [], today = todayInSeoul(), visibleItemLimit }: Props) {
  const { weekStart } = useCalendarPreferences();
  const [year = 1970, monthNumber = 1] = month.split("-").map(Number);
  const cells = calendarMonthCells(month, weekStart);
  const weekdays = weekdayLabels(weekStart);
  const weekCount = cells.length / 7;
  const { calendarRef, limit: responsiveLimit } = useResponsiveItemLimit(weekCount);
  const itemLimit = visibleItemLimit ?? responsiveLimit;

  return <section className="full-calendar" aria-label={`${year}년 ${monthNumber}월 월간 캘린더`} data-visible-item-limit={itemLimit} data-week-count={weekCount} ref={calendarRef} role="grid">
    <div className="full-calendar__weekdays" role="row">{weekdays.map((weekday) => <span className={weekday === "일" ? "is-sunday" : weekday === "토" ? "is-saturday" : undefined} key={weekday} role="columnheader">{weekday}</span>)}</div>
    <div className="full-calendar__grid" role="rowgroup">{Array.from({ length: weekCount }, (_, weekIndex) => <div className="full-calendar__row" key={weekIndex} role="row">{cells.slice(weekIndex * 7, weekIndex * 7 + 7).map((cellDate, index) => {
      const inMonth = cellDate !== null;
      const date = cellDate ?? "";
      const day = inMonth ? Number(date.slice(-2)) : 0;
      const dayEvents = inMonth ? events.filter((event) => event.start_date <= date && event.end_date >= date) : [];
      const dayTasks = inMonth ? tasks.filter((task) => taskCalendarDate(task) === date) : [];
      const dayStickers = inMonth ? schoolStickers.filter((item) => item.sticker_date <= date && (item.end_date ?? item.sticker_date) >= date) : [];
      const items = displayItems(dayEvents, dayTasks, dayStickers);
      const visibleItems = items.slice(0, itemLimit);
      const hidden = items.length - visibleItems.length;
      const weekday = inMonth ? new Date(`${date}T00:00:00Z`).getUTCDay() : -1;
      return <div aria-label={inMonth ? `${date}, 일정 ${dayEvents.length}개, 업무 ${dayTasks.length}개, 스티커 ${dayStickers.length}개` : "다른 달"} className={`full-calendar__cell${date === today ? " is-today" : ""}${date === selectedDate ? " is-selected" : ""}${weekday === 0 ? " is-sunday" : weekday === 6 ? " is-saturday" : ""}`} key={`${date || "empty"}-${index}`} onDragOver={(event) => { if (date) event.preventDefault(); }} onDrop={(event) => { const raw = event.dataTransfer.getData("application/x-bogunon-calendar"); if (!raw || !date) return; try { const moved = JSON.parse(raw) as { id: string; kind: "event" | "task"; date: string }; onDropDate?.({ ...moved, newDate: date }); } catch { return; } }} role="gridcell">
        {inMonth && <button aria-label={`${date} 선택`} className="calendar-date-button" onClick={() => onSelectDate?.(date)} type="button"><time dateTime={date}>{day}</time></button>}
        <div className="calendar-cell-items">{visibleItems.map((displayItem) => displayItem.kind === "sticker"
          ? <StickerCalendarItem date={date} highlighted={highlight === `sticker:${displayItem.id}`} key={`sticker-${displayItem.id}`} sticker={displayItem.item} />
          : <CalendarEntry compact highlighted={highlight === `${displayItem.kind}:${displayItem.id}`} item={displayItem.item} key={`${displayItem.kind}-${displayItem.id}`} kind={displayItem.kind} onMove={onMove} showTime />)}</div>
        {hidden > 0 && <button aria-label={`숨겨진 일정 ${hidden}개 모두 보기`} className="calendar-overflow" onClick={() => onSelectDate?.(date)} type="button">+{hidden}</button>}
      </div>;
    })}</div>)}</div>
  </section>;
}
