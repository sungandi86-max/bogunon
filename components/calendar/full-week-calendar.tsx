"use client";

import { CalendarEntry, type MovableCalendarItem } from "@/components/calendar/calendar-entry";
import { CalendarDateSticker } from "@/components/calendar/calendar-date-sticker";
import { StickerManagementButton } from "@/components/calendar/sticker-management-button";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { calendarStickerCategory } from "@/lib/calendar-stickers/catalog";
import { dateSpan, taskCalendarDate } from "@/lib/calendar/smart-calendar";
import { weekRange } from "@/lib/work-items/date";
import type { CalendarStickerRow, EventRow, ExerciseLogRow, ExerciseStickerRow, TaskRow } from "@/types/database";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

interface Props { readonly date: string; readonly events: EventRow[]; readonly exerciseLogs: ExerciseLogRow[]; readonly exerciseStickers: ExerciseStickerRow[]; readonly highlight?: string | undefined; readonly onDropDate: (value: { readonly id: string; readonly kind: "event" | "task"; readonly date: string; readonly newDate: string }) => void; readonly onMove: (value: MovableCalendarItem) => void; readonly onSelectDate: (date: string) => void; readonly selectedDate: string; readonly stickers: CalendarStickerRow[]; readonly tasks: TaskRow[]; readonly today: string }

export function FullWeekCalendar({ date, events, exerciseLogs, exerciseStickers, highlight, onDropDate, onMove, onSelectDate, selectedDate, stickers, tasks, today }: Props) {
  const range = weekRange(date);
  const dates = dateSpan(range.first, range.last);
  const selectedEvents = events.filter((event) => event.start_date <= selectedDate && event.end_date >= selectedDate);
  const selectedTasks = tasks.filter((task) => taskCalendarDate(task) === selectedDate);
  return <section className="smart-week" aria-label={`${range.first}부터 ${range.last}까지 주간 캘린더`}>
    <div className="smart-week__scroller"><div className="smart-week__grid">{dates.map((day, index) => {
      const dayEvents = events.filter((event) => event.start_date <= day && event.end_date >= day);
      const dayTasks = tasks.filter((task) => taskCalendarDate(task) === day);
      const dayStickers = stickers.filter((item) => item.sticker_date <= day && (item.end_date ?? item.sticker_date) >= day);
      const daySchoolStickers = dayStickers.filter((item) => calendarStickerCategory(item.sticker_key) === "school");
      const dayPersonalStickers = dayStickers.filter((item) => calendarStickerCategory(item.sticker_key) === "personal");
      const dayExercise = exerciseLogs.filter((item) => item.exercise_date === day);
      const entries = [...dayEvents.map((item) => ({ item, kind: "event" as const })), ...dayTasks.map((item) => ({ item, kind: "task" as const }))];
      const hidden = Math.max(0, daySchoolStickers.length - 1) + Math.max(0, dayPersonalStickers.length - 1) + Math.max(0, entries.length - 3) + Math.max(0, dayExercise.length - 1);
      return <div className={`smart-week__day${day === selectedDate ? " is-selected" : ""}${day === today ? " is-today" : ""}`} key={day} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const raw = event.dataTransfer.getData("application/x-bogunon-calendar"); if (!raw) return; try { const moved = JSON.parse(raw) as { id: string; kind: "event" | "task"; date: string }; onDropDate({ ...moved, newDate: day }); } catch { return; } }}>
        <button aria-pressed={day === selectedDate} className="smart-week__date" onClick={() => onSelectDate(day)} type="button"><span>{weekdays[index]}</span><time dateTime={day}>{Number(day.slice(8))}</time></button>
        <div className={`calendar-date-stickers${daySchoolStickers.length > 0 ? " has-school" : ""}`}>{daySchoolStickers.slice(0, 1).map((item) => <StickerManagementButton date={day} key={item.id} label={item.label} recordId={item.id} recordType="calendar"><CalendarDateSticker compact highlighted={highlight === `sticker:${item.id}`} stickerKey={item.sticker_key} /></StickerManagementButton>)}{dayPersonalStickers.slice(0, 1).map((item) => <StickerManagementButton date={day} key={item.id} label={item.label} recordId={item.id} recordType="calendar"><CalendarDateSticker compact highlighted={highlight === `sticker:${item.id}`} stickerKey={item.sticker_key} /></StickerManagementButton>)}</div>
        <div className="smart-week__entries">{entries.slice(0, 3).map(({ item, kind }) => <CalendarEntry compact highlighted={highlight === `${kind}:${item.id}`} item={item} key={`${kind}-${item.id}`} kind={kind} onMove={onMove} />)}</div>
        {dayExercise.length > 0 && <div className="smart-week__exercise">{dayExercise.slice(0, 1).map((log) => { const sticker = exerciseStickers.find((item) => item.id === log.sticker_id); return sticker ? <StickerManagementButton date={day} key={log.id} label={sticker.label} recordId={log.id} recordType="exercise"><ExerciseSticker size="xs" sticker={sticker} /></StickerManagementButton> : null; })}</div>}
        {hidden > 0 && <small>+{hidden}</small>}
      </div>;
    })}</div></div>
    <div className="smart-week__selected" aria-live="polite"><h2>{selectedDate.slice(5).replace("-", "월 ")}일 일정</h2>{selectedEvents.length + selectedTasks.length ? <div>{[...selectedEvents.map((item) => ({ item, kind: "event" as const })), ...selectedTasks.map((item) => ({ item, kind: "task" as const }))].map(({ item, kind }) => <CalendarEntry item={item} key={`${kind}-${item.id}`} kind={kind} onMove={onMove} />)}</div> : <p>선택한 날짜에 등록된 일정이나 업무가 없습니다.</p>}</div>
  </section>;
}
