"use client";

import { useEffect, useRef, useState } from "react";

import { CalendarEntry, type MovableCalendarItem } from "@/components/calendar/calendar-entry";
import { useCalendarPreferences } from "@/components/calendar/calendar-preferences-provider";
import { StickerManagementButton } from "@/components/calendar/sticker-management-button";
import { CalendarDateSticker } from "@/components/calendar/calendar-date-sticker";
import { calendarStickerByKey } from "@/lib/calendar-stickers/catalog";
import { calendarMonthCells, weekdayLabels } from "@/lib/calendar/preferences";
import { taskCalendarDate } from "@/lib/calendar/smart-calendar";
import { resolveEventType } from "@/lib/work-items/event-types";
import { addCalendarDays, todayInSeoul } from "@/lib/work-items/date";
import type { CalendarStickerRow, EventRow, TaskRow } from "@/types/database";

type CalendarDisplayItem =
  | { readonly id: string; readonly item: EventRow; readonly kind: "event"; readonly order: number; readonly priority: number; readonly time: string | null }
  | { readonly id: string; readonly item: TaskRow; readonly kind: "task"; readonly order: number; readonly priority: number; readonly time: null }
  | { readonly id: string; readonly item: CalendarStickerRow; readonly kind: "sticker"; readonly order: number; readonly priority: number; readonly time: null };

type MobileSummaryTone = "academic" | "health" | "holiday" | "personal" | "school" | "tournament" | "work" | "workout";

interface Props { readonly dragEnabled?: boolean; readonly events?: EventRow[]; readonly highlight?: string | undefined; readonly month?: string; readonly onDropDate?: (value: { readonly id: string; readonly kind: "event" | "task"; readonly date: string; readonly newDate: string }) => void; readonly onMove?: ((value: MovableCalendarItem) => void) | undefined; readonly onSelectDate?: (date: string) => void; readonly schoolStickers?: CalendarStickerRow[]; readonly selectedDate?: string; readonly tasks?: TaskRow[]; readonly today?: string; readonly visibleItemLimit?: number }

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

function mobileSummaryTone(displayItem: CalendarDisplayItem): MobileSummaryTone {
  if (displayItem.kind === "event") {
    return displayItem.item.sticker_key
      ? calendarStickerByKey(displayItem.item.sticker_key)?.pack ?? resolveEventType(displayItem.item)
      : resolveEventType(displayItem.item);
  }
  if (displayItem.kind === "sticker") return calendarStickerByKey(displayItem.item.sticker_key)?.pack ?? "school";
  if (displayItem.item.area === "schoolSchedule") return "school";
  if (displayItem.item.area === "personal") return "personal";
  if (displayItem.item.area === "exercise") return "workout";
  return "work";
}

function mobileSummaryTitle(displayItem: CalendarDisplayItem): string {
  return displayItem.kind === "sticker" ? displayItem.item.label : displayItem.item.title;
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

function useDesktopDragEnabled(override?: boolean): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (override !== undefined) return;
    const update = () => setEnabled(window.innerWidth >= 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [override]);
  return override ?? enabled;
}

function StickerCalendarItem({ date, highlighted, sticker }: { readonly date: string; readonly highlighted: boolean; readonly sticker: CalendarStickerRow }) {
  const pack = calendarStickerByKey(sticker.sticker_key)?.pack ?? "school";
  return <StickerManagementButton date={date} label={sticker.label} recordId={sticker.id} recordType="calendar">
    <span className={`calendar-item calendar-item--sticker calendar-item--${pack}${highlighted ? " is-highlighted" : ""}`}>
      <span aria-hidden="true" className="calendar-item__indicator" />
      <span aria-hidden="true" className="calendar-item__sticker-icon"><CalendarDateSticker compact stickerKey={sticker.sticker_key} /></span>
      <span className="calendar-item__title">{sticker.label}</span>
    </span>
  </StickerManagementButton>;
}

