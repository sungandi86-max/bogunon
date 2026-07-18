"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { ExerciseLogDetails } from "@/components/exercise/exercise-log-details";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { ExerciseStickerPicker } from "@/components/exercise/exercise-sticker-picker";
import { exerciseCalendarSummary, exerciseStreak, groupExerciseLogsByDate } from "@/lib/exercise/stickers";
import type { ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

function shiftMonth(month: string, amount: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const value = new Date(Date.UTC(year ?? 2000, (monthNumber ?? 1) - 1 + amount, 1));
  return value.toISOString().slice(0, 7);
}

export function ExerciseStickerCalendar({ initialDate, logs, month, stickers }: { readonly initialDate: string; readonly logs: readonly ExerciseLogRow[]; readonly month: string; readonly stickers: readonly ExerciseStickerRow[] }) {
  const [selectedDate, setSelectedDate] = useState(initialDate.startsWith(month) ? initialDate : `${month}-01`);
  const first = new Date(`${month}-01T00:00:00Z`);
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const leading = first.getUTCDay();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - leading + 1;
    return day >= 1 && day <= lastDay ? `${month}-${String(day).padStart(2, "0")}` : null;
  });
  const logsByDate = groupExerciseLogsByDate(logs);
  const selectedLogs = logsByDate[selectedDate] ?? [];
  const uniqueDays = Object.keys(logsByDate).length;
  const stickerById = new Map(stickers.map((sticker) => [sticker.id, sticker]));
  return <div className="exercise-calendar-layout"><section className="exercise-month-card" aria-labelledby="exercise-calendar-title"><div className="exercise-calendar-toolbar"><div><p>이번 달 운동 {uniqueDays}일 · 연속 {exerciseStreak(logs, initialDate)}일</p><h2 id="exercise-calendar-title">{first.getUTCFullYear()}년 {first.getUTCMonth() + 1}월</h2></div><div><Link aria-label="이전 달" href={`/exercise?month=${shiftMonth(month, -1)}`}><ChevronLeft aria-hidden="true" size={20} /></Link><Link href={`/exercise?month=${initialDate.slice(0, 7)}`}>오늘</Link><Link aria-label="다음 달" href={`/exercise?month=${shiftMonth(month, 1)}`}><ChevronRight aria-hidden="true" size={20} /></Link></div></div><div className="exercise-calendar-weekdays" aria-hidden="true">{["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}</div><div className="exercise-calendar-grid">{cells.map((date, index) => {
    if (!date) return <span aria-hidden="true" className="exercise-calendar-day is-empty" key={`empty-${index}`} />;
    const summary = exerciseCalendarSummary(logsByDate, date);
    return <button aria-pressed={selectedDate === date} className={`${date === initialDate ? "is-today " : ""}${selectedDate === date ? "is-selected" : ""}`} key={date} onClick={() => setSelectedDate(date)} type="button"><time dateTime={date}>{Number(date.slice(-2))}</time><span className="exercise-calendar-day__stickers">{summary.visible.map((log) => { const sticker = stickerById.get(log.sticker_id); return sticker ? <ExerciseSticker eager key={log.id} sticker={sticker} size="sm" /> : null; })}{summary.remaining > 0 && <small>+{summary.remaining}</small>}</span></button>;
  })}</div></section><aside className="exercise-date-panel"><div><p>선택한 날짜</p><h2>{selectedDate.replaceAll("-", ". ")}</h2></div><ExerciseStickerPicker date={selectedDate} logs={logs} stickers={stickers} /><ExerciseLogDetails logs={selectedLogs} stickers={stickers} /></aside></div>;
}
