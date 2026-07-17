"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
const days = Array.from({ length: 42 }, (_, index) => index - 2);
const markedDays = new Set([3, 7, 11, 17, 22, 28]);

export function CompactMonthCalendar() {
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
        {weekdays.map((weekday) => <span className="calendar-weekday" key={weekday}>{weekday}</span>)}
      </div>
      <div className="calendar-grid" role="group" aria-label="2026년 7월 날짜 선택">
        {days.map((day, index) => {
          const isOutside = day < 1 || day > 31;
          const displayDay = day < 1 ? 30 + day : day > 31 ? day - 31 : day;
          const displayMonth = day < 1 ? 6 : day > 31 ? 8 : 7;
          return (
            <button
              aria-label={`${displayMonth}월 ${displayDay}일${markedDays.has(day) ? ", 등록 항목 있음" : ""}`}
              aria-pressed={!isOutside && selectedDay === day}
              className={`calendar-day${isOutside ? " is-outside" : ""}${
                !isOutside && selectedDay === day ? " is-selected" : ""
              }${day === 17 ? " is-today" : ""}`}
              key={`${day}-${index}`}
              onClick={() => !isOutside && setSelectedDay(day)}
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
              tabIndex={!isOutside && selectedDay === day ? 0 : -1}
              type="button"
            >
              <span className="calendar-day__number">{displayDay}</span>
              <span className="calendar-day__markers" aria-hidden="true">
                {markedDays.has(day) && <span className="marker" />}
                {[11, 22].includes(day) && <span className="marker marker--deadline" />}
                {day === 17 && <span className="marker marker--exercise" />}
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
