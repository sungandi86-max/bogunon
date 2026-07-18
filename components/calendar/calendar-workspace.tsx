"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CalendarMovePanel } from "@/components/calendar/calendar-move-panel";
import type { MovableCalendarItem } from "@/components/calendar/calendar-entry";
import { EventList } from "@/components/calendar/event-list";
import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import { FullWeekCalendar } from "@/components/calendar/full-week-calendar";
import { SchoolStickerPicker } from "@/components/calendar/school-sticker-picker";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { calendarRange, searchCalendar, shiftCalendarPeriod, taskCalendarDate, type CalendarView } from "@/lib/calendar/smart-calendar";
import type { WorkflowData } from "@/lib/work-items/phase5-repository";
import type { CalendarStickerRow, EventRow, ExerciseLogRow, ExerciseStickerRow, TaskRow } from "@/types/database";

type CalendarFilter = "all" | "work" | "school" | "personal" | "exercise" | "stickers";
const options: ReadonlyArray<[CalendarFilter, string]> = [["all","전체"],["work","업무"],["school","학교"],["personal","개인"],["exercise","운동"],["stickers","날짜 스티커"]];

interface Props { readonly events: EventRow[]; readonly exerciseLogs: ExerciseLogRow[]; readonly exerciseStickers: ExerciseStickerRow[]; readonly highlight?: string | undefined; readonly initialDate: string; readonly initialStickerOpen?: boolean; readonly initialView: CalendarView; readonly stickers: CalendarStickerRow[]; readonly tasks: TaskRow[]; readonly today: string; readonly toolbarAction?: ReactNode; readonly workflow: WorkflowData }

