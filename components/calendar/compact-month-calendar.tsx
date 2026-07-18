"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useCalendarPreferences } from "@/components/calendar/calendar-preferences-provider";
import { calendarMonthCells, weekdayLabels } from "@/lib/calendar/preferences";

const markedDays = new Set([3, 7, 11, 17, 22, 28]);

export function CompactMonthCalendar() {
  const { weekStart } = useCalendarPreferences();
  const weekdays = weekdayLabels(weekStart);
  const days = calendarMonthCells("2026-07", weekStart);
  const [selectedDay, setSelectedDay] = useState(17);
  const dayRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveFocus = (index: number, offset: number) => {
    const nextIndex = Math.max(0, Math.min(days.length - 1, index + offset));
    dayRefs.current[nextIndex]?.focus();
  };

  return (
    <section className="compact-calendar" aria-labelledby="compact-calendar-title">
      <div className="calendar-toolbar">
        <h2 id="compact-calendar-title">2026년 7월</h2>
        <div className="calendar-toolbar__actions">
          <button className="calendar-icon-button" type="button" aria-label="이전 달">
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <button className="calendar-icon-button" type="button" aria-label="다음 달">
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>
      </div>
      <div className="calendar-grid" aria-hidden="true">
        {weekdays.map((weekday) => <span className={`calendar-weekday${weekday === "일" ? " is-sunday" : weekday === "토" ? " is-saturday" : ""}`} key={weekday}>{weekday}</span>)}
      </div>
      <div className="calendar-grid" role="group" aria-label="2026년 7월 날짜 선택">
        {days.map((date, index) => {
          const isOutside = date === null;
          const displayDay = date ? Number(date.slice(-2)) : 0;
          if (isOutside) return <span aria-hidden="true" className="calendar-day is-outside" key={`empty-${index}`} />;
          const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
          return (
            <button
              aria-label={`7월 ${displayDay}일${markedDays.has(displayDay) ? ", 등록 항목 있음" : ""}`}
              aria-pressed={selectedDay === displayDay}
              className={`calendar-day${weekday === 0 ? " is-sunday" : weekday === 6 ? " is-saturday" : ""}${
                selectedDay === displayDay ? " is-selected" : ""
              }${displayDay === 17 ? " is-today" : ""}`}
              key={date}
              onClick={() => setSelectedDay(displayDay)}
              onKeyDown={(event) => {
                const offsets: Partial<Record<string, number>> = {
                  ArrowLeft: -1,
                  ArrowRight: 1,
                  ArrowUp: -7,
                  ArrowDown: 7,
                };
                const offset = offsets[event.key];
                if (offset === undefined) return;
                event.preventDefault();
                moveFocus(index, offset);
              }}
              ref={(element) => { dayRefs.current[index] = element; }}
              tabIndex={selectedDay === displayDay ? 0 : -1}
              type="button"
            >
              <span className="calendar-day__number">{displayDay}</span>
              <span className="calendar-day__markers" aria-hidden="true">
                {markedDays.has(displayDay) && <span className="marker" />}
                {[11, 22].includes(displayDay) && <span className="marker marker--deadline" />}
                {displayDay === 17 && <span className="marker marker--exercise" />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="selected-date-summary" aria-live="polite">
        <strong>7월 {selectedDay}일</strong>
        <div className="selected-date-summary__stats"><span>일정 1</span><span>할 일 2</span><span>운동 1</span></div>
        <p className="selected-date-summary__empty">오후 3시 교직원 회의 외 3개 항목</p>
      </div>
      <div className="calendar-footer">
        <button className="text-action" type="button" onClick={() => setSelectedDay(17)}>오늘로 이동</button>
        <Link className="text-action" href="/calendar">전체 캘린더 열기</Link>
      </div>
    </section>
  );
}
