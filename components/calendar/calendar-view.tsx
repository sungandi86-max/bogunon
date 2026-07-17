"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { CalendarCreateButton } from "@/components/calendar/calendar-create-button";
import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const views = ["월간", "주간", "목록"] as const;
type CalendarViewName = (typeof views)[number];

function StaticWeekView() {
  return (
    <section className="week-calendar" aria-label="2026년 7월 13일부터 19일까지 주간 캘린더">
      <div className="week-calendar__all-day"><strong>종일</strong><span>교직원 제출 현황 확인</span></div>
      <div className="week-calendar__timeline">
        <time>10:00</time><span>보건교육 자료 점검</span>
        <time>15:00</time><span>교직원 회의</span>
        <time>19:00</time><span>배드민턴 레슨</span>
      </div>
    </section>
  );
}

function StaticListView() {
  return (
    <section className="calendar-list" aria-label="7월 일정 목록">
      <div><time>7월 17일 15:00</time><strong>교직원 회의</strong><Badge tone="school">학교일정</Badge></div>
      <div><time>7월 17일 19:00</time><strong>배드민턴 레슨</strong><Badge tone="exercise">운동</Badge></div>
      <div><time>7월 18일</time><strong>감염병 예방교육 결과 제출</strong><Badge tone="deadline">마감</Badge></div>
    </section>
  );
}

export function CalendarView() {
  const [view, setView] = useState<CalendarViewName>("월간");

  return (
    <>
      <div className="calendar-toolbar calendar-page-toolbar">
        <div className="calendar-toolbar__actions">
          <Button aria-label="이전 기간" iconOnly variant="secondary"><ChevronLeft aria-hidden="true" size={18} /></Button>
          <Button variant="secondary">오늘</Button>
          <Button aria-label="다음 기간" iconOnly variant="secondary"><ChevronRight aria-hidden="true" size={18} /></Button>
        </div>
        <strong>2026년 7월</strong>
        <div className="calendar-view-switch" aria-label="캘린더 보기">
          {views.map((item) => (
            <button
              aria-pressed={view === item}
              className={view === item ? "is-active" : undefined}
              key={item}
              onClick={() => setView(item)}
              type="button"
            >{item}</button>
          ))}
        </div>
        <CalendarCreateButton />
      </div>
      {view === "월간" && <FullMonthCalendar />}
      {view === "주간" && <StaticWeekView />}
      {view === "목록" && <StaticListView />}
    </>
  );
}
