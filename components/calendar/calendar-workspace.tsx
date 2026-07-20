"use client";

import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CalendarMovePanel } from "@/components/calendar/calendar-move-panel";
import { useCalendarPreferences } from "@/components/calendar/calendar-preferences-provider";
import type { MovableCalendarItem } from "@/components/calendar/calendar-entry";
import { EventList } from "@/components/calendar/event-list";
import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import { FullWeekCalendar } from "@/components/calendar/full-week-calendar";
import { SchoolStickerPicker } from "@/components/calendar/school-sticker-picker";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { calendarStickerByKey, type CalendarStickerPack } from "@/lib/calendar-stickers/catalog";
import { calendarRange, searchCalendar, shiftCalendarPeriod, taskCalendarDate, type CalendarView } from "@/lib/calendar/smart-calendar";
import type { WorkflowData } from "@/lib/work-items/phase5-repository";
import type { CalendarStickerRow, EventRow, TaskRow } from "@/types/database";

type EntryFilter = "all" | "work" | "school" | "personal";
type StickerFilter = "all" | CalendarStickerPack;
const entryFilterOptions: ReadonlyArray<readonly [EntryFilter, string]> = [["all", "전체"], ["work", "업무"], ["school", "학교"], ["personal", "개인"]];
const stickerFilterOptions: ReadonlyArray<readonly [StickerFilter, string]> = [["all", "전체"], ["school", "학교"], ["academic", "학사일정"], ["health", "보건업무"], ["holiday", "공휴일"], ["personal", "개인"]];

interface Props { readonly events: EventRow[]; readonly highlight?: string | undefined; readonly initialDate: string; readonly initialStickerOpen?: boolean; readonly initialView: CalendarView; readonly stickers: CalendarStickerRow[]; readonly tasks: TaskRow[]; readonly today: string; readonly toolbarAction?: ReactNode; readonly workflow: WorkflowData }

