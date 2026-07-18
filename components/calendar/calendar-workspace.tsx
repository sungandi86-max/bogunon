"use client";

import { useMemo, useRef, useState } from "react";

import { EventList } from "@/components/calendar/event-list";
import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import { SchoolStickerPicker } from "@/components/calendar/school-sticker-picker";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import type { WorkflowData } from "@/lib/work-items/phase5-repository";
import type { CalendarStickerRow, EventRow, ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

type CalendarFilter = "all" | "work" | "school" | "personal" | "exercise" | "stickers";
const options: ReadonlyArray<[CalendarFilter, string]> = [["all","전체"],["work","업무"],["school","학교"],["personal","개인"],["exercise","운동 기록"],["stickers","날짜 스티커"]];

interface CalendarWorkspaceProps { readonly events: EventRow[]; readonly exerciseLogs: ExerciseLogRow[]; readonly exerciseStickers: ExerciseStickerRow[]; readonly initialStickerOpen?: boolean; readonly month: string; readonly stickers: CalendarStickerRow[]; readonly today: string; readonly workflow: WorkflowData }

export function CalendarWorkspace({ events, exerciseLogs, exerciseStickers, initialStickerOpen = false, month, stickers, today, workflow }: CalendarWorkspaceProps) {
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const [stickerOpen, setStickerOpen] = useState(initialStickerOpen);
  const stickerButtonRef = useRef<HTMLButtonElement>(null);
  const filteredEvents = useMemo(() => events.filter((event) => filter === "all" || (filter === "work" && event.area === "healthWork") || (filter === "school" && event.area === "schoolSchedule") || (filter === "personal" && event.area === "personal")), [events, filter]);
  const showEvents = !["exercise","stickers"].includes(filter);
  const showExercise = filter === "all" || filter === "exercise";
  const showStickers = filter === "all" || filter === "stickers";
  return <>
    <div className="calendar-filter" role="group" aria-label="캘린더 필터">{options.map(([value,label]) => <button aria-pressed={filter === value} key={value} onClick={() => setFilter(value)} type="button">{label}</button>)}<button className="calendar-filter__sticker-action" onClick={() => setStickerOpen(true)} ref={stickerButtonRef} type="button">날짜 스티커 붙이기</button></div>
    <FullMonthCalendar events={showEvents ? filteredEvents : []} exerciseLogs={showExercise ? exerciseLogs : []} exerciseStickers={exerciseStickers} month={month} schoolStickers={showStickers ? stickers : []} today={today} />
    {showEvents && <EventList events={filteredEvents} workflow={workflow} />}
    <ResponsiveDetailPanel onClose={() => setStickerOpen(false)} open={stickerOpen} returnFocusRef={stickerButtonRef} title="날짜 스티커 붙이기"><SchoolStickerPicker stickers={stickers} today={today} /></ResponsiveDetailPanel>
  </>;
}