function EventStickerCalendarItem({ canDrag, date, event, highlighted, onDragStateChange }: {
  readonly canDrag: boolean;
  readonly date: string;
  readonly event: EventRow;
  readonly highlighted: boolean;
  readonly onDragStateChange: (dragging: boolean) => void;
}) {
  const stickerKey = event.sticker_key;
  if (!stickerKey) return null;
  const definition = calendarStickerByKey(stickerKey);
  const pack = definition?.pack ?? "school";
  const timePrefix = !event.is_all_day ? event.start_time?.slice(0, 5) : null;
  const draggable = canDrag && event.start_date === event.end_date && !event.recurrence_frequency;
  return <StickerManagementButton date={date} event={event} label={event.title} recordId={event.id} recordType="event">
    <span
      className={`calendar-item calendar-item--sticker calendar-item--${pack}${highlighted ? " is-highlighted" : ""}`}
      draggable={draggable}
      onDragEnd={() => onDragStateChange(false)}
      onDragStart={(dragEvent) => {
        if (!draggable) return;
        onDragStateChange(true);
        dragEvent.dataTransfer.effectAllowed = "move";
        dragEvent.dataTransfer.setData("application/x-bogunon-calendar", JSON.stringify({ id: event.id, kind: "event", date: event.start_date }));
      }}
    >
      <span aria-hidden="true" className="calendar-item__indicator" />
      <span aria-hidden="true" className="calendar-item__sticker-icon"><CalendarDateSticker compact showLabel={false} stickerKey={stickerKey} /></span>
      <span className="calendar-item__title">{timePrefix ? `${timePrefix} ${event.title}` : event.title}</span>
    </span>
  </StickerManagementButton>;
}

