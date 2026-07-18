import { CalendarDays } from "lucide-react";

import { SchoolCalendarSticker } from "@/components/calendar/school-calendar-sticker";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { todayInSeoul } from "@/lib/work-items/date";
import type { CalendarStickerRow, EventRow, ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
const areaClass = { healthWork: "", schoolSchedule: "calendar-item--school", exercise: "calendar-item--exercise", personal: "calendar-item--personal", project: "calendar-item--project" } as const;
const areaLabel = { healthWork: "업무", schoolSchedule: "학교", exercise: "운동", personal: "개인", project: "프로젝트" } as const;

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function FullMonthCalendar({ events = [], exerciseLogs = [], exerciseStickers = [], month = "2026-07", schoolStickers = [], today = todayInSeoul() }: { readonly events?: EventRow[]; readonly exerciseLogs?: ExerciseLogRow[]; readonly exerciseStickers?: ExerciseStickerRow[]; readonly month?: string; readonly schoolStickers?: CalendarStickerRow[]; readonly today?: string }) {
  const [year = 1970, monthNumber = 1] = month.split("-").map(Number);
  const firstWeekday = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const cells = Array.from({ length: 42 }, (_, index) => index - firstWeekday + 1);
  return (
    <section className="full-calendar" aria-label={`${year}년 ${monthNumber}월 월간 캘린더`} role="grid">
      <div className="full-calendar__weekdays" role="row">{weekdays.map((weekday) => <span key={weekday} role="columnheader">{weekday}</span>)}</div>
      <div className="full-calendar__grid" role="rowgroup">
        {Array.from({ length: 6 }, (_, weekIndex) => (
          <div className="full-calendar__row" key={weekIndex} role="row">
            {cells.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, index) => {
              const inMonth = day >= 1 && day <= daysInMonth;
              const date = inMonth ? dateKey(year, monthNumber, day) : "";
              const dayEvents = inMonth ? events.filter((event) => event.start_date <= date && event.end_date >= date) : [];
              const daySchoolStickers = inMonth ? schoolStickers.filter((item) => item.sticker_date <= date && (item.end_date ?? item.sticker_date) >= date) : [];
              const dayExerciseLogs = inMonth ? exerciseLogs.filter((item) => item.exercise_date === date) : [];
              return <div aria-label={inMonth ? `${year}년 ${monthNumber}월 ${day}일, 일정 ${dayEvents.length}개, 날짜 스티커 ${daySchoolStickers.length}개, 운동 ${dayExerciseLogs.length}개` : "다른 달"} className={`full-calendar__cell${dayEvents.length || daySchoolStickers.length || dayExerciseLogs.length ? " has-item" : ""}${date === today ? " is-today" : ""}`} key={`${day}-${index}`} role="gridcell">
                {inMonth && <time dateTime={date}>{day}</time>}
                {daySchoolStickers.slice(0, 1).map((item) => <SchoolCalendarSticker compact key={item.id} stickerKey={item.sticker_key} />)}
                {dayEvents.slice(0, 2).map((event) => <div className={`calendar-item ${areaClass[event.area]}`} key={event.id}><CalendarDays aria-hidden="true" size={11} /><span className="calendar-item__area">{areaLabel[event.area]}</span>{event.title}</div>)}
                {dayExerciseLogs.length > 0 && <div className="calendar-exercise-stickers">{dayExerciseLogs.slice(0, 1).map((log) => { const sticker = exerciseStickers.find((item) => item.id === log.sticker_id); return sticker ? <ExerciseSticker key={log.id} size="xs" sticker={sticker} /> : null; })}</div>}
                {(dayEvents.length > 2 || daySchoolStickers.length > 1 || dayExerciseLogs.length > 1) && <small>+{Math.max(0, dayEvents.length - 2) + Math.max(0, daySchoolStickers.length - 1) + Math.max(0, dayExerciseLogs.length - 1)}개</small>}
              </div>;
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
