import { CalendarEntry, type MovableCalendarItem } from "@/components/calendar/calendar-entry";
import { CalendarDateSticker } from "@/components/calendar/calendar-date-sticker";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { calendarStickerCategory } from "@/lib/calendar-stickers/catalog";
import { taskCalendarDate } from "@/lib/calendar/smart-calendar";
import { todayInSeoul } from "@/lib/work-items/date";
import type { CalendarStickerRow, EventRow, ExerciseLogRow, ExerciseStickerRow, TaskRow } from "@/types/database";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
const dateKey = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

interface Props { readonly events?: EventRow[]; readonly exerciseLogs?: ExerciseLogRow[]; readonly exerciseStickers?: ExerciseStickerRow[]; readonly highlight?: string | undefined; readonly month?: string; readonly onDropDate?: (value: { readonly id: string; readonly kind: "event" | "task"; readonly date: string; readonly newDate: string }) => void; readonly onMove?: ((value: MovableCalendarItem) => void) | undefined; readonly onSelectDate?: (date: string) => void; readonly schoolStickers?: CalendarStickerRow[]; readonly selectedDate?: string; readonly tasks?: TaskRow[]; readonly today?: string }

export function FullMonthCalendar({ events = [], exerciseLogs = [], exerciseStickers = [], highlight, month = "2026-07", onDropDate, onMove, onSelectDate, schoolStickers = [], selectedDate, tasks = [], today = todayInSeoul() }: Props) {
  const [year = 1970, monthNumber = 1] = month.split("-").map(Number);
  const firstWeekday = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const cells = Array.from({ length: 42 }, (_, index) => index - firstWeekday + 1);
  return <section className="full-calendar" aria-label={`${year}년 ${monthNumber}월 월간 캘린더`} role="grid">
    <div className="full-calendar__weekdays" role="row">{weekdays.map((weekday) => <span key={weekday} role="columnheader">{weekday}</span>)}</div>
    <div className="full-calendar__grid" role="rowgroup">{Array.from({ length: 6 }, (_, weekIndex) => <div className="full-calendar__row" key={weekIndex} role="row">{cells.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, index) => {
      const inMonth = day >= 1 && day <= daysInMonth;
      const date = inMonth ? dateKey(year, monthNumber, day) : "";
      const dayEvents = inMonth ? events.filter((event) => event.start_date <= date && event.end_date >= date) : [];
      const dayTasks = inMonth ? tasks.filter((task) => taskCalendarDate(task) === date) : [];
      const dayStickers = inMonth ? schoolStickers.filter((item) => item.sticker_date <= date && (item.end_date ?? item.sticker_date) >= date) : [];
      const daySchoolStickers = dayStickers.filter((item) => calendarStickerCategory(item.sticker_key) === "school");
      const dayPersonalStickers = dayStickers.filter((item) => calendarStickerCategory(item.sticker_key) === "personal");
      const dayExercise = inMonth ? exerciseLogs.filter((item) => item.exercise_date === date) : [];
      const hidden = Math.max(0, dayEvents.length + dayTasks.length - 2) + Math.max(0, daySchoolStickers.length - 1) + Math.max(0, dayPersonalStickers.length - 1) + Math.max(0, dayExercise.length - 1);
      return <div aria-label={inMonth ? `${date}, 일정 ${dayEvents.length}개, 업무 ${dayTasks.length}개` : "다른 달"} className={`full-calendar__cell${date === today ? " is-today" : ""}${date === selectedDate ? " is-selected" : ""}`} key={`${day}-${index}`} onDragOver={(event) => { if (date) event.preventDefault(); }} onDrop={(event) => { const raw = event.dataTransfer.getData("application/x-bogunon-calendar"); if (!raw || !date) return; try { const moved = JSON.parse(raw) as { id: string; kind: "event" | "task"; date: string }; onDropDate?.({ ...moved, newDate: date }); } catch { return; } }} role="gridcell">
        {inMonth && <button aria-label={`${date} 선택`} className="calendar-date-button" onClick={() => onSelectDate?.(date)} type="button"><time dateTime={date}>{day}</time></button>}
        <div className={`calendar-date-stickers${daySchoolStickers.length > 0 ? " has-school" : ""}`}>{daySchoolStickers.slice(0, 1).map((item) => <CalendarDateSticker compact highlighted={highlight === `sticker:${item.id}`} key={item.id} stickerKey={item.sticker_key} />)}{dayPersonalStickers.slice(0, 1).map((item) => <CalendarDateSticker compact highlighted={highlight === `sticker:${item.id}`} key={item.id} stickerKey={item.sticker_key} />)}</div>
        {[...dayEvents.map((item) => ({ item, kind: "event" as const })), ...dayTasks.map((item) => ({ item, kind: "task" as const }))].slice(0, 2).map(({ item, kind }) => <CalendarEntry compact highlighted={highlight === `${kind}:${item.id}`} item={item} key={`${kind}-${item.id}`} kind={kind} onMove={onMove} />)}
        {dayExercise.length > 0 && <div className="calendar-exercise-stickers">{dayExercise.slice(0, 1).map((log) => { const sticker = exerciseStickers.find((item) => item.id === log.sticker_id); return sticker ? <ExerciseSticker key={log.id} size="xs" sticker={sticker} /> : null; })}</div>}
        {hidden > 0 && <small className="calendar-overflow">+{hidden}</small>}
      </div>;
    })}</div>)}</div>
  </section>;
}