export function FullMonthCalendar({ dragEnabled, events = [], highlight, month = "2026-07", onDropDate, onMove, onSelectDate, schoolStickers = [], selectedDate, tasks = [], today = todayInSeoul(), visibleItemLimit }: Props) {
  const { weekStart } = useCalendarPreferences();
  const [year = 1970, monthNumber = 1] = month.split("-").map(Number);
  const monthCells = calendarMonthCells(month, weekStart);
  const firstInMonthIndex = monthCells.findIndex((date) => date !== null);
  const gridFirstDate = addCalendarDays(`${month}-01`, -firstInMonthIndex);
  const cells = monthCells.map((_, index) => addCalendarDays(gridFirstDate, index));
  const weekdays = weekdayLabels(weekStart);
  const weekCount = cells.length / 7;
  const { calendarRef, limit: responsiveLimit } = useResponsiveItemLimit(weekCount);
  const canDrag = useDesktopDragEnabled(dragEnabled);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const itemLimit = visibleItemLimit ?? responsiveLimit;

  return <section className="full-calendar" aria-label={`${year}년 ${monthNumber}월 월간 캘린더`} data-visible-item-limit={itemLimit} data-week-count={weekCount} ref={calendarRef} role="grid">
    <div className="full-calendar__weekdays" role="row">{weekdays.map((weekday) => <span className={weekday === "일" ? "is-sunday" : weekday === "토" ? "is-saturday" : undefined} key={weekday} role="columnheader">{weekday}</span>)}</div>
    <div className="full-calendar__grid" role="rowgroup">{Array.from({ length: weekCount }, (_, weekIndex) => <div className="full-calendar__row" key={weekIndex} role="row">{cells.slice(weekIndex * 7, weekIndex * 7 + 7).map((date, index) => {
      const inMonth = date.slice(0, 7) === month;
      const day = Number(date.slice(-2));
      const dayEvents = events.filter((event) => event.start_date <= date && event.end_date >= date);
      const dayTasks = tasks.filter((task) => taskCalendarDate(task) === date);
      const dayStickers = schoolStickers.filter((item) => item.sticker_date <= date && (item.end_date ?? item.sticker_date) >= date);
      const items = displayItems(dayEvents, dayTasks, dayStickers);
      const visibleItems = items.slice(0, itemLimit);
      const hidden = items.length - visibleItems.length;
      const mobileSummaryItems = items.slice(0, 1);
      const mobileHidden = items.length - mobileSummaryItems.length;
      const weekday = inMonth ? new Date(`${date}T00:00:00Z`).getUTCDay() : -1;
      return <div
        aria-label={`${date}, 일정 ${dayEvents.length}개, 업무 ${dayTasks.length}개, 스티커 ${dayStickers.length}개`}
        className={`full-calendar__cell${inMonth ? "" : " is-outside-month"}${date === today ? " is-today" : ""}${date === selectedDate ? " is-selected" : ""}${dropTarget === date ? " is-drop-target" : ""}${weekday === 0 ? " is-sunday" : weekday === 6 ? " is-saturday" : ""}`}
        key={`${date}-${index}`}
        onDragEnter={(event) => {
          if (!draggedId) return;
          event.preventDefault();
          setDropTarget(date);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null);
        }}
        onDragOver={(event) => {
          if (!draggedId) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDropTarget(null);
          const raw = event.dataTransfer.getData("application/x-bogunon-calendar");
          if (!raw) return;
          try {
            const moved = JSON.parse(raw) as { id: string; kind: "event" | "task"; date: string };
            onDropDate?.({ ...moved, newDate: date });
          } catch {
            return;
          }
        }}
        role="gridcell"
      >
        <div className="full-calendar__day-header">
          <button aria-label={`${date} 선택`} className="calendar-date-button" onClick={() => onSelectDate?.(date)} type="button"><time dateTime={date}>{day}</time></button>
        </div>
        <div className="full-calendar__event-list">
          {visibleItems.length > 0 && <div className="calendar-cell-items">{visibleItems.map((displayItem) => displayItem.kind === "sticker"
            ? <StickerCalendarItem date={date} highlighted={highlight === `sticker:${displayItem.id}`} key={`sticker-${displayItem.id}`} sticker={displayItem.item} />
            : displayItem.kind === "event" && displayItem.item.sticker_key
              ? <EventStickerCalendarItem
                  canDrag={canDrag}
                  date={date}
                  event={displayItem.item}
                  highlighted={highlight === `event:${displayItem.id}`}
                  key={`event-sticker-${displayItem.id}`}
                  onDragStateChange={(dragging) => {
                    setDraggedId(dragging ? displayItem.id : null);
                    if (!dragging) setDropTarget(null);
                  }}
                />
              : <CalendarEntry
                compact
                dragEnabled={canDrag
                  && displayItem.kind === "event"
                  && displayItem.item.start_date === displayItem.item.end_date
                  && !displayItem.item.recurrence_frequency}
                highlighted={highlight === `${displayItem.kind}:${displayItem.id}`}
                item={displayItem.item}
                key={`${displayItem.kind}-${displayItem.id}`}
                kind={displayItem.kind}
                onDragStateChange={(dragging) => {
                  setDraggedId(dragging ? displayItem.id : null);
                  if (!dragging) setDropTarget(null);
                }}
                onMove={onMove}
                showStickerIcon
                showTime
              />)}</div>}
          {mobileSummaryItems.length > 0 && <div aria-label={`${date} 일정 ${items.length}개 요약`} className="full-calendar__mobile-summary">
            {mobileSummaryItems.map((displayItem) => <span className="full-calendar__mobile-summary-item" key={`mobile-${displayItem.kind}-${displayItem.id}`}>
              <span aria-hidden="true" className={`full-calendar__mobile-dot full-calendar__mobile-dot--${mobileSummaryTone(displayItem)}`} />
              <span className="full-calendar__mobile-title">{mobileSummaryTitle(displayItem)}</span>
            </span>)}
            {mobileHidden > 0 && <span aria-label={`나머지 일정 ${mobileHidden}개`} className="full-calendar__mobile-overflow">+{mobileHidden}</span>}
          </div>}
          {hidden > 0 && <button aria-label={`숨겨진 일정 ${hidden}개 모두 보기`} className="calendar-overflow" onClick={() => onSelectDate?.(date)} type="button">+{hidden}</button>}
        </div>
      </div>;
    })}</div>)}</div>
  </section>;
}
