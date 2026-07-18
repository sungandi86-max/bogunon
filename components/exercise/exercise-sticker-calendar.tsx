"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ExerciseLogDetails } from "@/components/exercise/exercise-log-details";
import { StickerManagementButton } from "@/components/calendar/sticker-management-button";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { useCalendarPreferences } from "@/components/calendar/calendar-preferences-provider";
import { calendarMonthCells, weekdayLabels } from "@/lib/calendar/preferences";
import { exerciseCalendarSummary, exerciseStreak, groupExerciseLogsByDate } from "@/lib/exercise/stickers";
import type { ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

function shiftMonth(month: string, amount: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const value = new Date(Date.UTC(year ?? 2000, (monthNumber ?? 1) - 1 + amount, 1));
  return value.toISOString().slice(0, 7);
}

export function ExerciseStickerCalendar({ initialDate, logs, month, onSelectDate, selectedDate, stickers }: { readonly initialDate: string; readonly logs: readonly ExerciseLogRow[]; readonly month: string; readonly onSelectDate: (date: string) => void; readonly selectedDate: string; readonly stickers: readonly ExerciseStickerRow[] }) {
  const { weekStart } = useCalendarPreferences();
  const first = new Date(`${month}-01T00:00:00Z`);
  const cells = calendarMonthCells(month, weekStart);
  const logsByDate = groupExerciseLogsByDate(logs);
  const selectedLogs = logsByDate[selectedDate] ?? [];
  const uniqueDays = Object.keys(logsByDate).length;
  const stickerById = new Map(stickers.map((sticker) => [sticker.id, sticker]));
  return <div className="exercise-calendar-layout"><section className="exercise-month-card" aria-labelledby="exercise-calendar-title"><div className="exercise-calendar-toolbar"><div><p>이번 달 운동 {uniqueDays}일 · 연속 {exerciseStreak(logs, initialDate)}일</p><h2 id="exercise-calendar-title">{first.getUTCFullYear()}년 {first.getUTCMonth() + 1}월</h2></div><div><Link aria-label="이전 달" href={`/exercise?month=${shiftMonth(month, -1)}`}><ChevronLeft aria-hidden="true" size={20} /></Link><Link href={`/exercise?month=${initialDate.slice(0, 7)}`}>오늘</Link><Link aria-label="다음 달" href={`/exercise?month=${shiftMonth(month, 1)}`}><ChevronRight aria-hidden="true" size={20} /></Link></div></div><div className="exercise-calendar-weekdays" aria-hidden="true">{weekdayLabels(weekStart).map((day) => <span className={day === "일" ? "is-sunday" : day === "토" ? "is-saturday" : undefined} key={day}>{day}</span>)}</div><div className="exercise-calendar-grid">{cells.map((date, index) => {
    if (!date) return <span aria-hidden="true" className="exercise-calendar-day is-empty" key={`empty-${index}`} />;
    const summary = exerciseCalendarSummary(logsByDate, date);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    return <div className={`exercise-calendar-day${weekday === 0 ? " is-sunday" : weekday === 6 ? " is-saturday" : ""}${date === initialDate ? " is-today" : ""}${selectedDate === date ? " is-selected" : ""}`} key={date} onClick={() => onSelectDate(date)}><button aria-pressed={selectedDate === date} className="exercise-calendar-day__date" onClick={() => onSelectDate(date)} type="button"><time dateTime={date}>{Number(date.slice(-2))}</time></button><span className="exercise-calendar-day__stickers">{summary.visible.map((log) => { const sticker = stickerById.get(log.sticker_id); return sticker ? <StickerManagementButton date={date} key={log.id} label={sticker.label} recordId={log.id} recordType="exercise"><ExerciseSticker eager sticker={sticker} size="sm" /></StickerManagementButton> : null; })}{summary.remaining > 0 && <small>+{summary.remaining}</small>}</span></div>;
  })}</div></section><aside className="exercise-date-panel"><div><p>선택한 날짜</p><h2>{selectedDate.replaceAll("-", ". ")}</h2></div><ExerciseLogDetails logs={selectedLogs} stickers={stickers} /></aside></div>;
}
