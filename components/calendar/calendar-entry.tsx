"use client";

import { CalendarDays, CheckSquare2, MoveRight } from "lucide-react";

import { taskCalendarDate, type CalendarItemKind } from "@/lib/calendar/smart-calendar";
import type { EventRow, TaskRow } from "@/types/database";

const areaLabel = { healthWork: "업무", schoolSchedule: "학교", exercise: "운동", personal: "개인", project: "업무" } as const;
const areaClass = { healthWork: "", schoolSchedule: "calendar-item--school", exercise: "calendar-item--exercise", personal: "calendar-item--personal", project: "" } as const;

export type MovableCalendarItem = { readonly item: EventRow | TaskRow; readonly kind: CalendarItemKind; readonly date: string };

export function CalendarEntry({ compact = false, highlighted = false, item, kind, onMove, showTime = false }: { readonly compact?: boolean; readonly highlighted?: boolean; readonly item: EventRow | TaskRow; readonly kind: CalendarItemKind; readonly onMove?: ((value: MovableCalendarItem) => void) | undefined; readonly showTime?: boolean }) {
  const date = kind === "event" ? (item as EventRow).start_date : taskCalendarDate(item as TaskRow);
  if (!date) return null;
  const value = { item, kind, date };
  const movable = item.area !== "exercise";
  const timePrefix = showTime && kind === "event" && !(item as EventRow).is_all_day ? (item as EventRow).start_time?.slice(0, 5) : null;
  return <div className={`calendar-item ${areaClass[item.area]}${highlighted ? " is-highlighted" : ""}${compact ? " is-compact" : ""}`} draggable={movable} onDragStart={(event) => {
    if (!movable) return;
    event.dataTransfer.setData("application/x-bogunon-calendar", JSON.stringify({ id: item.id, kind, date }));
  }}>
    {kind === "event" ? <CalendarDays aria-hidden="true" size={11} /> : <CheckSquare2 aria-hidden="true" size={11} />}
    <span className="calendar-item__area">{areaLabel[item.area]}</span><span className="calendar-item__title">{timePrefix ? `${timePrefix} ${item.title}` : item.title}</span>
    {movable && onMove && <button aria-label={`${item.title} 날짜 변경`} className="calendar-item__move" onClick={() => onMove(value)} type="button"><MoveRight aria-hidden="true" size={13} /></button>}
  </div>;
}
