"use client";

import { CalendarDays, CheckSquare2, Dumbbell, MoveRight, Trophy } from "lucide-react";
import { useState } from "react";

import { taskCalendarDate, type CalendarItemKind } from "@/lib/calendar/smart-calendar";
import type { EventRow, TaskRow } from "@/types/database";
import { EVENT_TYPE_LABELS, resolveEventType } from "@/lib/work-items/event-types";

const areaLabel = { healthWork: "업무", schoolSchedule: "학교", exercise: "운동", personal: "개인", project: "업무" } as const;
const areaClass = { healthWork: "", schoolSchedule: "calendar-item--school", exercise: "calendar-item--exercise", personal: "calendar-item--personal", project: "" } as const;

export type MovableCalendarItem = { readonly item: EventRow | TaskRow; readonly kind: CalendarItemKind; readonly date: string };

export function CalendarEntry({
  compact = false,
  dragEnabled = false,
  highlighted = false,
  item,
  kind,
  onDragStateChange,
  onMove,
  showTime = false,
}: {
  readonly compact?: boolean;
  readonly dragEnabled?: boolean;
  readonly highlighted?: boolean;
  readonly item: EventRow | TaskRow;
  readonly kind: CalendarItemKind;
  readonly onDragStateChange?: ((dragging: boolean) => void) | undefined;
  readonly onMove?: ((value: MovableCalendarItem) => void) | undefined;
  readonly showTime?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const date = kind === "event" ? (item as EventRow).start_date : taskCalendarDate(item as TaskRow);
  if (!date) return null;
  const value = { item, kind, date };
  const eventType = kind === "event" ? resolveEventType(item as EventRow) : null;
  const timePrefix = showTime && kind === "event" && !(item as EventRow).is_all_day ? (item as EventRow).start_time?.slice(0, 5) : null;
  const categoryClass = eventType ? `calendar-item--event-${eventType}` : areaClass[item.area];
  const categoryLabel = eventType ? EVENT_TYPE_LABELS[eventType] : areaLabel[item.area];
  const CategoryIcon = eventType === "workout" ? Dumbbell : eventType === "tournament" ? Trophy : CalendarDays;
  return <div className={`calendar-item calendar-item--${kind} ${categoryClass}${highlighted ? " is-highlighted" : ""}${compact ? " is-compact" : ""}${dragging ? " is-dragging" : ""}`} draggable={dragEnabled} onDragEnd={() => {
    setDragging(false);
    onDragStateChange?.(false);
  }} onDragStart={(event) => {
    if (!dragEnabled) return;
    setDragging(true);
    onDragStateChange?.(true);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-bogunon-calendar", JSON.stringify({ id: item.id, kind, date }));
  }}>
    {kind === "event" ? <CategoryIcon aria-hidden="true" size={11} /> : <CheckSquare2 aria-hidden="true" size={11} />}
    <span className="calendar-item__area">{categoryLabel}</span><span className="calendar-item__title">{timePrefix ? `${timePrefix} ${item.title}` : item.title}</span>
    {onMove && <button aria-label={`${item.title} 날짜 변경`} className="calendar-item__move" onClick={() => onMove(value)} type="button"><MoveRight aria-hidden="true" size={13} /></button>}
  </div>;
}
