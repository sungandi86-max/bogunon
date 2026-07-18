"use client";

import { CalendarClock, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";

import { nextScheduledEvent } from "@/lib/briefing/mobile-home";
import type { EventRow, TaskRow } from "@/types/database";

function taskMeta(task: TaskRow): string {
  if (task.due_date) return `${task.due_date.slice(5).replace("-", ".")} 마감`;
  if (task.status === "waitingForReply") return "회신 대기";
  return "오늘 예정";
}

export function MobileDailySchedule({ nowIso, tasks, today, upcomingEvents }: { readonly nowIso: string; readonly tasks: readonly TaskRow[]; readonly today: string; readonly upcomingEvents: readonly EventRow[] }) {
  const [currentIso, setCurrentIso] = useState(nowIso);
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentIso(new Date().toISOString()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const next = nextScheduledEvent(upcomingEvents, new Date(currentIso));
  const nextTime = next ? `${next.event.start_date === today ? "" : `${next.event.start_date.slice(5).replace("-", ".")} `}${next.event.start_time?.slice(0, 5)}` : null;
  const firstTask = tasks[0];
  if (!next && !firstTask) return null;

  return <section className="mobile-daily-compact" aria-label="오늘의 주요 항목">{next && <div className="mobile-daily-compact__row"><CalendarClock aria-hidden="true" size={17} /><span className="mobile-daily-compact__label">다음 일정</span><strong>{nextTime} {next.event.title}</strong><small>{next.remainingLabel}</small></div>}{firstTask && <div className="mobile-daily-compact__row"><ListChecks aria-hidden="true" size={17} /><span className="mobile-daily-compact__label">오늘 할 일</span><strong>{firstTask.title}</strong><small>{taskMeta(firstTask)}{tasks.length > 1 ? ` · 외 ${tasks.length - 1}건` : ""}</small></div>}</section>;
}
