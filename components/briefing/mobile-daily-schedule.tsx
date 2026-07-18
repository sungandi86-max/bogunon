"use client";

import { CalendarClock, ChevronRight, ListChecks } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { nextScheduledEvent } from "@/lib/briefing/mobile-home";
import type { EventRow, TaskRow } from "@/types/database";

function taskMeta(task: TaskRow): string {
  if (task.due_date) return `${task.due_date.slice(5).replace("-", ".")} 마감`;
  if (task.status === "waitingForReply") return "회신 대기";
  return "오늘 예정";
}

export function MobileDailySchedule({ eventsToday, nowIso, tasks, today, upcomingEvents }: { readonly eventsToday: readonly EventRow[]; readonly nowIso: string; readonly tasks: readonly TaskRow[]; readonly today: string; readonly upcomingEvents: readonly EventRow[] }) {
  const [currentIso, setCurrentIso] = useState(nowIso);
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentIso(new Date().toISOString()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const next = nextScheduledEvent(upcomingEvents, new Date(currentIso));
  const nextTime = next ? `${next.event.start_date === today ? "" : `${next.event.start_date.slice(5).replace("-", ".")} `}${next.event.start_time?.slice(0, 5)}` : null;
  const emptyMessage = eventsToday.some((event) => !event.is_all_day && event.start_time) ? "오늘 예정된 일정이 모두 끝났습니다." : "예정된 다음 일정이 없습니다.";
  return <div className="mobile-daily-schedule"><section className="next-event-card" aria-labelledby="next-event-title"><div className="mobile-card-heading"><h2 id="next-event-title">다음 일정</h2><CalendarClock aria-hidden="true" size={20} /></div>{next ? <div className="next-event-card__body"><time>{nextTime}</time><div><strong>{next.event.title}</strong><span>{next.remainingLabel}</span></div></div> : <p>{emptyMessage}</p>}</section><section className="mobile-today-list" aria-labelledby="mobile-tasks-title"><div className="mobile-card-heading"><div><span>우선 {Math.min(tasks.length, 3)}건</span><h2 id="mobile-tasks-title">오늘 할 일</h2></div><ListChecks aria-hidden="true" size={20} /></div>{tasks.length ? <ul>{tasks.slice(0, 3).map((task) => <li key={task.id}><div><strong>{task.title}</strong><small>{taskMeta(task)}</small></div><span aria-label="업무 상세 보기"><ChevronRight aria-hidden="true" size={17} /></span></li>)}</ul> : <p>오늘 등록된 업무가 없습니다.</p>}{tasks.length > 3 && <Link href="/tasks">나머지 {tasks.length - 3}건 전체 보기</Link>}</section><section className="mobile-today-list mobile-today-events" aria-labelledby="mobile-events-title"><div className="mobile-card-heading"><div><span>시간순</span><h2 id="mobile-events-title">오늘 일정</h2></div><CalendarClock aria-hidden="true" size={20} /></div>{eventsToday.length ? <ol>{eventsToday.map((event) => <li key={event.id}><time>{event.is_all_day ? "종일" : event.start_time?.slice(0, 5)}</time><strong>{event.title}</strong></li>)}</ol> : <p>오늘 등록된 일정이 없습니다.</p>}</section></div>;
}