export function CalendarWorkspace({ events, exerciseLogs, exerciseStickers, highlight, initialDate, initialStickerOpen = false, initialView, stickers, tasks, today, toolbarAction, workflow }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [stickerOpen, setStickerOpen] = useState(initialStickerOpen);
  const [moveState, setMoveState] = useState<{ readonly value: MovableCalendarItem; readonly newDate?: string } | null>(null);
  const stickerButtonRef = useRef<HTMLButtonElement>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);

  const navigate = useCallback((date: string, view = initialView, nextHighlight?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", date); params.set("view", view);
    if (nextHighlight) params.set("highlight", nextHighlight); else params.delete("highlight");
    router.replace(`/calendar?${params.toString()}`);
  }, [initialView, router, searchParams]);

  useEffect(() => {
    const saved = sessionStorage.getItem("bogunon-calendar-view");
    if (!searchParams.has("view") && (saved === "month" || saved === "week") && saved !== initialView) navigate(initialDate, saved);
  }, [initialDate, initialView, navigate, searchParams]);
  const setView = (view: CalendarView) => { sessionStorage.setItem("bogunon-calendar-view", view); navigate(selectedDate, view); };
  const visibleEvents = useMemo(() => events.filter((event) => filter === "all" || (filter === "work" && event.area === "healthWork") || (filter === "school" && event.area === "schoolSchedule") || (filter === "personal" && event.area === "personal")), [events, filter]);
  const visibleTasks = useMemo(() => tasks.filter((task) => filter === "all" || (filter === "work" && task.area === "healthWork") || (filter === "school" && task.area === "schoolSchedule") || (filter === "personal" && task.area === "personal")), [filter, tasks]);
  const showEntries = filter !== "exercise" && filter !== "stickers";
  const showExercise = filter === "all" || filter === "exercise";
  const showStickers = filter === "all" || filter === "stickers";
  const range = calendarRange(selectedDate, initialView);
  const periodEvents = visibleEvents.filter((event) => event.start_date <= range.last && event.end_date >= range.first);
  const periodTasks = visibleTasks.filter((task) => { const date = taskCalendarDate(task); return Boolean(date && date >= range.first && date <= range.last); });
  const results = useMemo(() => searchCalendar(query, events, tasks, stickers), [events, query, stickers, tasks]);
  const openDropMove = ({ id, kind, date, newDate }: { readonly id: string; readonly kind: "event" | "task"; readonly date: string; readonly newDate: string }) => {
    const item = kind === "event" ? events.find((event) => event.id === id) : tasks.find((task) => task.id === id);
    if (item && date !== newDate) setMoveState({ value: { item, kind, date }, newDate });
  };
  const periodLabel = initialView === "month" ? `${selectedDate.slice(0, 4)}년 ${Number(selectedDate.slice(5, 7))}월` : `${range.first.slice(5).replace("-", ".")} – ${range.last.slice(5).replace("-", ".")}`;

  return <>
    <div className="smart-calendar-toolbar"><div className="smart-calendar-toolbar__period"><button aria-label={initialView === "month" ? "이전 달" : "이전 주"} onClick={() => navigate(shiftCalendarPeriod(selectedDate, initialView, -1))} type="button"><ChevronLeft /></button><strong>{periodLabel}</strong><button aria-label={initialView === "month" ? "다음 달" : "다음 주"} onClick={() => navigate(shiftCalendarPeriod(selectedDate, initialView, 1))} type="button"><ChevronRight /></button><button aria-label="오늘 날짜로 이동" className="button button--secondary" onClick={() => navigate(today)} type="button">오늘</button></div><div className="calendar-view-switch" role="group" aria-label="캘린더 보기"><button aria-pressed={initialView === "month"} className={initialView === "month" ? "is-active" : ""} onClick={() => setView("month")} type="button">월간</button><button aria-pressed={initialView === "week"} className={initialView === "week" ? "is-active" : ""} onClick={() => setView("week")} type="button">주간</button></div>{toolbarAction}</div>
    <div className="calendar-search"><Search aria-hidden="true" size={18} /><input aria-label="캘린더 검색" onChange={(event) => setQuery(event.target.value)} placeholder="일정, 업무, 장소, 날짜 스티커 검색" value={query} />{query && <button aria-label="검색어 지우기" onClick={() => setQuery("")} type="button"><X size={16} /></button>}{query && <div className="calendar-search__results" role="listbox">{results.length ? results.slice(0, 20).map((result) => <button aria-selected="false" key={`${result.kind}-${result.id}`} onClick={() => { setQuery(""); setSelectedDate(result.date); navigate(result.date, initialView, `${result.kind}:${result.id}`); }} role="option" type="button"><strong>{result.title}</strong><span>{result.date}{result.time ? ` · ${result.time}` : ""} · {result.kind === "event" ? "일정" : result.kind === "task" ? "업무" : "날짜 스티커"}</span></button>) : <p>일치하는 일정이나 업무가 없습니다.</p>}</div>}</div>
    <div className="calendar-filter" role="group" aria-label="캘린더 필터">{options.map(([value,label]) => <button aria-pressed={filter === value} key={value} onClick={() => setFilter(value)} type="button">{label}</button>)}<button className="calendar-filter__sticker-action" onClick={() => setStickerOpen(true)} ref={stickerButtonRef} type="button">날짜 스티커 붙이기</button></div>
    {initialView === "month" ? <FullMonthCalendar events={showEntries ? periodEvents : []} exerciseLogs={showExercise ? exerciseLogs : []} exerciseStickers={exerciseStickers} highlight={highlight} month={selectedDate.slice(0, 7)} onDropDate={openDropMove} onMove={(value) => setMoveState({ value })} onSelectDate={setSelectedDate} schoolStickers={showStickers ? stickers : []} selectedDate={selectedDate} tasks={showEntries ? periodTasks : []} today={today} /> : <FullWeekCalendar date={selectedDate} events={showEntries ? periodEvents : []} exerciseLogs={showExercise ? exerciseLogs : []} exerciseStickers={exerciseStickers} highlight={highlight} onDropDate={openDropMove} onMove={(value) => setMoveState({ value })} onSelectDate={setSelectedDate} selectedDate={selectedDate} stickers={showStickers ? stickers : []} tasks={showEntries ? periodTasks : []} today={today} />}
    {showEntries && <EventList events={periodEvents} workflow={workflow} />}
    <ResponsiveDetailPanel onClose={() => setStickerOpen(false)} open={stickerOpen} returnFocusRef={stickerButtonRef} title="날짜 스티커 붙이기"><SchoolStickerPicker stickers={stickers} today={selectedDate} /></ResponsiveDetailPanel>
    <button aria-hidden="true" className="calendar-move-focus" ref={moveButtonRef} tabIndex={-1} type="button" />
    <ResponsiveDetailPanel onClose={() => setMoveState(null)} open={Boolean(moveState)} returnFocusRef={moveButtonRef} title="날짜 변경">{moveState && <CalendarMovePanel move={moveState.value} newDate={moveState.newDate} onComplete={() => setMoveState(null)} />}</ResponsiveDetailPanel>
  </>;
}
