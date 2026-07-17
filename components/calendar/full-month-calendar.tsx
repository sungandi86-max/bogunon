import { CalendarDays } from "lucide-react";

import type { EventRow } from "@/types/database";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
const areaClass = { healthWork: "", schoolSchedule: "calendar-item--school", exercise: "calendar-item--exercise", personal: "calendar-item--personal", project: "calendar-item--project" } as const;

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function FullMonthCalendar({ events = [], month = "2026-07" }: { readonly events?: EventRow[]; readonly month?: string }) {
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
              return <div aria-label={inMonth ? `${year}년 ${monthNumber}월 ${day}일, 일정 ${dayEvents.length}개` : "다른 달"} className={`full-calendar__cell${dayEvents.length ? " has-item" : ""}`} key={`${day}-${index}`} role="gridcell">
                {inMonth && <time dateTime={date}>{day}</time>}
                {dayEvents.slice(0, 3).map((event) => <div className={`calendar-item ${areaClass[event.area]}`} key={event.id}><CalendarDays aria-hidden="true" size={11} />{event.title}</div>)}
                {dayEvents.length > 3 && <small>+{dayEvents.length - 3}개</small>}
              </div>;
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