export function CalendarWorkspace({ events, highlight, initialDate, initialStickerOpen = false, initialView, stickers, tasks, today, toolbarAction, workflow }: Props) {
  const { weekStart } = useCalendarPreferences();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryFilter, setEntryFilter] = useState<EntryFilter>("all");
  const [stickerFilter, setStickerFilter] = useState<StickerFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [stickerOpen, setStickerOpen] = useState(initialStickerOpen);
  const [moveState, setMoveState] = useState<{ readonly value: MovableCalendarItem; readonly newDate?: string } | null>(null);
  const stickerButtonRef = useRef<HTMLButtonElement>(null);
  const activeStickerFilterRef = useRef<HTMLButtonElement>(null);
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
  useEffect(() => {
    if (typeof activeStickerFilterRef.current?.scrollIntoView === "function") {
      activeStickerFilterRef.current.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [stickerFilter]);
  const setView = (view: CalendarView) => { sessionStorage.setItem("bogunon-calendar-view", view); navigate(selectedDate, view); };
  const visibleEvents = useMemo(() => events.filter((event) => entryFilter === "all" || (entryFilter === "work" && event.area === "healthWork") || (entryFilter === "school" && event.area === "schoolSchedule") || (entryFilter === "personal" && event.area === "personal")), [entryFilter, events]);
  const visibleTasks = useMemo(() => tasks.filter((task) => entryFilter === "all" || (entryFilter === "work" && task.area === "healthWork") || (entryFilter === "school" && task.area === "schoolSchedule") || (entryFilter === "personal" && task.area === "personal")), [entryFilter, tasks]);
  const visibleStickers = useMemo(() => stickers.filter((item) => stickerFilter === "all" || calendarStickerByKey(item.sticker_key)?.pack === stickerFilter), [stickerFilter, stickers]);
  const range = calendarRange(selectedDate, initialView, weekStart);
  const periodEvents = visibleEvents.filter((event) => event.start_date <= range.last && event.end_date >= range.first);
  const periodTasks = visibleTasks.filter((task) => { const date = taskCalendarDate(task); return Boolean(date && date >= range.first && date <= range.last); });
  const selectedDateEvents = visibleEvents.filter((event) => event.start_date <= selectedDate && event.end_date >= selectedDate);
  const selectedDateTasks = visibleTasks.filter((task) => taskCalendarDate(task) === selectedDate);
  const selectedDateStickers = visibleStickers.filter((sticker) => sticker.sticker_date <= selectedDate && (sticker.end_date ?? sticker.sticker_date) >= selectedDate);
  const results = useMemo(() => searchCalendar(query, events, tasks, stickers), [events, query, stickers, tasks]);
  const openDropMove = ({ id, kind, date, newDate }: { readonly id: string; readonly kind: "event" | "task"; readonly date: string; readonly newDate: string }) => {
    const item = kind === "event" ? events.find((event) => event.id === id) : tasks.find((task) => task.id === id);
    if (item && date !== newDate) setMoveState({ value: { item, kind, date }, newDate });
  };
  const periodLabel = initialView === "month" ? `${selectedDate.slice(0, 4)}년 ${Number(selectedDate.slice(5, 7))}월` : `${range.first.slice(5).replace("-", ".")} – ${range.last.slice(5).replace("-", ".")}`;

  return <>
    <div className="smart-calendar-toolbar"><div className="smart-calendar-toolbar__period"><button aria-label={initialView === "month" ? "이전 달" : "이전 주"} onClick={() => navigate(shiftCalendarPeriod(selectedDate, initialView, -1))} type="button"><ChevronLeft /></button><strong>{periodLabel}</strong><button aria-label={initialView === "month" ? "다음 달" : "다음 주"} onClick={() => navigate(shiftCalendarPeriod(selectedDate, initialView, 1))} type="button"><ChevronRight /></button><button aria-label="오늘 날짜로 이동" className="button button--secondary" onClick={() => navigate(today)} type="button">오늘</button></div><div className="calendar-view-switch" role="group" aria-label="캘린더 보기"><button aria-pressed={initialView === "month"} className={initialView === "month" ? "is-active" : ""} onClick={() => setView("month")} type="button">월간</button><button aria-pressed={initialView === "week"} className={initialView === "week" ? "is-active" : ""} onClick={() => setView("week")} type="button">주간</button></div>{toolbarAction}</div>
    <div className="calendar-search"><Search aria-hidden="true" size={18} /><input aria-label="캘린더 검색" onChange={(event) => setQuery(event.target.value)} placeholder="일정, 업무, 장소, 날짜 스티커 검색" value={query} />{query && <button aria-label="검색어 지우기" onClick={() => setQuery("")} type="button"><X size={16} /></button>}{query && <div className="calendar-search__results" role="listbox">{results.length ? results.slice(0, 20).map((result) => <button aria-selected="false" key={`${result.kind}-${result.id}`} onClick={() => { setQuery(""); setSelectedDate(result.date); navigate(result.date, initialView, `${result.kind}:${result.id}`); }} role="option" type="button"><strong>{result.title}</strong><span>{result.date}{result.time ? ` · ${result.time}` : ""} · {result.kind === "event" ? "일정" : result.kind === "task" ? "업무" : "날짜 스티커"}</span></button>) : <p>일치하는 일정이나 업무가 없습니다.</p>}</div>}</div>
    <div className="calendar-controls">
      <div className="calendar-controls__primary">
        <div className="calendar-entry-filter" role="group" aria-label="일정 종류 필터"><span className="calendar-filter-label">일정 종류</span><div>{entryFilterOptions.map(([value, label]) => <button aria-pressed={entryFilter === value} key={value} onClick={() => setEntryFilter(value)} type="button">{label}</button>)}</div></div>
        <button aria-label="날짜 스티커 추가" className="calendar-sticker-add" onClick={() => setStickerOpen(true)} ref={stickerButtonRef} type="button"><Plus aria-hidden="true" size={17} /><span className="calendar-sticker-add__full" aria-hidden="true">날짜 스티커</span><span className="calendar-sticker-add__short" aria-hidden="true">스티커</span></button>
      </div>
      <div className="calendar-sticker-filter" role="group" aria-label="스티커 표시 필터"><span className="calendar-filter-label">스티커 표시</span><div className="calendar-sticker-filter__scroller">{stickerFilterOptions.map(([value, label]) => <button aria-pressed={stickerFilter === value} key={value} onClick={() => setStickerFilter(value)} ref={stickerFilter === value ? activeStickerFilterRef : undefined} type="button">{label}</button>)}</div></div>
    </div>
    <div className={`calendar-workspace-layout${initialView === "week" ? " is-week" : ""}`}>
      <div className="calendar-grid-panel">{initialView === "month" ? <FullMonthCalendar events={periodEvents} highlight={highlight} month={selectedDate.slice(0, 7)} onDropDate={openDropMove} onMove={(value) => setMoveState({ value })} onSelectDate={setSelectedDate} schoolStickers={visibleStickers} selectedDate={selectedDate} tasks={periodTasks} today={today} /> : <FullWeekCalendar date={selectedDate} events={periodEvents} highlight={highlight} onDropDate={openDropMove} onMove={(value) => setMoveState({ value })} onSelectDate={setSelectedDate} selectedDate={selectedDate} stickers={visibleStickers} tasks={periodTasks} today={today} />}</div>
      <aside aria-label={`${selectedDate} 선택 날짜 상세`} className="calendar-detail-panel">
        <header className="calendar-detail-panel__header"><span>선택한 날짜</span><strong>{selectedDate.replaceAll("-", ". ")}</strong><small>일정 {selectedDateEvents.length} · 업무 {selectedDateTasks.length} · 스티커 {selectedDateStickers.length}</small></header>
        <EventList date={selectedDate} events={selectedDateEvents} workflow={workflow} />
        {selectedDateTasks.length > 0 && <section aria-label={`${selectedDate} 업무`} className="calendar-detail-panel__group"><h3>업무</h3>{selectedDateTasks.map((task) => <div className="calendar-detail-panel__item" key={task.id}><span className="calendar-item__indicator" /><strong>{task.title}</strong></div>)}</section>}
        {selectedDateStickers.length > 0 && <section aria-label={`${selectedDate} 스티커`} className="calendar-detail-panel__group"><h3>날짜 스티커</h3>{selectedDateStickers.map((sticker) => <div className="calendar-detail-panel__item" key={sticker.id}><span className="calendar-item__indicator" /><strong>{sticker.label}</strong></div>)}</section>}
      </aside>
    </div>
    <ResponsiveDetailPanel onClose={() => setStickerOpen(false)} open={stickerOpen} returnFocusRef={stickerButtonRef} title="날짜 스티커 추가"><SchoolStickerPicker stickers={stickers} today={selectedDate} /></ResponsiveDetailPanel>
    <button aria-hidden="true" className="calendar-move-focus" ref={moveButtonRef} tabIndex={-1} type="button" />
    <ResponsiveDetailPanel onClose={() => setMoveState(null)} open={Boolean(moveState)} returnFocusRef={moveButtonRef} title="날짜 변경">{moveState && <CalendarMovePanel move={moveState.value} newDate={moveState.newDate} onComplete={() => setMoveState(null)} />}</ResponsiveDetailPanel>
  </>;
}
